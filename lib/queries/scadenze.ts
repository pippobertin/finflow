/**
 * Scadenze query — fetches upcoming payment deadlines for an organization.
 * Extracted from app/api/client/scadenze/route.ts for reuse in report generation.
 */

import { prisma } from "@/lib/prisma";
import { addDays, addMonths, startOfDay, setDate, lastDayOfMonth } from "date-fns";

export interface ScadenzaItem {
  id: string;
  date: string;
  type:
    | "invoice_active"
    | "invoice_passive"
    | "recurring_expense"
    | "expected_payable"
    | "vat"
    | "f24"
    | "loan";
  label: string;
  amount: number;
  direction: "in" | "out";
  status?: string;
}

export interface ScadenzeResult {
  items: ScadenzaItem[];
  summary: { totalIn: number; totalOut: number; netFlow: number; count: number };
}

function computeNextOccurrence(
  startDate: Date,
  endDate: Date | null,
  frequency: string,
  dayOfMonth: number | null,
  today: Date,
): Date | null {
  const dom = dayOfMonth ?? startDate.getDate();
  let candidate = startDate >= today ? startDate : today;
  const lastDay = lastDayOfMonth(candidate).getDate();
  candidate = setDate(candidate, Math.min(dom, lastDay));
  if (candidate < today) {
    candidate = advanceByFrequency(candidate, frequency);
  }
  if (endDate && candidate > endDate) return null;
  return candidate;
}

function advanceByFrequency(date: Date, frequency: string): Date {
  switch (frequency) {
    case "MONTHLY":
      return addMonths(date, 1);
    case "QUARTERLY":
      return addMonths(date, 3);
    case "SEMIANNUAL":
      return addMonths(date, 6);
    case "ANNUAL":
      return addMonths(date, 12);
    default:
      return addMonths(date, 1);
  }
}

export async function fetchScadenze(
  organizationId: string,
  daysAhead: number,
): Promise<ScadenzeResult> {
  const today = startOfDay(new Date());
  const horizon = addDays(today, daysAhead);
  const items: ScadenzaItem[] = [];

  // 1. Pending invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: "PENDING",
      dueDate: { gte: today, lte: horizon },
    },
    orderBy: { dueDate: "asc" },
    select: {
      id: true,
      number: true,
      direction: true,
      dueDate: true,
      grossAmount: true,
      notes: true,
    },
  });

  for (const inv of invoices) {
    if (!inv.dueDate) continue;
    items.push({
      id: inv.id,
      date: inv.dueDate.toISOString().slice(0, 10),
      type: inv.direction === "ACTIVE" ? "invoice_active" : "invoice_passive",
      label: `Fattura ${inv.number}${inv.notes ? ` – ${inv.notes}` : ""}`,
      amount: Number(inv.grossAmount),
      direction: inv.direction === "ACTIVE" ? "in" : "out",
      status: "pending",
    });
  }

  // 2. Recurring expenses
  const recurring = await prisma.recurringExpense.findMany({
    where: {
      organizationId,
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
    select: {
      id: true,
      name: true,
      amount: true,
      frequency: true,
      startDate: true,
      endDate: true,
      dayOfMonth: true,
    },
  });

  for (const exp of recurring) {
    let nextDate = computeNextOccurrence(
      exp.startDate,
      exp.endDate,
      exp.frequency,
      exp.dayOfMonth,
      today,
    );
    if (!nextDate) continue;
    let iterations = 0;
    while (nextDate <= horizon && iterations < 12) {
      if (exp.endDate && nextDate > exp.endDate) break;
      items.push({
        id: `${exp.id}-${nextDate.toISOString().slice(0, 10)}`,
        date: nextDate.toISOString().slice(0, 10),
        type: "recurring_expense",
        label: exp.name,
        amount: Number(exp.amount),
        direction: "out",
      });
      nextDate = advanceByFrequency(nextDate, exp.frequency);
      iterations++;
    }
  }

  // 3. Expected payables
  const payables = await prisma.expectedPayable.findMany({
    where: {
      organizationId,
      status: "ACTIVE",
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
    select: {
      id: true,
      description: true,
      counterpart: true,
      amount: true,
      frequency: true,
      startDate: true,
      endDate: true,
      dayOfMonth: true,
    },
  });

  for (const pay of payables) {
    let nextDate = computeNextOccurrence(
      pay.startDate,
      pay.endDate,
      pay.frequency,
      pay.dayOfMonth,
      today,
    );
    if (!nextDate) continue;
    let iterations = 0;
    while (nextDate <= horizon && iterations < 12) {
      if (pay.endDate && nextDate > pay.endDate) break;
      items.push({
        id: `${pay.id}-${nextDate.toISOString().slice(0, 10)}`,
        date: nextDate.toISOString().slice(0, 10),
        type: "expected_payable",
        label: `${pay.description}${pay.counterpart ? ` — ${pay.counterpart}` : ""}`,
        amount: Number(pay.amount),
        direction: "out",
      });
      nextDate = advanceByFrequency(nextDate, pay.frequency);
      iterations++;
    }
  }

  // 4. VAT payments
  try {
    const vatSnapshots = await prisma.vatSnapshot.findMany({
      where: { organizationId, isPaid: false, dueDate: { gte: today, lte: horizon } },
      select: { id: true, periodType: true, periodStart: true, amountDue: true, dueDate: true },
    });
    for (const vs of vatSnapshots) {
      if (!vs.dueDate || Number(vs.amountDue) <= 0) continue;
      items.push({
        id: vs.id,
        date: vs.dueDate.toISOString().slice(0, 10),
        type: "vat",
        label: `IVA ${vs.periodType} ${vs.periodStart.toISOString().slice(0, 7)}`,
        amount: Number(vs.amountDue),
        direction: "out",
      });
    }
  } catch {
    // VatSnapshot table may not exist
  }

  // 5. F24
  try {
    const f24s = await prisma.f24Schedule.findMany({
      where: { organizationId, isPaid: false, dueDate: { gte: today, lte: horizon } },
      select: { id: true, periodLabel: true, codiceTributo: true, amount: true, dueDate: true },
    });
    for (const f of f24s) {
      items.push({
        id: f.id,
        date: f.dueDate.toISOString().slice(0, 10),
        type: "f24",
        label: `F24 ${f.periodLabel}${f.codiceTributo ? ` (${f.codiceTributo})` : ""}`,
        amount: Number(f.amount),
        direction: "out",
      });
    }
  } catch {
    // F24Schedule may not exist
  }

  // 6. Loans
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
      let nextDate = computeNextOccurrence(
        loan.startDate,
        loan.endDate,
        loan.frequency,
        loan.dayOfMonth,
        today,
      );
      if (!nextDate) continue;
      let iterations = 0;
      while (nextDate <= horizon && iterations < 12) {
        if (loan.endDate && nextDate > loan.endDate) break;
        items.push({
          id: `${loan.id}-${nextDate.toISOString().slice(0, 10)}`,
          date: nextDate.toISOString().slice(0, 10),
          type: "loan",
          label: `Rata ${loan.loanName}${loan.bankName ? ` — ${loan.bankName}` : ""}`,
          amount: Number(loan.installment),
          direction: "out",
        });
        nextDate = advanceByFrequency(nextDate, loan.frequency);
        iterations++;
      }
    }
  } catch {
    // LoanSchedule may not exist
  }

  items.sort((a, b) => a.date.localeCompare(b.date));

  const totalIn = items.filter((i) => i.direction === "in").reduce((s, i) => s + i.amount, 0);
  const totalOut = items.filter((i) => i.direction === "out").reduce((s, i) => s + i.amount, 0);

  return {
    items,
    summary: {
      totalIn: Math.round(totalIn),
      totalOut: Math.round(totalOut),
      netFlow: Math.round(totalIn - totalOut),
      count: items.length,
    },
  };
}
