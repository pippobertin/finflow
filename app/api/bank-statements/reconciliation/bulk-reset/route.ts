// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy reconciliation bulk-reset, behind LEGACY_RECONCILIATION flag. Will be removed in Block D.
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { findMatches } from "@/lib/reconciliation/reconciliation-engine";

/**
 * POST /api/bank-statements/reconciliation/bulk-reset
 *
 * 1. Find PAID invoices with paidAt in a suspicious date range (bulk-assigned dates)
 * 2. Reset them to PENDING, clear paidAt
 * 3. De-reconcile any bank statements linked to those invoices
 * 4. Re-run the reconciliation engine on all unreconciled bank statements
 * 5. Auto-apply matches
 *
 * Body (optional):
 *   { "dryRun": true }         — preview without applying changes
 *   { "dateFrom": "2026-03-24", "dateTo": "2026-03-25" } — custom suspicious range
 */
export async function POST(request: Request) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const dryRun = body.dryRun === true;

  // Suspicious date range: default 24-25 March 2026 (the bulk-assigned dates)
  const dateFrom = body.dateFrom
    ? new Date(body.dateFrom + "T00:00:00")
    : new Date("2026-03-24T00:00:00");
  const dateTo = body.dateTo
    ? new Date(body.dateTo + "T23:59:59")
    : new Date("2026-03-25T23:59:59");

  // Step 1: Find invoices with suspicious paidAt dates
  const suspiciousInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
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

  if (suspiciousInvoices.length === 0) {
    return Response.json({
      message: "Nessuna fattura trovata con paidAt nel range specificato.",
      suspiciousCount: 0,
      resetCount: 0,
      deReconciledCount: 0,
      newMatchesCount: 0,
      appliedCount: 0,
    });
  }

  // Step 2: Find bank statements reconciled to these invoices
  const suspiciousIds = suspiciousInvoices.map((i) => i.id);
  const reconciledBs = await prisma.bankStatement.findMany({
    where: {
      organizationId,
      reconciledInvoiceId: { in: suspiciousIds },
      isReconciled: true,
    },
    select: { id: true, reconciledInvoiceId: true },
  });

  if (dryRun) {
    // Preview mode: show what would happen, then find matches without applying
    // Temporarily describe what findMatches would see
    return Response.json({
      dryRun: true,
      suspiciousInvoices: suspiciousInvoices.map((i) => ({
        id: i.id,
        number: i.number,
        counterpart: i.counterpart,
        direction: i.direction,
        grossAmount: Number(i.grossAmount),
        paidAt: i.paidAt,
      })),
      suspiciousCount: suspiciousInvoices.length,
      reconciledBsCount: reconciledBs.length,
      message:
        `Trovate ${suspiciousInvoices.length} fatture con paidAt tra ${dateFrom.toISOString().slice(0, 10)} e ${dateTo.toISOString().slice(0, 10)}. ` +
        `${reconciledBs.length} movimenti bancari riconciliati da de-riconciliare. ` +
        `Invia la stessa richiesta senza dryRun per applicare.`,
    });
  }

  // Step 3: Reset invoices to PENDING
  await prisma.invoice.updateMany({
    where: { id: { in: suspiciousIds }, organizationId },
    data: { status: "PENDING", paidAt: null },
  });

  // Step 4: De-reconcile bank statements
  const reconciledBsIds = reconciledBs.map((bs) => bs.id);
  let deReconciledCount = 0;
  if (reconciledBsIds.length > 0) {
    const result = await prisma.bankStatement.updateMany({
      where: { id: { in: reconciledBsIds }, organizationId },
      data: { isReconciled: false, reconciledInvoiceId: null, reconciledAt: null },
    });
    deReconciledCount = result.count;
  }

  // Step 5: Re-run findMatches on ALL unreconciled bank statements
  const newMatches = await findMatches(organizationId);

  // Step 6: Auto-apply all matches
  let appliedCount = 0;
  if (newMatches.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const match of newMatches) {
        // Verify both still exist and are in expected state
        const bs = await tx.bankStatement.findFirst({
          where: { id: match.bankStatementId, organizationId, isReconciled: false },
        });
        if (!bs) continue;

        const inv = await tx.invoice.findFirst({
          where: { id: match.invoiceId, organizationId, status: "PENDING" },
        });
        if (!inv) continue;

        await tx.bankStatement.update({
          where: { id: match.bankStatementId },
          data: {
            isReconciled: true,
            reconciledInvoiceId: match.invoiceId,
            reconciledAt: new Date(),
          },
        });

        await tx.invoice.update({
          where: { id: match.invoiceId },
          data: {
            status: "PAID",
            paidAt: bs.date,
          },
        });

        appliedCount++;
      }
    });
  }

  // Count invoices that remained unmatched (still PENDING after reconciliation)
  const stillPending = await prisma.invoice.count({
    where: {
      organizationId,
      id: { in: suspiciousIds },
      status: "PENDING",
    },
  });

  return Response.json({
    message: `Riconciliazione completata.`,
    suspiciousCount: suspiciousInvoices.length,
    resetCount: suspiciousInvoices.length,
    deReconciledCount,
    newMatchesFound: newMatches.length,
    appliedCount,
    stillPendingCount: stillPending,
    matches: newMatches.map((m) => ({
      bankStatementDate: m.bankStatementDate,
      bankStatementDescription: m.bankStatementDescription.slice(0, 80),
      bankStatementAmount: m.bankStatementAmount,
      invoiceNumber: m.invoiceNumber,
      invoiceCounterpart: m.invoiceCounterpart,
      invoiceGrossAmount: m.invoiceGrossAmount,
      confidence: m.confidence,
    })),
  });
}
