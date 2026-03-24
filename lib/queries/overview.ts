import { prisma } from "@/lib/prisma";

export interface OverviewKpis {
  currentBalance: number;
  pendingCredits: number;
  pendingDebits: number;
  projectedBalance: number;
}

export interface BalanceChartPoint {
  date: string;
  balance: number;
  inflows: number;
  outflows: number;
}

export interface CategoryChartPoint {
  costCenter: string;
  color: string;
  income: number;
  expense: number;
}

export interface DistributionSlice {
  name: string;
  value: number;
  color: string;
}

export interface OverviewData {
  kpis: OverviewKpis;
  balanceChart: BalanceChartPoint[];
  categoryChart: CategoryChartPoint[];
  distribution: DistributionSlice[];
}

export async function getOverviewData(
  organizationId: string,
  costCenterIds?: string[],
): Promise<OverviewData> {
  // KPI: current balance — prefer manual override from settings, fallback to latest snapshot
  const [org, latestSnapshot, creditAgg, debitAgg] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    }),
    prisma.cashflowSnapshot.findFirst({
      where: { organizationId },
      orderBy: { date: "desc" },
    }),
    prisma.invoice.aggregate({
      where: {
        organizationId,
        direction: "ACTIVE",
        status: { in: ["PENDING", "OVERDUE"] },
        ...(costCenterIds?.length && { costCenterId: { in: costCenterIds } }),
      },
      _sum: { grossAmount: true },
    }),
    prisma.invoice.aggregate({
      where: {
        organizationId,
        direction: "PASSIVE",
        status: { in: ["PENDING", "OVERDUE"] },
        ...(costCenterIds?.length && { costCenterId: { in: costCenterIds } }),
      },
      _sum: { grossAmount: true },
    }),
  ]);

  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const manualBalance =
    typeof settings.currentBalance === "number" ? settings.currentBalance : null;
  const currentBalance = manualBalance ?? Number(latestSnapshot?.balance ?? 0);
  const pendingCredits = Number(creditAgg._sum.grossAmount ?? 0);
  const pendingDebits = Number(debitAgg._sum.grossAmount ?? 0);

  const kpis: OverviewKpis = {
    currentBalance,
    pendingCredits,
    pendingDebits,
    projectedBalance: currentBalance + pendingCredits - pendingDebits,
  };

  // Balance chart: cashflow snapshots
  const snapshots = await prisma.cashflowSnapshot.findMany({
    where: { organizationId },
    orderBy: { date: "asc" },
  });

  const balanceChart: BalanceChartPoint[] = snapshots.map((s) => ({
    date: `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, "0")}`,
    balance: Number(s.balance),
    inflows: Number(s.inflows),
    outflows: Number(s.outflows),
  }));

  // Category chart: invoices grouped by cost center
  const costCenters = await prisma.costCenter.findMany({
    where: {
      organizationId,
      ...(costCenterIds?.length && { id: { in: costCenterIds } }),
    },
    select: { id: true, name: true, color: true },
  });

  const categoryChart: CategoryChartPoint[] = [];
  for (const cc of costCenters) {
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.invoice.aggregate({
        where: { organizationId, costCenterId: cc.id, direction: "ACTIVE" },
        _sum: { grossAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { organizationId, costCenterId: cc.id, direction: "PASSIVE" },
        _sum: { grossAmount: true },
      }),
    ]);

    const income = Number(incomeAgg._sum.grossAmount ?? 0);
    const expense = Number(expenseAgg._sum.grossAmount ?? 0);
    if (income > 0 || expense > 0) {
      categoryChart.push({
        costCenter: cc.name,
        color: cc.color,
        income,
        expense,
      });
    }
  }

  // Distribution: expenses by cost center (for donut)
  const distribution: DistributionSlice[] = categoryChart
    .filter((c) => c.expense > 0)
    .map((c) => ({ name: c.costCenter, value: c.expense, color: c.color }));

  return { kpis, balanceChart, categoryChart, distribution };
}
