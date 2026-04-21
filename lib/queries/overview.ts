import { prisma } from "@/lib/prisma";
import { addDays, addMonths, startOfDay, isBefore, isAfter } from "date-fns";
import { buildDailyProjection } from "./cashflow-projection";

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

export interface ProjectedChartPoint {
  date: string;
  projected: number;
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
  projectionChart: ProjectedChartPoint[];
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

    // Credits: ALL pending ACTIVE invoices
    prisma.invoice.aggregate({
      where: {
        organizationId,
        direction: "ACTIVE",
        status: "PENDING",
      },
      _sum: { grossAmount: true },
    }),

    // Debits: ALL pending PASSIVE invoices
    prisma.invoice.aggregate({
      where: {
        organizationId,
        direction: "PASSIVE",
        status: "PENDING",
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

  // ── Current balance: EC_QUARTERLY snapshot + movements (same priority as financial detail) ──
  let currentBalance = 0;
  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const manualBalance =
    typeof settings.currentBalance === "number" ? settings.currentBalance : null;
  let usedBalanceSnapshot = false;

  try {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { organizationId, isDefault: true },
      select: { id: true },
    });
    if (bankAccount) {
      // Priority 1: EC_QUARTERLY snapshot (closing balance from bank statement)
      const ecSnapshot = await prisma.balanceSnapshot.findFirst({
        where: {
          bankAccountId: bankAccount.id,
          source: "EC_QUARTERLY",
          date: { lte: today },
        },
        orderBy: { date: "desc" },
        select: { balance: true, date: true, sourceFile: true },
      });

      let snapshotBalance: number | null = null;
      let snapshotDate: Date | null = null;
      let snapshotSourceFile: string | null = null;

      if (ecSnapshot) {
        snapshotBalance = Number(ecSnapshot.balance);
        snapshotDate = ecSnapshot.date;
        snapshotSourceFile = ecSnapshot.sourceFile;
        usedBalanceSnapshot = true;
      } else {
        // Priority 2: Any other snapshot (MANUAL, etc.)
        const anySnapshot = await prisma.balanceSnapshot.findFirst({
          where: {
            bankAccountId: bankAccount.id,
            date: { lte: today },
          },
          orderBy: { date: "desc" },
          select: { balance: true, date: true, sourceFile: true },
        });
        if (anySnapshot) {
          snapshotBalance = Number(anySnapshot.balance);
          snapshotDate = anySnapshot.date;
          snapshotSourceFile = anySnapshot.sourceFile;
          usedBalanceSnapshot = true;
        }
      }

      if (snapshotBalance !== null && snapshotDate !== null) {
        // Add movements after snapshot date up to today,
        // excluding movements from the EC source file itself (already accounted for in the snapshot balance)
        const movementsAfter = await prisma.bankStatement.findMany({
          where: {
            organizationId,
            date: { gt: snapshotDate, lte: today },
            ...(snapshotSourceFile ? { NOT: { sourceFile: snapshotSourceFile } } : {}),
          },
          select: { amount: true },
        });
        const movementSum = movementsAfter.reduce((s, bs) => s + Number(bs.amount), 0);
        currentBalance = snapshotBalance + movementSum;
      }
    }
  } catch {
    // BalanceSnapshot table may not exist
  }

  if (!usedBalanceSnapshot) {
    // Priority 3: manualBalance from settings
    currentBalance = manualBalance ?? Number(latestSnapshot?.balance ?? 0);
  }

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

  // ── Balance chart (aggregated from bank statements) ─────────
  const allStatements = await prisma.bankStatement.findMany({
    where: { organizationId },
    orderBy: { date: "asc" },
    select: { date: true, amount: true },
  });

  // Group by month and compute inflows / outflows
  const monthMap = new Map<string, { inflows: number; outflows: number }>();
  for (const bs of allStatements) {
    const key = `${bs.date.getFullYear()}-${String(bs.date.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key) ?? { inflows: 0, outflows: 0 };
    const amt = Number(bs.amount);
    if (amt >= 0) entry.inflows += amt;
    else entry.outflows += Math.abs(amt);
    monthMap.set(key, entry);
  }

  // Build running balance from currentBalance backwards
  const months = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  const totalNet = months.reduce((s, [, m]) => s + m.inflows - m.outflows, 0);
  let runningBalance = currentBalance - totalNet; // opening balance before first month

  const balanceChart: BalanceChartPoint[] = months.map(([date, m]) => {
    runningBalance += m.inflows - m.outflows;
    return {
      date,
      balance: Math.round(runningBalance * 100) / 100,
      inflows: Math.round(m.inflows * 100) / 100,
      outflows: Math.round(m.outflows * 100) / 100,
    };
  });

  // ── Projection from cashflow plan (same data as piano finanziario) ──
  const projectionChart: ProjectedChartPoint[] = [];
  try {
    const cashflow = await buildDailyProjection(organizationId);
    // Aggregate daily points to monthly: take end-of-month balance
    const monthlyProjected = new Map<string, number>();
    for (const dp of cashflow.projection) {
      const mk = dp.date.slice(0, 7); // "YYYY-MM"
      monthlyProjected.set(mk, dp.balance); // last day of month wins
    }
    // Only include months AFTER the last historical month
    const lastHistoricalMonth = months.length > 0 ? months[months.length - 1][0] : "";
    for (const [mk, bal] of Array.from(monthlyProjected.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      if (mk > lastHistoricalMonth) {
        projectionChart.push({
          date: mk,
          projected: Math.round(bal * 100) / 100,
        });
      }
    }
  } catch {
    // Cashflow projection may fail — chart will just show historical
  }

  // ── Revenue distribution (from active invoices — no cost center grouping in V2) ──
  const activeInvAgg = await prisma.invoice.aggregate({
    where: { organizationId, direction: "ACTIVE" },
    _sum: { grossAmount: true },
  });
  const revenueDistribution: RevenueDistributionSlice[] = [];
  const totalActiveRevenue = Number(activeInvAgg._sum.grossAmount ?? 0);
  if (totalActiveRevenue > 0) {
    revenueDistribution.push({ name: "Ricavi", value: totalActiveRevenue, color: "#059669" });
  }

  // ── Expense distribution (from cost centers: recurring, one-off, expected payables) ──
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
    let value = 0;

    // Recurring expenses
    const recAgg = await prisma.recurringExpense.aggregate({
      where: { organizationId, costCenterId: cc.id },
      _sum: { amount: true },
    });
    value += Number(recAgg._sum.amount ?? 0);

    // One-off expenses
    const oofAgg = await prisma.oneOffExpense.aggregate({
      where: { organizationId, costCenterId: cc.id },
      _sum: { amount: true },
    });
    value += Number(oofAgg._sum.amount ?? 0);

    // Expected payables
    try {
      const epAgg = await prisma.expectedPayable.aggregate({
        where: { organizationId, costCenterId: cc.id, status: "ACTIVE" },
        _sum: { amount: true },
      });
      value += Number(epAgg._sum.amount ?? 0);
    } catch {
      // table may not exist
    }

    if (value > 0) {
      distribution.push({ name: cc.name, value, color: cc.color });
    }
  }

  return { kpis, balanceChart, projectionChart, revenueDistribution, distribution };
}
