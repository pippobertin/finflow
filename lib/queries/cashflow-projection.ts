import { prisma } from "@/lib/prisma";
import { addDays, addMonths, format, isBefore, isAfter, startOfDay } from "date-fns";
import type { CashflowProjectionResult, DailyProjectionPoint } from "@/lib/types/cashflow";

const PROJECTION_DAYS = 180;

/**
 * Build a daily cashflow projection for up to 180 days.
 * Sources: bank statements (starting balance), pending invoices (by dueDate),
 * active recurring expenses (expanded), unpaid one-off expenses.
 */
export async function buildDailyProjection(
  organizationId: string,
  costCenterIds?: string[],
): Promise<CashflowProjectionResult> {
  const today = startOfDay(new Date());
  const endDate = addDays(today, PROJECTION_DAYS);
  const ccFilter = costCenterIds?.length ? { costCenterId: { in: costCenterIds } } : {};

  // 6 queries in parallel
  const [
    org,
    lastBankStatement,
    activeInvoices,
    passiveInvoices,
    recurringExpenses,
    oneOffExpenses,
  ] = await Promise.all([
    // Manual balance override from settings
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    }),

    // Last bank statement for starting balance (fallback)
    prisma.bankStatement.findFirst({
      where: { organizationId, ...ccFilter },
      orderBy: { date: "desc" },
      select: { balance: true, date: true },
    }),

    // Pending ACTIVE invoices
    prisma.invoice.findMany({
      where: {
        organizationId,
        direction: "ACTIVE",
        status: "PENDING",
        ...ccFilter,
      },
      select: { id: true, grossAmount: true, dueDate: true, date: true, paidAt: true },
    }),

    // Pending PASSIVE invoices
    prisma.invoice.findMany({
      where: {
        organizationId,
        direction: "PASSIVE",
        status: "PENDING",
        ...ccFilter,
      },
      select: { id: true, grossAmount: true, dueDate: true, date: true },
    }),

    // Active recurring expenses
    prisma.recurringExpense.findMany({
      where: {
        organizationId,
        ...ccFilter,
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      select: {
        id: true,
        amount: true,
        frequency: true,
        dayOfMonth: true,
        customDays: true,
        startDate: true,
        endDate: true,
      },
    }),

    // Unpaid one-off expenses
    prisma.oneOffExpense.findMany({
      where: {
        organizationId,
        isPaid: false,
        date: { gte: today, lte: endDate },
        ...ccFilter,
      },
      select: { id: true, amount: true, date: true },
    }),
  ]);

  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const manualBalance =
    typeof settings.currentBalance === "number" ? settings.currentBalance : null;
  const startingBalance =
    manualBalance ?? (lastBankStatement ? Number(lastBankStatement.balance) : 0);

  // Calculate avgDso from paid ACTIVE invoices
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      direction: "ACTIVE",
      status: "PAID",
      paidAt: { not: null },
    },
    select: { date: true, paidAt: true },
    take: 100,
    orderBy: { paidAt: "desc" },
  });

  let avgDso = 60; // default
  if (paidInvoices.length > 0) {
    const totalDays = paidInvoices.reduce((sum, inv) => {
      if (!inv.paidAt) return sum;
      return sum + Math.max(0, (inv.paidAt.getTime() - inv.date.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    avgDso = Math.round(totalDays / paidInvoices.length);
  }

  // Build daily map
  const dayMap = new Map<string, DailyProjectionPoint>();
  for (let d = 0; d < PROJECTION_DAYS; d++) {
    const date = addDays(today, d);
    const key = format(date, "yyyy-MM-dd");
    dayMap.set(key, {
      date: key,
      balance: 0,
      activeInvoices: 0,
      passiveInvoices: 0,
      recurringExpenses: 0,
      oneOffExpenses: 0,
      netFlow: 0,
    });
  }

  // Distribute active invoices (inflows) on dueDate
  let totalPendingActiveGross = 0;
  for (const inv of activeInvoices) {
    const amount = Number(inv.grossAmount);
    totalPendingActiveGross += amount;
    const dueDate = inv.dueDate ?? addDays(inv.date, avgDso);
    const key = format(startOfDay(dueDate), "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      point.activeInvoices += amount;
    }
  }

  // Distribute passive invoices (outflows) on dueDate
  for (const inv of passiveInvoices) {
    const amount = Number(inv.grossAmount);
    const dueDate = inv.dueDate ?? addDays(inv.date, 30);
    const key = format(startOfDay(dueDate), "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      point.passiveInvoices += amount;
    }
  }

  // Expand recurring expenses into daily entries
  for (const exp of recurringExpenses) {
    const amount = Number(exp.amount);
    const start = startOfDay(exp.startDate);
    const end = exp.endDate ? startOfDay(exp.endDate) : endDate;

    let current = start;
    while (isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
      if (!isBefore(current, today) && !isAfter(current, end)) {
        const key = format(current, "yyyy-MM-dd");
        const point = dayMap.get(key);
        if (point) {
          point.recurringExpenses += amount;
        }
      }

      // Advance to next occurrence
      switch (exp.frequency) {
        case "MONTHLY":
          current = addMonths(current, 1);
          if (exp.dayOfMonth) {
            current = new Date(current.getFullYear(), current.getMonth(), exp.dayOfMonth);
          }
          break;
        case "QUARTERLY":
          current = addMonths(current, 3);
          break;
        case "ANNUAL":
          current = addMonths(current, 12);
          break;
        case "CUSTOM":
          current = addDays(current, exp.customDays ?? 30);
          break;
        default:
          current = addMonths(current, 1);
      }
    }
  }

  // One-off expenses
  for (const exp of oneOffExpenses) {
    const key = format(startOfDay(exp.date), "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      point.oneOffExpenses += Number(exp.amount);
    }
  }

  // Calculate running balance and netFlow
  const projection: DailyProjectionPoint[] = [];
  let runningBalance = startingBalance;

  for (const [, point] of dayMap) {
    point.netFlow =
      point.activeInvoices - point.passiveInvoices - point.recurringExpenses - point.oneOffExpenses;
    runningBalance += point.netFlow;
    point.balance = Math.round(runningBalance * 100) / 100;
    projection.push(point);
  }

  return {
    startingBalance,
    asOfDate: format(today, "yyyy-MM-dd"),
    projection,
    totalPendingActiveGross,
    avgDso,
  };
}
