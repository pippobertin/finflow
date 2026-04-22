/**
 * Populate synthetic budget 2024 for BLM org from the golden-test snapshot.
 *
 * For each cdgCategory in the snapshot lines, creates 12 MonthlyBudget records
 * (one per month) with amount = balance / 12, so that budget YTD at month 12
 * equals the actual consuntivo — variance should be ~0%.
 *
 * Run: npx tsx scripts/_populate-budget-2024-blm.ts
 */

import { config } from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: path.join(__dirname, "..", ".env.local") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const YEAR = 2024;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function main() {
  console.log("=== Populate Budget 2024 for BLM ===\n");

  // 1. Find BLM organization
  const org = await prisma.organization.findFirst({
    where: { name: { contains: "BLM" } },
    select: { id: true, name: true },
  });

  if (!org) {
    console.error("BLM organization not found");
    process.exit(1);
  }
  console.log(`Organization: ${org.name} (${org.id})`);

  // 2. Find the locked snapshot for 2024
  const snapshot = await prisma.trialBalanceSnapshot.findFirst({
    where: {
      organizationId: org.id,
      isLocked: true,
      periodEnd: {
        gte: new Date("2024-01-01"),
        lte: new Date("2024-12-31"),
      },
    },
    orderBy: { periodEnd: "desc" },
    include: { lines: true },
  });

  if (!snapshot) {
    console.error("No locked snapshot found for BLM 2024");
    process.exit(1);
  }
  console.log(
    `Snapshot: ${snapshot.id} (${snapshot.sourceFilename}), period ${snapshot.periodStart.toISOString().slice(0, 10)} – ${snapshot.periodEnd.toISOString().slice(0, 10)}, ${snapshot.lines.length} lines`,
  );

  // 3. Aggregate balances by cdgCategory
  const categoryTotals = new Map<string, number>();
  for (const line of snapshot.lines) {
    if (!line.cdgCategory) continue;
    const balance = Number(line.balance);
    categoryTotals.set(line.cdgCategory, (categoryTotals.get(line.cdgCategory) || 0) + balance);
  }

  console.log(`\nCategories with data: ${categoryTotals.size}`);
  console.log("─".repeat(60));

  // 4. Upsert MonthlyBudget records
  let totalUpserted = 0;

  for (const [category, annualTotal] of categoryTotals) {
    const monthlyBase = round2(annualTotal / 12);
    const remainder = round2(annualTotal - monthlyBase * 12);

    for (let month = 1; month <= 12; month++) {
      // Put remainder in December to ensure exact annual sum
      const amount = month === 12 ? round2(monthlyBase + remainder) : monthlyBase;

      await prisma.monthlyBudget.upsert({
        where: {
          organizationId_year_month_cdgCategory: {
            organizationId: org.id,
            year: YEAR,
            month,
            cdgCategory: category as never,
          },
        },
        update: { amount },
        create: {
          organizationId: org.id,
          year: YEAR,
          month,
          cdgCategory: category as never,
          amount,
        },
      });
      totalUpserted++;
    }

    console.log(
      `  ${category.padEnd(35)} annual=${annualTotal.toFixed(2).padStart(12)}  monthly=${monthlyBase.toFixed(2).padStart(10)}  dec=${round2(
        monthlyBase + remainder,
      )
        .toFixed(2)
        .padStart(10)}`,
    );
  }

  console.log("─".repeat(60));
  console.log(`\nTotal records upserted: ${totalUpserted}`);
  console.log(`Categories: ${categoryTotals.size}`);
  console.log(`Year: ${YEAR}`);

  // 5. Verify round-trip
  const budgetRows = await prisma.monthlyBudget.findMany({
    where: { organizationId: org.id, year: YEAR },
  });

  const budgetByCategory = new Map<string, number>();
  for (const r of budgetRows) {
    budgetByCategory.set(
      r.cdgCategory,
      (budgetByCategory.get(r.cdgCategory) || 0) + Number(r.amount),
    );
  }

  console.log("\n=== Verification: budget annual total vs snapshot balance ===");
  let maxDrift = 0;
  for (const [cat, snapshotTotal] of categoryTotals) {
    const budgetTotal = budgetByCategory.get(cat) || 0;
    const drift = Math.abs(budgetTotal - snapshotTotal);
    maxDrift = Math.max(maxDrift, drift);
    if (drift > 0.02) {
      console.log(
        `  ⚠ ${cat}: snapshot=${snapshotTotal.toFixed(2)} budget=${budgetTotal.toFixed(2)} drift=${drift.toFixed(2)}`,
      );
    }
  }
  console.log(`Max drift: €${maxDrift.toFixed(4)} (should be < 0.02)`);
  console.log("\nDone.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
