import { prisma } from "@/lib/prisma";
import { addDays, addMonths, subDays, format, isBefore, isAfter, startOfDay } from "date-fns";
import type {
  CashflowProjectionResult,
  CashflowTimelineResult,
  DailyProjectionPoint,
} from "@/lib/types/cashflow";

const PROJECTION_DAYS = 365;
const HISTORY_DAYS = 90;

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

  // 7 queries in parallel
  const [
    org,
    lastBankStatement,
    activeInvoices,
    passiveInvoices,
    recurringExpenses,
    oneOffExpenses,
    futureReceivables,
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

    // Unpaid ACTIVE invoices (PENDING + OVERDUE)
    prisma.invoice.findMany({
      where: {
        organizationId,
        direction: "ACTIVE",
        status: { in: ["PENDING", "OVERDUE"] },
        ...ccFilter,
      },
      select: {
        id: true,
        number: true,
        counterpart: true,
        grossAmount: true,
        dueDate: true,
        date: true,
        paidAt: true,
      },
    }),

    // Unpaid PASSIVE invoices (PENDING + OVERDUE)
    prisma.invoice.findMany({
      where: {
        organizationId,
        direction: "PASSIVE",
        status: { in: ["PENDING", "OVERDUE"] },
        ...ccFilter,
      },
      select: {
        id: true,
        number: true,
        counterpart: true,
        grossAmount: true,
        dueDate: true,
        date: true,
      },
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
        name: true,
        amount: true,
        frequency: true,
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
      select: { id: true, name: true, amount: true, date: true },
    }),

    // Future receivables (PENDING + includeInForecast)
    prisma.futureReceivable.findMany({
      where: {
        organizationId,
        status: "PENDING",
        includeInForecast: true,
        ...ccFilter,
      },
      select: {
        id: true,
        description: true,
        counterpart: true,
        estimatedAmount: true,
        expectedInvoiceDate: true,
        expectedPaymentDate: true,
      },
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
      futureReceivables: 0,
      netFlow: 0,
      details: [],
    });
  }

  // Distribute active invoices (inflows) on expected collection date
  // Use invoice date + avgDso as best estimate (reflects actual payment behavior)
  // If that date is still in the past, project from today
  let totalPendingActiveGross = 0;
  for (const inv of activeInvoices) {
    const amount = Number(inv.grossAmount);
    totalPendingActiveGross += amount;
    const expectedCollection = startOfDay(addDays(inv.date, avgDso));
    const projected = isBefore(expectedCollection, today) ? today : expectedCollection;
    const key = format(projected, "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      point.activeInvoices += amount;
      point.details.push({
        id: inv.id,
        type: "activeInvoice",
        label: inv.number,
        counterpart: inv.counterpart,
        amount,
      });
    }
  }

  // Distribute passive invoices (outflows) on expected payment date
  // For overdue invoices, project payment from today
  for (const inv of passiveInvoices) {
    const amount = Number(inv.grossAmount);
    const expectedDate = inv.dueDate ?? addDays(inv.date, 30);
    const projected = isBefore(startOfDay(expectedDate), today) ? today : startOfDay(expectedDate);
    const key = format(projected, "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      point.passiveInvoices += amount;
      point.details.push({
        id: inv.id,
        type: "passiveInvoice",
        label: inv.number,
        counterpart: inv.counterpart,
        amount,
      });
    }
  }

  // Expand recurring expenses into daily entries
  for (const exp of recurringExpenses) {
    const amount = Number(exp.amount);
    const start = startOfDay(exp.startDate);
    const end = exp.endDate ? startOfDay(exp.endDate) : endDate;
    // Billing day: always the day-of-month from startDate
    const targetDay = start.getDate();

    let current = start;
    while (isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
      if (!isBefore(current, today) && !isAfter(current, end)) {
        const key = format(current, "yyyy-MM-dd");
        const point = dayMap.get(key);
        if (point) {
          point.recurringExpenses += amount;
          point.details.push({
            id: exp.id,
            type: "recurringExpense",
            label: exp.name,
            amount,
          });
        }
      }

      // Advance to next occurrence, preserving the target billing day
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

  // One-off expenses
  for (const exp of oneOffExpenses) {
    const amount = Number(exp.amount);
    const key = format(startOfDay(exp.date), "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      point.oneOffExpenses += amount;
      point.details.push({
        id: exp.id,
        type: "oneOffExpense",
        label: exp.name,
        amount,
      });
    }
  }

  // Future receivables (inflows)
  // Priority: expectedPaymentDate > expectedInvoiceDate + avgDso > skip
  for (const rec of futureReceivables) {
    const amount = Number(rec.estimatedAmount);
    let paymentDate: Date;
    if (rec.expectedPaymentDate) {
      paymentDate = startOfDay(rec.expectedPaymentDate);
    } else if (rec.expectedInvoiceDate) {
      paymentDate = startOfDay(addDays(rec.expectedInvoiceDate, avgDso));
    } else {
      continue; // no date available, skip
    }
    const projected = isBefore(paymentDate, today) ? today : paymentDate;
    const key = format(projected, "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      point.futureReceivables += amount;
      point.details.push({
        id: rec.id,
        type: "futureReceivable",
        label: rec.description,
        counterpart: rec.counterpart,
        amount,
      });
    }
  }

  // Calculate running balance and netFlow
  const projection: DailyProjectionPoint[] = [];
  let runningBalance = startingBalance;

  for (const [, point] of dayMap) {
    point.netFlow =
      point.activeInvoices +
      point.futureReceivables -
      point.passiveInvoices -
      point.recurringExpenses -
      point.oneOffExpenses;
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

/**
 * Build historical timeline from real data (bank statements + paid invoices/expenses).
 */
async function buildHistoricalTimeline(
  organizationId: string,
  costCenterIds?: string[],
  daysBack: number = HISTORY_DAYS,
): Promise<DailyProjectionPoint[]> {
  const today = startOfDay(new Date());
  const startDate = subDays(today, daysBack);
  const ccFilter = costCenterIds?.length ? { costCenterId: { in: costCenterIds } } : {};

  const [
    bankStatements,
    paidActiveInvoices,
    paidPassiveInvoices,
    recurringExpenses,
    paidOneOffExpenses,
  ] = await Promise.all([
    // Bank statements in the historical window
    prisma.bankStatement.findMany({
      where: {
        organizationId,
        ...ccFilter,
        date: { gte: startDate, lt: today },
      },
      orderBy: { date: "asc" },
      select: { balance: true, date: true },
    }),

    // Paid ACTIVE invoices (collections received)
    prisma.invoice.findMany({
      where: {
        organizationId,
        direction: "ACTIVE",
        status: "PAID",
        paidAt: { gte: startDate, lt: today },
        ...ccFilter,
      },
      select: { id: true, number: true, counterpart: true, grossAmount: true, paidAt: true },
    }),

    // Paid PASSIVE invoices (payments made)
    prisma.invoice.findMany({
      where: {
        organizationId,
        direction: "PASSIVE",
        status: "PAID",
        paidAt: { gte: startDate, lt: today },
        ...ccFilter,
      },
      select: { id: true, number: true, counterpart: true, grossAmount: true, paidAt: true },
    }),

    // Recurring expenses with occurrences in the period
    prisma.recurringExpense.findMany({
      where: {
        organizationId,
        ...ccFilter,
        startDate: { lte: today },
        OR: [{ endDate: null }, { endDate: { gte: startDate } }],
      },
      select: {
        id: true,
        name: true,
        amount: true,
        frequency: true,
        customDays: true,
        startDate: true,
        endDate: true,
      },
    }),

    // Paid one-off expenses in the period
    prisma.oneOffExpense.findMany({
      where: {
        organizationId,
        isPaid: true,
        date: { gte: startDate, lt: today },
        ...ccFilter,
      },
      select: { id: true, name: true, amount: true, date: true },
    }),
  ]);

  // Build daily map for historical days
  const dayMap = new Map<string, DailyProjectionPoint>();
  for (let d = 0; d < daysBack; d++) {
    const date = addDays(startDate, d);
    const key = format(date, "yyyy-MM-dd");
    dayMap.set(key, {
      date: key,
      balance: 0,
      activeInvoices: 0,
      passiveInvoices: 0,
      recurringExpenses: 0,
      oneOffExpenses: 0,
      futureReceivables: 0,
      netFlow: 0,
      details: [],
    });
  }

  // Build balance lookup from bank statements
  const balanceByDate = new Map<string, number>();
  for (const bs of bankStatements) {
    const key = format(startOfDay(bs.date), "yyyy-MM-dd");
    balanceByDate.set(key, Number(bs.balance));
  }

  // Distribute paid active invoices
  for (const inv of paidActiveInvoices) {
    if (!inv.paidAt) continue;
    const key = format(startOfDay(inv.paidAt), "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      const amount = Number(inv.grossAmount);
      point.activeInvoices += amount;
      point.details.push({
        id: inv.id,
        type: "activeInvoice",
        label: inv.number,
        counterpart: inv.counterpart,
        amount,
      });
    }
  }

  // Distribute paid passive invoices
  for (const inv of paidPassiveInvoices) {
    if (!inv.paidAt) continue;
    const key = format(startOfDay(inv.paidAt), "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      const amount = Number(inv.grossAmount);
      point.passiveInvoices += amount;
      point.details.push({
        id: inv.id,
        type: "passiveInvoice",
        label: inv.number,
        counterpart: inv.counterpart,
        amount,
      });
    }
  }

  // Expand recurring expenses into historical daily entries
  for (const exp of recurringExpenses) {
    const amount = Number(exp.amount);
    const expStart = startOfDay(exp.startDate);
    const expEnd = exp.endDate ? startOfDay(exp.endDate) : today;
    const targetDay = expStart.getDate();

    let current = expStart;
    while (isBefore(current, today)) {
      if (!isBefore(current, startDate) && !isAfter(current, expEnd)) {
        const key = format(current, "yyyy-MM-dd");
        const point = dayMap.get(key);
        if (point) {
          point.recurringExpenses += amount;
          point.details.push({
            id: exp.id,
            type: "recurringExpense",
            label: exp.name,
            amount,
          });
        }
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

  // Paid one-off expenses
  for (const exp of paidOneOffExpenses) {
    const key = format(startOfDay(exp.date), "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      const amount = Number(exp.amount);
      point.oneOffExpenses += amount;
      point.details.push({
        id: exp.id,
        type: "oneOffExpense",
        label: exp.name,
        amount,
      });
    }
  }

  // Calculate netFlow and assign balance (from bank statements, with interpolation)
  const history: DailyProjectionPoint[] = [];
  let lastKnownBalance: number | null = null;

  for (const [key, point] of dayMap) {
    point.netFlow =
      point.activeInvoices +
      point.futureReceivables -
      point.passiveInvoices -
      point.recurringExpenses -
      point.oneOffExpenses;

    const bsBalance = balanceByDate.get(key);
    if (bsBalance !== undefined) {
      point.balance = bsBalance;
      lastKnownBalance = bsBalance;
    } else if (lastKnownBalance !== null) {
      // Interpolate from last known balance + cumulative netFlow
      lastKnownBalance += point.netFlow;
      point.balance = Math.round(lastKnownBalance * 100) / 100;
    } else {
      point.balance = 0;
    }

    history.push(point);
  }

  return history;
}

/**
 * Build a full timeline: historical data + forward projection concatenated.
 */
export async function buildFullTimeline(
  organizationId: string,
  costCenterIds?: string[],
): Promise<CashflowTimelineResult> {
  const [history, projectionResult] = await Promise.all([
    buildHistoricalTimeline(organizationId, costCenterIds),
    buildDailyProjection(organizationId, costCenterIds),
  ]);

  const fullTimeline = [...history, ...projectionResult.projection];

  return {
    ...projectionResult,
    history,
    fullTimeline,
    historyLength: history.length,
  };
}
