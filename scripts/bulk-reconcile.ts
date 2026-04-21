// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy reconciliation script. Will be removed in Block D.
/**
 * Bulk re-reconciliation script.
 *
 * Usage: npx tsx scripts/bulk-reconcile.ts [--dry-run]
 *
 * 1. Finds PAID invoices with paidAt between 24-25 March 2026
 * 2. Resets them to PENDING
 * 3. De-reconciles associated bank statements
 * 4. Re-runs findMatches on all unreconciled bank statements
 * 5. Auto-applies matches, setting paidAt = bank statement date
 */
import { prisma } from "../lib/prisma";
import { findMatches } from "../lib/reconciliation/reconciliation-engine";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  // Get the organization (assuming single-org setup)
  const org = await prisma.organization.findFirst({ select: { id: true, name: true } });
  if (!org) {
    console.log("Nessuna organizzazione trovata.");
    process.exit(1);
  }
  console.log(`Organizzazione: ${org.name} (${org.id})`);

  const dateFrom = new Date("2026-03-24T00:00:00");
  const dateTo = new Date("2026-03-25T23:59:59");

  // Step 1: Find suspicious invoices
  const suspiciousInvoices = await prisma.invoice.findMany({
    where: {
      organizationId: org.id,
      status: "PAID",
      paidAt: { gte: dateFrom, lte: dateTo },
    },
    select: {
      id: true,
      number: true,
      counterpart: true,
      direction: true,
      grossAmount: true,
      paidAt: true,
    },
  });

  console.log(`\nFatture PAID con paidAt 24-25/Mar: ${suspiciousInvoices.length}`);
  for (const inv of suspiciousInvoices.slice(0, 10)) {
    console.log(
      `  ${inv.direction} Fatt. ${inv.number} - ${inv.counterpart} - ${Number(inv.grossAmount).toFixed(2)} € - paidAt: ${inv.paidAt?.toISOString().slice(0, 10)}`,
    );
  }
  if (suspiciousInvoices.length > 10) {
    console.log(`  ... e altre ${suspiciousInvoices.length - 10}`);
  }

  // Step 2: Find reconciled bank statements linked to these invoices
  const suspiciousIds = suspiciousInvoices.map((i) => i.id);
  const reconciledBs = await prisma.bankStatement.findMany({
    where: {
      organizationId: org.id,
      reconciledInvoiceId: { in: suspiciousIds },
      isReconciled: true,
    },
    select: { id: true, reconciledInvoiceId: true, description: true, amount: true, date: true },
  });
  console.log(`Movimenti bancari riconciliati a queste fatture: ${reconciledBs.length}`);

  if (dryRun) {
    console.log("\n[DRY RUN] Nessuna modifica applicata. Rimuovi --dry-run per eseguire.");
    await prisma.$disconnect();
    return;
  }

  // Step 3: Reset invoices to PENDING
  console.log("\nReset fatture a PENDING...");
  await prisma.invoice.updateMany({
    where: { id: { in: suspiciousIds }, organizationId: org.id },
    data: { status: "PENDING", paidAt: null },
  });
  console.log(`  ${suspiciousInvoices.length} fatture resettate.`);

  // Step 4: De-reconcile bank statements
  const reconciledBsIds = reconciledBs.map((bs) => bs.id);
  if (reconciledBsIds.length > 0) {
    console.log("De-riconciliazione movimenti bancari...");
    const result = await prisma.bankStatement.updateMany({
      where: { id: { in: reconciledBsIds }, organizationId: org.id },
      data: { isReconciled: false, reconciledInvoiceId: null, reconciledAt: null },
    });
    console.log(`  ${result.count} movimenti de-riconciliati.`);
  }

  // Step 5: Re-run findMatches
  console.log("\nRicerca nuovi match...");
  const newMatches = await findMatches(org.id);
  console.log(`Match trovati: ${newMatches.length}`);

  for (const m of newMatches) {
    console.log(
      `  [${m.confidence}] BS ${m.bankStatementDate.toISOString().slice(0, 10)} ${m.bankStatementAmount.toFixed(2)} € "${m.bankStatementDescription.slice(0, 50)}" → Fatt. ${m.invoiceNumber} (${m.invoiceCounterpart}) ${m.invoiceGrossAmount.toFixed(2)} €`,
    );
  }

  // Step 6: Auto-apply matches (one by one to avoid transaction timeout)
  if (newMatches.length > 0) {
    console.log("\nApplicazione match...");
    let appliedCount = 0;

    for (const match of newMatches) {
      try {
        const bs = await prisma.bankStatement.findFirst({
          where: { id: match.bankStatementId, organizationId: org.id, isReconciled: false },
        });
        if (!bs) continue;

        const inv = await prisma.invoice.findFirst({
          where: { id: match.invoiceId, organizationId: org.id, status: "PENDING" },
        });
        if (!inv) continue;

        await prisma.bankStatement.update({
          where: { id: match.bankStatementId },
          data: {
            isReconciled: true,
            reconciledInvoiceId: match.invoiceId,
            reconciledAt: new Date(),
          },
        });

        await prisma.invoice.update({
          where: { id: match.invoiceId },
          data: { status: "PAID", paidAt: bs.date },
        });

        appliedCount++;
      } catch (e) {
        console.error(
          `  Errore match BS ${match.bankStatementId} → Fatt. ${match.invoiceNumber}:`,
          e,
        );
      }
    }
    console.log(`  ${appliedCount} match applicati.`);
  }

  // Report: still pending
  const stillPending = await prisma.invoice.count({
    where: { organizationId: org.id, id: { in: suspiciousIds }, status: "PENDING" },
  });
  console.log(`\nFatture ancora PENDING (non matchate): ${stillPending}`);

  if (stillPending > 0) {
    const pendingList = await prisma.invoice.findMany({
      where: { organizationId: org.id, id: { in: suspiciousIds }, status: "PENDING" },
      select: { number: true, counterpart: true, grossAmount: true, direction: true },
    });
    for (const inv of pendingList) {
      console.log(
        `  ${inv.direction} Fatt. ${inv.number} - ${inv.counterpart} - ${Number(inv.grossAmount).toFixed(2)} €`,
      );
    }
  }

  await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
