import { prisma } from "@/lib/prisma";
import { addDays, addMonths, startOfDay, isBefore, isAfter } from "date-fns";

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

export interface RevenueDistributionSlice {
  name: string;
  value: number;
  color: string;
}

export interface DistributionSlice {
  name: string;
  value: number;
  color: string;
}

export interface OverviewData {
  kpis: OverviewKpis;
  balanceChart: BalanceChartPoint[];
  revenueDistribution: RevenueDistributionSlice[];
  distribution: DistributionSlice[];
}

/**
 * Sum recurring expense occurrences that fall within [from, to].
 */
function sumRecurringInRange(
  expenses: Array<{
    amount: unknown;
    frequency: string;
    startDate: Date;
    endDate: Date | null;
    customDays: number | null;
  }>,
  from: Date,
  to: Date,
): number {
  let total = 0;

  for (const exp of expenses) {
    const amount = Number(exp.amount);
    const start = startOfDay(exp.startDate);
    const end = exp.endDate ? startOfDay(exp.endDate) : to;
    const targetDay = start.getDate();

    let current = start;
    // Safety limit to avoid infinite loops
    let iterations = 0;
    while ((isBefore(current, to) || current.getTime() === to.getTime()) && iterations < 2000) {
      iterations++;
      if (!isBefore(current, from) && !isAfter(current, end)) {
        total += amount;
      }

      switch (exp.frequency) {
        case "MONTHLY": {
          const next = addMonths(current, 1);
          const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          current = new Date(next.getFullYear(), next.getMonth(), Math.min(targetDay, lastDay));
          break;
        }
        case "QUARTERLY": {
          const next = addMonths(current, 3);
          const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          current = new Date(next.getFullYear(), next.getMonth(), Math.min(targetDay, lastDay));
          break;
        }
        case "ANNUAL": {
          const next = addMonths(current, 12);
          const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          current = new Date(next.getFullYear(), next.getMonth(), Math.min(targetDay, lastDay));
          break;
        }
        case "CUSTOM":
          current = addDays(current, exp.customDays ?? 30);
          break;
        default: {
          const next = addMonths(current, 1);
          const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          current = new Date(next.getFullYear(), next.getMonth(), Math.min(targetDay, lastDay));
        }
      }
    }
  }

  return total;
}

export async function getOverviewData(
  organizationId: string,
  costCenterIds?: string[],
  dateFrom?: Date,
  dateTo?: Date,
): Promise<OverviewData> {
  const today = startOfDay(new Date());
  const from = dateFrom ? startOfDay(dateFrom) : today;
  const to = dateTo ? startOfDay(dateTo) : addDays(today, 90);

  const ccFilter = costCenterIds?.length ? { costCenterId: { in: costCenterIds } } : {};

  // ── KPIs ────────────────────────────────────────────────────
  const [
    org,
    latestSnapshot,
    creditAgg,
    debitAgg,
    futureReceivableAgg,
    recurringExpenses,
    oneOffAgg,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    }),
    prisma.cashflowSnapshot.findFirst({
      where: { organizationId },
      orderBy: { date: "desc" },
    }),

    // Credits: ACTIVE invoices (PENDING/OVERDUE) with dueDate in range
    prisma.invoice.aggregate({
      where: {
        organizationId,
        direction: "ACTIVE",
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { gte: from, lte: to },
        ...ccFilter,
      },
      _sum: { grossAmount: true },
    }),

    // Debits: PASSIVE invoices (PENDING/OVERDUE) with dueDate in range
    prisma.invoice.aggregate({
      where: {
        organizationId,
        direction: "PASSIVE",
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { gte: from, lte: to },
        ...ccFilter,
      },
      _sum: { grossAmount: true },
    }),

    // Future receivables (PENDING + includeInForecast) with expected dates in range
    prisma.futureReceivable.aggregate({
      where: {
        organizationId,
        status: "PENDING",
        includeInForecast: true,
        ...ccFilter,
        OR: [
          { expectedPaymentDate: { gte: from, lte: to } },
          { expectedPaymentDate: null, expectedInvoiceDate: { gte: from, lte: to } },
        ],
      },
      _sum: { estimatedAmount: true },
    }),

    // Recurring expenses (active ones, to be expanded in range)
    prisma.recurringExpense.findMany({
      where: {
        organizationId,
        ...ccFilter,
        startDate: { lte: to },
        OR: [{ endDate: null }, { endDate: { gte: from } }],
      },
      select: {
        amount: true,
        frequency: true,
        startDate: true,
        endDate: true,
        customDays: true,
      },
    }),

    // One-off unpaid expenses in range
    prisma.oneOffExpense.aggregate({
      where: {
        organizationId,
        isPaid: false,
        date: { gte: from, lte: to },
        ...ccFilter,
      },
      _sum: { amount: true },
    }),
  ]);

  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const manualBalance =
    typeof settings.currentBalance === "number" ? settings.currentBalance : null;
  const currentBalance = manualBalance ?? Number(latestSnapshot?.balance ?? 0);

  const invoiceCredits = Number(creditAgg._sum.grossAmount ?? 0);
  const futureReceivableCredits = Number(futureReceivableAgg._sum.estimatedAmount ?? 0);
  const pendingCredits = invoiceCredits + futureReceivableCredits;

  const invoiceDebits = Number(debitAgg._sum.grossAmount ?? 0);
  const recurringTotal = sumRecurringInRange(recurringExpenses, from, to);
  const oneOffTotal = Number(oneOffAgg._sum.amount ?? 0);
  const pendingDebits = invoiceDebits + recurringTotal + oneOffTotal;

  const kpis: OverviewKpis = {
    currentBalance,
    pendingCredits,
    pendingDebits,
    projectedBalance: currentBalance + pendingCredits - pendingDebits,
  };

  // ── Balance chart ───────────────────────────────────────────
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

  // ── Revenue distribution ────────────────────────────────────
  const revenueCenters = await prisma.costCenter.findMany({
    where: {
      organizationId,
      type: "REVENUE",
      ...(costCenterIds?.length && { id: { in: costCenterIds } }),
    },
    select: { id: true, name: true, color: true },
  });

  const revenueDistribution: RevenueDistributionSlice[] = [];
  for (const rc of revenueCenters) {
    const agg = await prisma.invoice.aggregate({
      where: { organizationId, costCenterId: rc.id, direction: "ACTIVE" },
      _sum: { grossAmount: true },
    });
    const value = Number(agg._sum.grossAmount ?? 0);
    if (value > 0) {
      revenueDistribution.push({ name: rc.name, value, color: rc.color });
    }
  }

  // ── Expense distribution ────────────────────────────────────
  const costCenters = await prisma.costCenter.findMany({
    where: {
      organizationId,
      type: "COST",
      ...(costCenterIds?.length && { id: { in: costCenterIds } }),
    },
    select: { id: true, name: true, color: true },
  });

  const distribution: DistributionSlice[] = [];
  for (const cc of costCenters) {
    const agg = await prisma.invoice.aggregate({
      where: { organizationId, costCenterId: cc.id, direction: "PASSIVE" },
      _sum: { grossAmount: true },
    });
    const value = Number(agg._sum.grossAmount ?? 0);
    if (value > 0) {
      distribution.push({ name: cc.name, value, color: cc.color });
    }
  }

  return { kpis, balanceChart, revenueDistribution, distribution };
}
