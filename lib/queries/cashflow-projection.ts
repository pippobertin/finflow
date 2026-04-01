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

/**
 * Build a daily cashflow projection for up to 365 days.
 * Sources: bank statements (starting balance), pending invoices (by dueDate),
 * active recurring expenses (expanded), unpaid one-off expenses,
 * payment events, and VAT due dates.
 *
 * DSO priority (highest → lowest):
 *   1. expectedCollectionDate (per-invoice override)
 *   2. max(dueDate, date + counterpartCustomDso) — per-counterpart DSO
 *   3. max(dueDate, date + avgDso) — global avg DSO from paid invoices
 */
export async function buildDailyProjection(
  organizationId: string,
  costCenterIds?: string[],
): Promise<CashflowProjectionResult> {
  const today = startOfDay(new Date());
  const endDate = addDays(today, PROJECTION_DAYS);
  const ccFilter = costCenterIds?.length ? { costCenterId: { in: costCenterIds } } : {};

  // Types for invoice/expense results (paymentEvents may be absent)
  type InvoiceWithPE = {
    id: string;
    number: string;
    counterpart: string;
    grossAmount: unknown;
    dueDate: Date | null;
    date: Date;
    paidAt?: Date | null;
    expectedCollectionDate?: Date | null;
    counterpartCustomDso?: number | null;
    paymentEvents: { amount: unknown }[];
  };
  type OneOffWithPE = {
    id: string;
    name: string;
    amount: unknown;
    date: Date;
    paymentEvents: { amount: unknown }[];
  };
  type ScheduledPE = {
    id: string;
    amount: unknown;
    eventDate: Date;
    invoiceId: string | null;
    oneOffExpenseId: string | null;
    notes: string | null;
  };

  // Only PENDING status now (OVERDUE is computed dynamically from dueDate)
  const pendingStatuses = ["PENDING"] as const;
  const phase2Statuses = ["PENDING"] as const;

  type RecurringExpRow = {
    id: string;
    name: string;
    amount: unknown;
    frequency: string;
    customDays: number | null;
    startDate: Date;
    endDate: Date | null;
  };
  type FutureRecRow = {
    id: string;
    description: string;
    counterpart: string;
    estimatedAmount: unknown;
    expectedInvoiceDate: Date | null;
    expectedPaymentDate: Date | null;
  };

  let org: { settings: unknown } | null = null;
  let lastBankStatement: { balance: unknown; date: Date } | null = null;
  let recurringExpenses: RecurringExpRow[] = [];
  let futureReceivables: FutureRecRow[] = [];
  let allInvoicesForVat: { direction: string; vatAmount: unknown; date: Date }[] = [];
  let activeInvoices: InvoiceWithPE[] = [];
  let passiveInvoices: InvoiceWithPE[] = [];
  let oneOffExpenses: OneOffWithPE[] = [];
  let paymentEvents: ScheduledPE[] = [];

  // ── Attempt 1: Full Phase 2 (all columns + paymentEvents + PARTIALLY_PAID) ──
  try {
    const results = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true },
      }),
      prisma.bankStatement.findFirst({
        where: { organizationId, ...ccFilter },
        orderBy: { date: "desc" },
        select: { balance: true, date: true },
      }),
      prisma.invoice.findMany({
        where: {
          organizationId,
          direction: "ACTIVE",
          status: { in: [...phase2Statuses] },
          bankStatements: { none: { isReconciled: true } },
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
          expectedCollectionDate: true,
          counterpartCustomDso: true,
          paymentEvents: { where: { isActual: true }, select: { amount: true } },
        },
      }),
      prisma.invoice.findMany({
        where: {
          organizationId,
          direction: "PASSIVE",
          status: { in: [...phase2Statuses] },
          // Exclude invoices already reconciled with a bank statement
          bankStatements: { none: { isReconciled: true } },
          ...ccFilter,
        },
        select: {
          id: true,
          number: true,
          counterpart: true,
          grossAmount: true,
          dueDate: true,
          date: true,
          paymentEvents: { where: { isActual: true }, select: { amount: true } },
        },
      }),
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
      prisma.oneOffExpense.findMany({
        where: { organizationId, isPaid: false, date: { gte: today, lte: endDate }, ...ccFilter },
        select: {
          id: true,
          name: true,
          amount: true,
          date: true,
          paymentEvents: { where: { isActual: true }, select: { amount: true } },
        },
      }),
      prisma.futureReceivable.findMany({
        where: { organizationId, status: "PENDING", includeInForecast: true, ...ccFilter },
        select: {
          id: true,
          description: true,
          counterpart: true,
          estimatedAmount: true,
          expectedInvoiceDate: true,
          expectedPaymentDate: true,
        },
      }),
      prisma.paymentEvent.findMany({
        where: { organizationId, isActual: false, eventDate: { gte: today, lte: endDate } },
        select: {
          id: true,
          amount: true,
          eventDate: true,
          invoiceId: true,
          oneOffExpenseId: true,
          notes: true,
        },
      }),
      prisma.invoice.findMany({
        where: { organizationId, date: { gte: new Date(today.getFullYear(), 0, 1), lte: endDate } },
        select: { direction: true, vatAmount: true, date: true },
      }),
    ]);
    [org, lastBankStatement] = results;
    activeInvoices = results[2];
    passiveInvoices = results[3];
    recurringExpenses = results[4];
    oneOffExpenses = results[5];
    futureReceivables = results[6];
    paymentEvents = results[7];
    allInvoicesForVat = results[8];
  } catch {
    // ── Attempt 2: Base schema only (no paymentEvents, no phase-2 columns, no PARTIALLY_PAID) ──
    try {
      const results = await Promise.all([
        prisma.organization.findUnique({
          where: { id: organizationId },
          select: { settings: true },
        }),
        prisma.bankStatement.findFirst({
          where: { organizationId, ...ccFilter },
          orderBy: { date: "desc" },
          select: { balance: true, date: true },
        }),
        prisma.invoice.findMany({
          where: {
            organizationId,
            direction: "ACTIVE",
            status: { in: [...pendingStatuses] },
            bankStatements: { none: { isReconciled: true } },
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
        prisma.invoice.findMany({
          where: {
            organizationId,
            direction: "PASSIVE",
            status: { in: [...pendingStatuses] },
            bankStatements: { none: { isReconciled: true } },
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
        prisma.oneOffExpense.findMany({
          where: { organizationId, isPaid: false, date: { gte: today, lte: endDate }, ...ccFilter },
          select: { id: true, name: true, amount: true, date: true },
        }),
        prisma.futureReceivable.findMany({
          where: { organizationId, status: "PENDING", includeInForecast: true, ...ccFilter },
          select: {
            id: true,
            description: true,
            counterpart: true,
            estimatedAmount: true,
            expectedInvoiceDate: true,
            expectedPaymentDate: true,
          },
        }),
        prisma.invoice.findMany({
          where: {
            organizationId,
            date: { gte: new Date(today.getFullYear(), 0, 1), lte: endDate },
          },
          select: { direction: true, vatAmount: true, date: true },
        }),
      ]);
      [org, lastBankStatement] = results;
      activeInvoices = results[2] as InvoiceWithPE[];
      passiveInvoices = results[3] as InvoiceWithPE[];
      recurringExpenses = results[4];
      oneOffExpenses = results[5] as OneOffWithPE[];
      futureReceivables = results[6];
      allInvoicesForVat = results[7];
      paymentEvents = [];
    } catch (e) {
      console.error("[cashflow-projection] Both query attempts failed:", e);
      throw e;
    }
  }

  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const manualBalance =
    typeof settings.currentBalance === "number" ? settings.currentBalance : null;

  // Forward-calc: EC_QUARTERLY snapshot first, then other snapshots, then manual fallback
  let startingBalance = 0;
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
        // Start from snapshot, add movements between snapshot date and today,
        // excluding movements from the EC source file itself (already in snapshot balance)
        const movementsAfterSnapshot = await prisma.bankStatement.findMany({
          where: {
            organizationId,
            date: { gt: snapshotDate, lte: today },
            ...(snapshotSourceFile ? { NOT: { sourceFile: snapshotSourceFile } } : {}),
          },
          select: { amount: true },
        });
        const movementSum = movementsAfterSnapshot.reduce((sum, bs) => sum + Number(bs.amount), 0);
        startingBalance = snapshotBalance + movementSum;
      }
    }
  } catch {
    // BalanceSnapshot table may not exist
  }

  if (!usedBalanceSnapshot) {
    // Priority 3: manualBalance from settings
    startingBalance = manualBalance ?? (lastBankStatement ? Number(lastBankStatement.balance) : 0);
  }

  // ── Calculate global avgDso from paid ACTIVE invoices ──
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

  let avgDso = 60;
  if (paidInvoices.length > 0) {
    const totalDays = paidInvoices.reduce((sum, inv) => {
      if (!inv.paidAt) return sum;
      return sum + Math.max(0, (inv.paidAt.getTime() - inv.date.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    avgDso = Math.round(totalDays / paidInvoices.length);
  }

  // ── Build daily map ──
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
      vatPayments: 0,
      netFlow: 0,
      details: [],
    });
  }

  // ── Distribute active invoices (inflows) — DSO 3-level priority ──
  let totalPendingActiveGross = 0;
  for (const inv of activeInvoices) {
    const grossAmount = Number(inv.grossAmount);
    // Subtract already-paid partial amounts
    const paidSoFar = (inv.paymentEvents ?? []).reduce((sum, pe) => sum + Number(pe.amount), 0);
    const amount = grossAmount - paidSoFar;
    if (amount <= 0) continue;

    totalPendingActiveGross += amount;

    // DSO priority: 1. expectedCollectionDate, 2. counterpartCustomDso, 3. avgDso
    // dueDate is contractual; DSO reflects actual payment behavior.
    // Use max(dueDate, date + dso) so we never predict collection before the due date.
    let expectedCollection: Date;
    if (inv.expectedCollectionDate) {
      expectedCollection = startOfDay(inv.expectedCollectionDate);
    } else {
      const dso = inv.counterpartCustomDso ?? avgDso;
      const dsoDate = startOfDay(addDays(inv.date, dso));
      const dueDate = inv.dueDate ? startOfDay(inv.dueDate) : dsoDate;
      expectedCollection = isAfter(dsoDate, dueDate) ? dsoDate : dueDate;
    }

    let projected: Date;
    if (!isBefore(expectedCollection, today)) {
      projected = expectedCollection;
    } else {
      // Overdue: distribute into the future based on how overdue it is.
      const effectiveDso = inv.counterpartCustomDso ?? avgDso;
      const daysOverdue = Math.round(
        (today.getTime() - expectedCollection.getTime()) / (1000 * 60 * 60 * 24),
      );
      const waitDays = Math.max(7, effectiveDso - daysOverdue);
      projected = startOfDay(addDays(today, Math.min(waitDays, effectiveDso)));
    }

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

  // ── Distribute passive invoices (outflows) — subtract partial payments ──
  for (const inv of passiveInvoices) {
    const grossAmount = Number(inv.grossAmount);
    const paidSoFar = (inv.paymentEvents ?? []).reduce((sum, pe) => sum + Number(pe.amount), 0);
    const amount = grossAmount - paidSoFar;
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
        counterpart: inv.counterpart,
        amount,
      });
    }
  }

  // ── Expand recurring expenses into daily entries ──
  for (const exp of recurringExpenses) {
    const amount = Number(exp.amount);
    const start = startOfDay(exp.startDate);
    const end = exp.endDate ? startOfDay(exp.endDate) : endDate;
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

  // ── One-off expenses (subtract partial payments) ──
  for (const exp of oneOffExpenses) {
    const grossAmount = Number(exp.amount);
    const paidSoFar = (exp.paymentEvents ?? []).reduce((sum, pe) => sum + Number(pe.amount), 0);
    const amount = grossAmount - paidSoFar;
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

  // ── Future receivables (inflows) ──
  for (const rec of futureReceivables) {
    const amount = Number(rec.estimatedAmount);
    let paymentDate: Date;
    if (rec.expectedPaymentDate) {
      paymentDate = startOfDay(rec.expectedPaymentDate);
    } else if (rec.expectedInvoiceDate) {
      paymentDate = startOfDay(addDays(rec.expectedInvoiceDate, avgDso));
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

  // ── Scheduled payment events (predicted future installments) ──
  for (const pe of paymentEvents) {
    const amount = Number(pe.amount);
    const key = format(startOfDay(pe.eventDate), "yyyy-MM-dd");
    const point = dayMap.get(key);
    if (point) {
      // Determine if it's an inflow or outflow based on the linked entity
      if (pe.invoiceId) {
        // We don't know direction here, treat as generic detail
        point.details.push({
          id: pe.id,
          type: "activeInvoice",
          label: pe.notes ?? "Pagamento previsto",
          amount,
        });
      } else if (pe.oneOffExpenseId) {
        point.oneOffExpenses += amount;
        point.details.push({
          id: pe.id,
          type: "oneOffExpense",
          label: pe.notes ?? "Rata spesa",
          amount,
        });
      }
    }
  }

  // ── IVA: calculate VAT outflows ──
  const vatPeriodicity = (settings.vatPeriodicity as VatPeriodicity) ?? "quarterly";
  const currentYear = today.getFullYear();

  // Generate periods for current and next year
  const vatPeriods = [
    ...generateVatPeriods(currentYear, vatPeriodicity),
    ...generateVatPeriods(currentYear + 1, vatPeriodicity),
  ];

  const vatInvoices = allInvoicesForVat.map((inv) => ({
    direction: inv.direction,
    vatAmount: Number(inv.vatAmount),
    date: inv.date,
  }));

  const vatCalcs = calculateVatForYear(vatPeriods, vatInvoices);
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

  // ── Calculate running balance and netFlow ──
  const projection: DailyProjectionPoint[] = [];
  let runningBalance = startingBalance;

  for (const [, point] of dayMap) {
    point.netFlow =
      point.activeInvoices +
      point.futureReceivables -
      point.passiveInvoices -
      point.recurringExpenses -
      point.oneOffExpenses -
      (point.vatPayments ?? 0);
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
 * Build historical timeline from real data.
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
    prisma.bankStatement.findMany({
      where: {
        organizationId,
        ...ccFilter,
        date: { gte: startDate, lt: today },
      },
      orderBy: { date: "asc" },
      select: { balance: true, date: true },
    }),

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
      vatPayments: 0,
      netFlow: 0,
      details: [],
    });
  }

  const balanceByDate = new Map<string, number>();
  for (const bs of bankStatements) {
    const key = format(startOfDay(bs.date), "yyyy-MM-dd");
    balanceByDate.set(key, Number(bs.balance));
  }

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
