import { prisma } from "@/lib/prisma";
import { addDays, addMonths, subDays, format, isBefore, isAfter, startOfDay } from "date-fns";
import type {
  CashflowProjectionResult,
  CashflowTimelineResult,
  DailyProjectionPoint,
} from "@/lib/types/cashflow";
import {
  generateVatPeriods,
  calculateVatForYear,
  getVatOutflows,
  type VatPeriodicity,
} from "@/lib/vat/vat-engine";

const PROJECTION_DAYS = 365;
const HISTORY_DAYS = 90;

// ─── Opening Balance ─────────────────────────────────────────────────────────
// Priority: EC_QUARTERLY snapshot → any snapshot → manual setting → last BS balance → 0

/** @internal — exported for unit testing */
export async function getOpeningBalance(organizationId: string, today: Date): Promise<number> {
  // Try BalanceSnapshot
  try {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { organizationId, isDefault: true },
      select: { id: true },
    });

    if (bankAccount) {
      // Priority 1: EC_QUARTERLY snapshot
      const ecSnapshot = await prisma.balanceSnapshot.findFirst({
        where: { bankAccountId: bankAccount.id, source: "EC_QUARTERLY", date: { lte: today } },
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
      } else {
        // Priority 2: any snapshot
        const anySnapshot = await prisma.balanceSnapshot.findFirst({
          where: { bankAccountId: bankAccount.id, date: { lte: today } },
          orderBy: { date: "desc" },
          select: { balance: true, date: true, sourceFile: true },
        });
        if (anySnapshot) {
          snapshotBalance = Number(anySnapshot.balance);
          snapshotDate = anySnapshot.date;
          snapshotSourceFile = anySnapshot.sourceFile;
        }
      }

      if (snapshotBalance !== null && snapshotDate !== null) {
        // Add movements between snapshot and today
        const movements = await prisma.bankStatement.findMany({
          where: {
            organizationId,
            date: { gt: snapshotDate, lte: today },
            ...(snapshotSourceFile ? { NOT: { sourceFile: snapshotSourceFile } } : {}),
          },
          select: { amount: true },
        });
        const movementSum = movements.reduce((sum, bs) => sum + Number(bs.amount), 0);
        return snapshotBalance + movementSum;
      }
    }
  } catch {
    // BalanceSnapshot table may not exist yet
  }

  // Priority 3: manual balance from org settings
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true },
  });
  const settings = (org?.settings as Record<string, unknown>) ?? {};
  if (typeof settings.currentBalance === "number") {
    return settings.currentBalance;
  }

  // Priority 4: last bank statement balance
  const lastBs = await prisma.bankStatement.findFirst({
    where: { organizationId },
    orderBy: { date: "desc" },
    select: { balance: true },
  });
  if (lastBs) return Number(lastBs.balance);

  return 0;
}

// ─── Recurring expansion helper ──────────────────────────────────────────────

/** @internal — exported for unit testing */
export function expandRecurring(
  startDate: Date,
  endDate: Date | null,
  frequency: string,
  customDays: number | null,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const dates: Date[] = [];
  const end = endDate ? startOfDay(endDate) : rangeEnd;
  const targetDay = startDate.getDate();
  let current = startOfDay(startDate);

  while (isBefore(current, rangeEnd) || current.getTime() === rangeEnd.getTime()) {
    if (!isBefore(current, rangeStart) && !isAfter(current, end)) {
      dates.push(current);
    }

    switch (frequency) {
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
        current = addDays(current, customDays ?? 30);
        break;
      default: {
        const next = addMonths(current, 1);
        const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        current = new Date(next.getFullYear(), next.getMonth(), Math.min(targetDay, lastDay));
      }
    }
  }
  return dates;
}

// ─── Expected payable expansion helper ───────────────────────────────────────

/** @internal — exported for unit testing */
export function expandPayable(
  startDate: Date,
  endDate: Date | null,
  frequency: string,
  dayOfMonth: number | null,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const dates: Date[] = [];
  const end = endDate ? startOfDay(endDate) : rangeEnd;
  const targetDay = dayOfMonth ?? startDate.getDate();
  let current = startOfDay(startDate);

  while (isBefore(current, rangeEnd) || current.getTime() === rangeEnd.getTime()) {
    if (!isBefore(current, rangeStart) && !isAfter(current, end)) {
      dates.push(current);
    }
    const months = frequency === "QUARTERLY" ? 3 : frequency === "ANNUAL" ? 12 : 1;
    const next = addMonths(current, months);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    current = new Date(next.getFullYear(), next.getMonth(), Math.min(targetDay, lastDay));
  }
  return dates;
}

// ─── Main projection ─────────────────────────────────────────────────────────

/**
 * Build a daily cashflow projection for up to 365 days.
 *
 * V2 paradigm — simplified cashflow projection.
 * Inflows:  pending ACTIVE invoices (by dueDate), FutureReceivable
 * Outflows: pending PASSIVE invoices (by dueDate), RecurringExpense,
 *           OneOffExpense, ExpectedPayable, VAT, F24Schedule, LoanSchedule
 */
export async function buildDailyProjection(
  organizationId: string,
): Promise<CashflowProjectionResult> {
  const today = startOfDay(new Date());
  const endDate = addDays(today, PROJECTION_DAYS);

  // ── Parallel data fetch ──────────────────────────────────────────────────
  const [
    startingBalance,
    activeInvoices,
    passiveInvoices,
    recurringExpenses,
    oneOffExpenses,
    futureReceivables,
    orgSettings,
  ] = await Promise.all([
    getOpeningBalance(organizationId, today),
    prisma.invoice.findMany({
      where: { organizationId, direction: "ACTIVE", status: "PENDING" },
      select: { id: true, number: true, grossAmount: true, dueDate: true, date: true },
    }),
    prisma.invoice.findMany({
      where: { organizationId, direction: "PASSIVE", status: "PENDING" },
      select: { id: true, number: true, grossAmount: true, dueDate: true, date: true },
    }),
    prisma.recurringExpense.findMany({
      where: {
        organizationId,
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
    prisma.oneOffExpense.findMany({
      where: { organizationId, isPaid: false, date: { gte: today, lte: endDate } },
      select: { id: true, name: true, amount: true, date: true },
    }),
    prisma.futureReceivable.findMany({
      where: { organizationId, status: "PENDING", includeInForecast: true },
      select: {
        id: true,
        description: true,
        counterpart: true,
        estimatedAmount: true,
        expectedInvoiceDate: true,
        expectedPaymentDate: true,
      },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    }),
  ]);

  // Fetch expected payables (table may not exist)
  let expectedPayables: {
    id: string;
    description: string;
    counterpart: string;
    amount: unknown;
    frequency: string;
    dayOfMonth: number | null;
    startDate: Date;
    endDate: Date | null;
  }[] = [];
  try {
    expectedPayables = await prisma.expectedPayable.findMany({
      where: { organizationId, status: "ACTIVE", includeInForecast: true },
      select: {
        id: true,
        description: true,
        counterpart: true,
        amount: true,
        frequency: true,
        dayOfMonth: true,
        startDate: true,
        endDate: true,
      },
    });
  } catch {
    expectedPayables = [];
  }

  const settings = (orgSettings?.settings as Record<string, unknown>) ?? {};

  // ── Build daily map ────────────────────────────────────────────────────────
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
      futurePayables: 0,
      vatPayments: 0,
      netFlow: 0,
      details: [],
    });
  }

  // ── Active invoices (inflows) — by dueDate or date+30 ─────────────────────
  let totalPendingActiveGross = 0;
  for (const inv of activeInvoices) {
    const amount = Number(inv.grossAmount);
    if (amount <= 0) continue;
    totalPendingActiveGross += amount;

    const expectedDate = inv.dueDate ?? addDays(inv.date, 30);
    const projected = isBefore(startOfDay(expectedDate), today) ? today : startOfDay(expectedDate);
    const key = format(projected, "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      point.activeInvoices += amount;
      point.details.push({
        id: inv.id,
        type: "activeInvoice",
        label: inv.number,
        amount,
      });
    }
  }

  // ── Passive invoices (outflows) — by dueDate or date+30 ──────────────────
  for (const inv of passiveInvoices) {
    const amount = Number(inv.grossAmount);
    if (amount <= 0) continue;

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
        amount,
      });
    }
  }

  // ── Recurring expenses (outflows) ─────────────────────────────────────────
  for (const exp of recurringExpenses) {
    const amount = Number(exp.amount);
    const occurrences = expandRecurring(
      exp.startDate,
      exp.endDate,
      exp.frequency,
      exp.customDays,
      today,
      endDate,
    );
    for (const date of occurrences) {
      const key = format(date, "yyyy-MM-dd");
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
  }

  // ── One-off expenses (outflows) ───────────────────────────────────────────
  for (const exp of oneOffExpenses) {
    const amount = Number(exp.amount);
    if (amount <= 0) continue;
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

  // ── Future receivables (inflows) ──────────────────────────────────────────
  for (const rec of futureReceivables) {
    const amount = Number(rec.estimatedAmount);
    let paymentDate: Date;
    if (rec.expectedPaymentDate) {
      paymentDate = startOfDay(rec.expectedPaymentDate);
    } else if (rec.expectedInvoiceDate) {
      paymentDate = startOfDay(addDays(rec.expectedInvoiceDate, 30));
    } else {
      continue;
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

  // ── Expected payables (recurring outflows) ────────────────────────────────
  for (const ep of expectedPayables) {
    const amt = Number(ep.amount);
    if (amt <= 0) continue;
    const occurrences = expandPayable(
      ep.startDate,
      ep.endDate,
      ep.frequency,
      ep.dayOfMonth,
      today,
      endDate,
    );
    for (const date of occurrences) {
      const key = format(date, "yyyy-MM-dd");
      const point = dayMap.get(key);
      if (point) {
        point.futurePayables += amt;
        point.details.push({
          id: ep.id,
          type: "expectedPayable",
          label: ep.description,
          counterpart: ep.counterpart,
          amount: amt,
        });
      }
    }
  }

  // ── VAT outflows ──────────────────────────────────────────────────────────
  // Try VatSnapshot rows first, fall back to vat-engine calculation
  let vatApplied = false;
  try {
    const unpaidVat = await prisma.vatSnapshot.findMany({
      where: { organizationId, isPaid: false, dueDate: { gte: today, lte: endDate } },
      select: { id: true, periodType: true, amountDue: true, dueDate: true },
    });
    if (unpaidVat.length > 0) {
      for (const vs of unpaidVat) {
        if (!vs.dueDate) continue;
        const amt = Number(vs.amountDue);
        if (amt <= 0) continue;
        const key = format(startOfDay(vs.dueDate), "yyyy-MM-dd");
        const point = dayMap.get(key);
        if (point) {
          point.vatPayments = (point.vatPayments ?? 0) + amt;
          point.details.push({
            id: vs.id,
            type: "vatPayment",
            label: `IVA ${vs.periodType}`,
            amount: amt,
          });
        }
      }
      vatApplied = true;
    }
  } catch {
    // VatSnapshot table may not exist
  }

  if (!vatApplied) {
    // Fall back to vat-engine calculation from invoice data
    const vatPeriodicity = (settings.vatPeriodicity as VatPeriodicity) ?? "quarterly";
    const currentYear = today.getFullYear();
    const vatPeriods = [
      ...generateVatPeriods(currentYear, vatPeriodicity),
      ...generateVatPeriods(currentYear + 1, vatPeriodicity),
    ];

    const allInvoicesForVat = await prisma.invoice.findMany({
      where: {
        organizationId,
        date: { gte: new Date(currentYear, 0, 1), lte: endDate },
      },
      select: { direction: true, vatAmount: true, date: true },
    });

    const vatInvoices = allInvoicesForVat.map((inv) => ({
      direction: inv.direction,
      vatAmount: Number(inv.vatAmount),
      date: inv.date,
    }));

    const vatCarryForward =
      typeof settings.vatCarryForward === "number" ? settings.vatCarryForward : 0;
    const vatCalcs = calculateVatForYear(vatPeriods, vatInvoices, vatCarryForward);
    const vatOutflows = getVatOutflows(vatCalcs, today);

    for (const vat of vatOutflows) {
      const point = dayMap.get(vat.date);
      if (point) {
        point.vatPayments = (point.vatPayments ?? 0) + vat.amount;
        point.details.push({
          id: `vat-${vat.date}`,
          type: "vatPayment",
          label: vat.label,
          amount: vat.amount,
        });
      }
    }
  }

  // ── F24 tax payments (outflows) ─────────────────────────────────────────
  try {
    const f24s = await prisma.f24Schedule.findMany({
      where: { organizationId, isPaid: false, dueDate: { gte: today, lte: endDate } },
      select: { id: true, periodLabel: true, codiceTributo: true, amount: true, dueDate: true },
    });
    for (const f of f24s) {
      const amt = Number(f.amount);
      if (amt <= 0) continue;
      const key = format(startOfDay(f.dueDate), "yyyy-MM-dd");
      const point = dayMap.get(key);
      if (point) {
        point.f24Payments = (point.f24Payments ?? 0) + amt;
        point.details.push({
          id: f.id,
          type: "f24Payment",
          label: `F24 ${f.periodLabel}${f.codiceTributo ? ` (${f.codiceTributo})` : ""}`,
          amount: amt,
        });
      }
    }
  } catch {
    // F24Schedule table may not exist
  }

  // ── Loan installments (outflows) ────────────────────────────────────────
  try {
    const loans = await prisma.loanSchedule.findMany({
      where: { organizationId, OR: [{ endDate: null }, { endDate: { gte: today } }] },
      select: {
        id: true,
        loanName: true,
        bankName: true,
        installment: true,
        frequency: true,
        startDate: true,
        endDate: true,
        dayOfMonth: true,
      },
    });
    for (const loan of loans) {
      const amt = Number(loan.installment);
      if (amt <= 0) continue;
      const occurrences = expandPayable(
        loan.startDate,
        loan.endDate,
        loan.frequency,
        loan.dayOfMonth,
        today,
        endDate,
      );
      for (const date of occurrences) {
        const key = format(date, "yyyy-MM-dd");
        const point = dayMap.get(key);
        if (point) {
          point.loanPayments = (point.loanPayments ?? 0) + amt;
          point.details.push({
            id: loan.id,
            type: "loanPayment",
            label: `Rata ${loan.loanName}${loan.bankName ? ` — ${loan.bankName}` : ""}`,
            amount: amt,
          });
        }
      }
    }
  } catch {
    // LoanSchedule table may not exist
  }

  // ── Running balance ───────────────────────────────────────────────────────
  const projection: DailyProjectionPoint[] = [];
  let runningBalance = startingBalance;

  for (const [, point] of dayMap) {
    point.netFlow =
      point.activeInvoices +
      point.futureReceivables -
      point.passiveInvoices -
      point.recurringExpenses -
      point.oneOffExpenses -
      point.futurePayables -
      (point.vatPayments ?? 0) -
      (point.f24Payments ?? 0) -
      (point.loanPayments ?? 0);
    runningBalance += point.netFlow;
    point.balance = Math.round(runningBalance * 100) / 100;
    projection.push(point);
  }

  return {
    startingBalance,
    asOfDate: format(today, "yyyy-MM-dd"),
    projection,
    totalPendingActiveGross,
    avgDso: 0, // V2: DSO no longer computed; kept for type compat
  };
}

// ─── Historical timeline ─────────────────────────────────────────────────────

async function buildHistoricalTimeline(
  organizationId: string,
  daysBack: number = HISTORY_DAYS,
): Promise<DailyProjectionPoint[]> {
  const today = startOfDay(new Date());
  const startDate = subDays(today, daysBack);

  const [
    bankStatements,
    paidActiveInvoices,
    paidPassiveInvoices,
    recurringExpenses,
    paidOneOffExpenses,
  ] = await Promise.all([
    prisma.bankStatement.findMany({
      where: { organizationId, date: { gte: startDate, lt: today } },
      orderBy: { date: "asc" },
      select: { balance: true, date: true },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        direction: "ACTIVE",
        status: "PAID",
        paidAt: { gte: startDate, lt: today },
      },
      select: { id: true, number: true, grossAmount: true, paidAt: true },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        direction: "PASSIVE",
        status: "PAID",
        paidAt: { gte: startDate, lt: today },
      },
      select: { id: true, number: true, grossAmount: true, paidAt: true },
    }),
    prisma.recurringExpense.findMany({
      where: {
        organizationId,
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
    prisma.oneOffExpense.findMany({
      where: { organizationId, isPaid: true, date: { gte: startDate, lt: today } },
      select: { id: true, name: true, amount: true, date: true },
    }),
  ]);

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
      futurePayables: 0,
      vatPayments: 0,
      netFlow: 0,
      details: [],
    });
  }

  // Balance from bank statements
  const balanceByDate = new Map<string, number>();
  for (const bs of bankStatements) {
    const key = format(startOfDay(bs.date), "yyyy-MM-dd");
    balanceByDate.set(key, Number(bs.balance));
  }

  // Paid active invoices (historical inflows)
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
        amount,
      });
    }
  }

  // Paid passive invoices (historical outflows)
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
        amount,
      });
    }
  }

  // Recurring expenses in historical period
  for (const exp of recurringExpenses) {
    const amount = Number(exp.amount);
    const occurrences = expandRecurring(
      exp.startDate,
      exp.endDate,
      exp.frequency,
      exp.customDays,
      startDate,
      today,
    );
    for (const date of occurrences) {
      if (!isBefore(date, today)) continue; // history only
      const key = format(date, "yyyy-MM-dd");
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

  // Running balance from bank statements
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
      lastKnownBalance += point.netFlow;
      point.balance = Math.round(lastKnownBalance * 100) / 100;
    } else {
      point.balance = 0;
    }

    history.push(point);
  }

  return history;
}

// ─── Full timeline (history + projection) ────────────────────────────────────

export async function buildFullTimeline(organizationId: string): Promise<CashflowTimelineResult> {
  const [history, projectionResult] = await Promise.all([
    buildHistoricalTimeline(organizationId),
    buildDailyProjection(organizationId),
  ]);

  const fullTimeline = [...history, ...projectionResult.projection];

  return {
    ...projectionResult,
    history,
    fullTimeline,
    historyLength: history.length,
  };
}
