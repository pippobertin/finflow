/**
 * Script: import new bank statements from updated CSV,
 * then compare forward-calc balance vs currentBalance.
 *
 * Usage: npx tsx scripts/update-bank-statements.ts [--dry-run]
 */
import fs from "fs";
import { prisma } from "../lib/prisma";

const CSV_PATH = "/Users/filippobertin/Downloads/Conti (8).csv";
const EC_Q4_2025_BALANCE = 55_987.75; // Saldo finale EC Q4 2025
const dryRun = process.argv.includes("--dry-run");

function parseItalianNumber(value: string): number {
  const cleaned = value.trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned);
}

function parseDate(dateStr: string): Date {
  // DD/MM/YY → Date (use noon to avoid timezone shifts)
  const parts = dateStr.trim().split("/");
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  let year = parseInt(parts[2]);
  if (year < 100) year += 2000;
  return new Date(year, month, day, 12, 0, 0);
}

/** Format Date as YYYY-MM-DD in local time (no UTC shift) */
function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface CsvRow {
  operaz: Date;
  valuta: Date;
  description: string;
  amount: number;
}

function parseCsv(filePath: string): CsvRow[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    if (cols.length < 4) continue;
    const operaz = parseDate(cols[0]);
    const valuta = parseDate(cols[1]);
    const description = cols[2].trim();
    const amount = parseItalianNumber(cols[3]);
    if (isNaN(amount)) continue;
    rows.push({ operaz, valuta, description, amount });
  }
  return rows;
}

async function main() {
  const org = await prisma.organization.findFirst({ select: { id: true, settings: true } });
  if (!org) {
    console.log("Nessuna organizzazione.");
    process.exit(1);
  }

  const settings = (org.settings as Record<string, unknown>) ?? {};
  const currentBalance = Number(settings.currentBalance) || 0;
  console.log("currentBalance (impostato):", currentBalance.toFixed(2));

  // Parse CSV
  const csvRows = parseCsv(CSV_PATH);
  console.log(`\nCSV: ${csvRows.length} righe parsate`);
  console.log(`  Prima: ${localDateStr(csvRows[0].operaz)} ${csvRows[0].description.slice(0, 50)}`);
  console.log(
    `  Ultima: ${localDateStr(csvRows[csvRows.length - 1].operaz)} ${csvRows[csvRows.length - 1].description.slice(0, 50)}`,
  );

  // Fetch existing bank statements for 2026
  const existingBs = await prisma.bankStatement.findMany({
    where: {
      organizationId: org.id,
      date: { gte: new Date("2026-01-01"), lte: new Date("2026-12-31") },
    },
    select: { id: true, date: true, description: true, amount: true },
    orderBy: { date: "asc" },
  });
  console.log(`\nDB: ${existingBs.length} movimenti 2026 esistenti`);

  // Build fingerprint set for existing records
  // Use date + amount as primary key (descriptions may differ between CSV versions)
  // For same date+amount combos, count occurrences to handle multiple same-day same-amount txns
  const existingCounts = new Map<string, number>();
  for (const bs of existingBs) {
    // Use local date from the DB (Prisma returns Date objects)
    const dateStr = localDateStr(bs.date);
    const amt = Number(bs.amount).toFixed(2);
    const key = `${dateStr}|${amt}`;
    existingCounts.set(key, (existingCounts.get(key) ?? 0) + 1);
  }

  // Find new rows by consuming existing counts
  const csvCounts = new Map<string, number>();
  const newRows: CsvRow[] = [];

  for (const row of csvRows) {
    const dateStr = localDateStr(row.operaz);
    const amt = row.amount.toFixed(2);
    const key = `${dateStr}|${amt}`;

    const alreadyCounted = csvCounts.get(key) ?? 0;
    const existingCount = existingCounts.get(key) ?? 0;

    if (alreadyCounted < existingCount) {
      // This CSV row matches an existing DB row
      csvCounts.set(key, alreadyCounted + 1);
    } else {
      // Genuinely new
      newRows.push(row);
      csvCounts.set(key, alreadyCounted + 1);
    }
  }

  console.log(`\nNuovi movimenti da importare: ${newRows.length}`);
  for (const r of newRows) {
    console.log(
      `  ${localDateStr(r.operaz)} ${r.amount >= 0 ? "+" : ""}${r.amount.toFixed(2)} ${r.description.slice(0, 70)}`,
    );
  }

  // Sanity check: see if CSV has fewer rows than DB for same dates (would mean CSV missing some)
  const csvDateRange = `${localDateStr(csvRows[0].operaz)} → ${localDateStr(csvRows[csvRows.length - 1].operaz)}`;
  const dbInRange = existingBs.filter(
    (bs) => bs.date >= csvRows[0].operaz && bs.date <= csvRows[csvRows.length - 1].operaz,
  );
  const csvCountInRange = csvRows.length;
  if (dbInRange.length > csvCountInRange) {
    console.log(
      `\n⚠️  DB ha ${dbInRange.length} movimenti nel range ${csvDateRange}, CSV ne ha ${csvCountInRange}.`,
    );
    console.log("   Il DB potrebbe avere duplicati da importazioni precedenti.");
  }

  // Import new rows
  if (!dryRun && newRows.length > 0) {
    console.log("\nImportazione...");
    let imported = 0;
    for (const row of newRows) {
      await prisma.bankStatement.create({
        data: {
          organizationId: org.id,
          date: row.operaz,
          description: row.description,
          amount: row.amount,
          balance: 0,
          sourceFile: "Conti (8).csv - update",
        },
      });
      imported++;
    }
    console.log(`  ${imported} movimenti importati.`);
  } else if (dryRun) {
    console.log("\n[DRY RUN] Nessuna modifica.");
  }

  // Calculate totals from CSV (ground truth, complete)
  const csvTotal = csvRows.reduce((sum, r) => sum + r.amount, 0);
  const forwardBalance = EC_Q4_2025_BALANCE + csvTotal;

  // Also calculate DB total for comparison
  const dbTotal = existingBs.reduce((sum, bs) => sum + Number(bs.amount), 0);
  const dbPlusNew = dbTotal + newRows.reduce((sum, r) => sum + r.amount, 0);

  console.log("\n========================================");
  console.log("  CONFRONTO SALDI");
  console.log("========================================");
  console.log(`Saldo EC 31/12/2025:              ${EC_Q4_2025_BALANCE.toFixed(2)}`);
  console.log(
    `Somma movimenti CSV 2026:         ${csvTotal >= 0 ? "+" : ""}${csvTotal.toFixed(2)} (${csvRows.length} mov)`,
  );
  console.log(
    `Somma movimenti DB 2026:          ${dbTotal >= 0 ? "+" : ""}${dbTotal.toFixed(2)} (${existingBs.length} mov)`,
  );
  console.log(
    `Somma DB + nuovi:                 ${dbPlusNew >= 0 ? "+" : ""}${dbPlusNew.toFixed(2)} (${existingBs.length + newRows.length} mov)`,
  );
  console.log(`Differenza CSV vs DB+nuovi:       ${(csvTotal - dbPlusNew).toFixed(2)}`);
  console.log(`----------------------------------------`);
  console.log(`Forward-calc (EC + CSV):          ${forwardBalance.toFixed(2)}`);
  console.log(`currentBalance (impostato):       ${currentBalance.toFixed(2)}`);
  console.log(`Differenza:                       ${(forwardBalance - currentBalance).toFixed(2)}`);
  console.log(`========================================`);

  // Extra info: what is the real balance if we trust the last bank statement running balance?
  const lastBs = existingBs[existingBs.length - 1];
  if (lastBs) {
    console.log(
      `\nUltimo mov DB: ${localDateStr(lastBs.date)} saldo_field=${Number(lastBs.balance).toFixed(2)}`,
    );
  }

  // Check for movements with valuta in 2025 (these would be counted in EC closing balance)
  const valuta2025rows = csvRows.filter((r) => r.valuta.getFullYear() === 2025);
  if (valuta2025rows.length > 0) {
    const valuta2025sum = valuta2025rows.reduce((s, r) => s + r.amount, 0);
    console.log(`\n⚠️  ${valuta2025rows.length} movimenti con data valuta 2025 (ma operaz 2026):`);
    for (const r of valuta2025rows) {
      console.log(
        `   valuta ${localDateStr(r.valuta)} operaz ${localDateStr(r.operaz)} ${r.amount.toFixed(2)} ${r.description.slice(0, 50)}`,
      );
    }
    console.log(`   Totale: ${valuta2025sum.toFixed(2)}`);
    console.log(`   Questi potrebbero essere già inclusi nel saldo EC Q4 2025.`);
    const adjustedForward = EC_Q4_2025_BALANCE + csvTotal - valuta2025sum;
    console.log(`   Forward-calc corretto (senza valuta 2025): ${adjustedForward.toFixed(2)}`);
  }

  // Reconciliation
  if (!dryRun && newRows.length > 0) {
    console.log("\n--- Riconciliazione nuovi movimenti ---");
    const { findMatches } = await import("../lib/reconciliation/reconciliation-engine");
    const matches = await findMatches(org.id);
    console.log(`Match trovati: ${matches.length}`);

    if (matches.length > 0) {
      let applied = 0;
      for (const match of matches) {
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
        applied++;
        console.log(
          `  [OK] ${localDateStr(bs.date)} ${Number(bs.amount).toFixed(2)}€ → Fatt. ${match.invoiceNumber} (${match.invoiceCounterpart})`,
        );
      }
      console.log(`  ${applied} match applicati.`);
    }
  }

  await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
