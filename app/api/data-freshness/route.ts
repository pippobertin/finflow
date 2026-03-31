import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { analyzeDataFreshness, getLinkedEcs } from "@/lib/analysis/data-freshness";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  try {
    const [freshness, linkedEcs] = await Promise.all([
      analyzeDataFreshness(organizationId),
      getLinkedEcs(organizationId),
    ]);
    return Response.json({ gaps: freshness.gaps, linkedEcs, allFiles: freshness.allFiles });
  } catch (err) {
    console.error("[data-freshness]", err);
    return Response.json({ gaps: [], linkedEcs: [], allFiles: [] });
  }
}

/** Link an EC to a quarter — creates DataPeriod + BalanceSnapshot */
export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const { period, sourceFile, closingBalance } = await request.json();
  if (!period || typeof period !== "string") {
    return Response.json({ error: "period richiesto (es. Q4_2025)" }, { status: 400 });
  }

  // Parse period → dates
  const match = period.match(/^Q(\d)_(\d{4})$/);
  if (!match) {
    return Response.json({ error: "Formato period non valido" }, { status: 400 });
  }
  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  const startMonth = (q - 1) * 3; // 0, 3, 6, 9
  // Use UTC noon to avoid timezone-shift issues with PostgreSQL
  const startDate = new Date(Date.UTC(year, startMonth, 1, 12, 0, 0));
  const endDate = new Date(Date.UTC(year, startMonth + 3, 0, 12, 0, 0)); // last day of quarter

  // Remove existing link for this quarter (allows re-linking / modifying)
  await prisma.dataPeriod.deleteMany({
    where: {
      organizationId,
      type: "EC_QUARTERLY",
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });

  // Create DataPeriod
  const dp = await prisma.dataPeriod.create({
    data: {
      organizationId,
      type: "EC_QUARTERLY",
      startDate,
      endDate,
      sourceFile: sourceFile || null,
    },
  });

  // Create BalanceSnapshot if closingBalance provided
  if (typeof closingBalance === "number" && !isNaN(closingBalance)) {
    try {
      const bankAccount = await prisma.bankAccount.findFirst({
        where: { organizationId, isDefault: true },
        select: { id: true },
      });
      if (bankAccount) {
        await prisma.balanceSnapshot.upsert({
          where: {
            bankAccountId_date_source: {
              bankAccountId: bankAccount.id,
              date: endDate,
              source: "EC_QUARTERLY",
            },
          },
          update: {
            balance: closingBalance,
            sourceFile: sourceFile || null,
            period: period,
          },
          create: {
            bankAccountId: bankAccount.id,
            date: endDate,
            balance: closingBalance,
            source: "EC_QUARTERLY",
            period: period,
            sourceFile: sourceFile || null,
          },
        });
      }
    } catch {
      // BalanceSnapshot table may not exist yet
    }
  }

  return Response.json({ id: dp.id, period });
}

/** Unlink an EC from a quarter — deletes DataPeriod + associated BalanceSnapshot */
export async function DELETE(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const { id } = await request.json();
  if (!id) {
    return Response.json({ error: "id richiesto" }, { status: 400 });
  }

  // Fetch DataPeriod to determine quarter dates before deleting
  const dp = await prisma.dataPeriod.findFirst({
    where: { id, organizationId },
    select: { startDate: true, endDate: true },
  });

  await prisma.dataPeriod.deleteMany({
    where: { id, organizationId },
  });

  // Also remove the associated BalanceSnapshot (EC_QUARTERLY at quarter end date)
  if (dp) {
    try {
      const bankAccount = await prisma.bankAccount.findFirst({
        where: { organizationId, isDefault: true },
        select: { id: true },
      });
      if (bankAccount) {
        await prisma.balanceSnapshot.deleteMany({
          where: {
            bankAccountId: bankAccount.id,
            source: "EC_QUARTERLY",
            date: dp.endDate,
          },
        });
      }
    } catch {
      // BalanceSnapshot table may not exist
    }
  }

  return Response.json({ success: true });
}
