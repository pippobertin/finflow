import { getClientOwnerSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/client/preconsuntivo/years
 * Returns years that have budget and/or trusted snapshot data,
 * plus the current year as fallback.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const { error, organizationId } = await getClientOwnerSession();
  if (error) return error;

  const currentYear = new Date().getFullYear();

  // Years with trusted snapshots
  const snapshots = await prisma.trialBalanceSnapshot.findMany({
    where: { organizationId, isTrusted: true },
    select: { periodEnd: true },
    distinct: ["periodEnd"],
  });
  const snapshotYears = new Set(snapshots.map((s) => s.periodEnd.getFullYear()));

  // Years with budget data
  const budgets = await prisma.monthlyBudget.findMany({
    where: { organizationId },
    select: { year: true },
    distinct: ["year"],
  });
  const budgetYears = new Set(budgets.map((b) => b.year));

  // Union + current year, sorted descending
  const allYears = new Set([...snapshotYears, ...budgetYears, currentYear]);
  const years = [...allYears].sort((a, b) => b - a);

  return Response.json({ years });
}
