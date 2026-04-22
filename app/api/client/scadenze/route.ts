import { NextRequest } from "next/server";
import { getClientSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { addDays, addMonths, startOfDay, setDate, lastDayOfMonth } from "date-fns";

export interface ScadenzaItem {
  id: string;
  date: string;
  type: "invoice_active" | "invoice_passive" | "recurring_expense" | "expected_payable" | "vat";
  label: string;
  amount: number;
  direction: "in" | "out";
  status?: string;
}

/**
 * Compute next occurrence date for a recurring item given its frequency,
 * startDate, dayOfMonth, and optional endDate.
 */
function computeNextOccurrence(
  startDate: Date,
  endDate: Date | null,
  frequency: string,
  dayOfMonth: number | null,
  today: Date,
): Date | null {
  const dom = dayOfMonth ?? startDate.getDate();
  let candidate = startDate >= today ? startDate : today;

  // Align to the correct day of month
  const lastDay = lastDayOfMonth(candidate).getDate();
  candidate = setDate(candidate, Math.min(dom, lastDay));
  if (candidate < today) {
    // Move to next period
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
    case "ANNUAL":
      return addMonths(date, 12);
    default:
      return addMonths(date, 1);
  }
}

/**
 * GET /api/client/scadenze
 *
 * Returns a unified payment schedule for the client:
 * - Pending active invoices (incassi attesi)
 * - Pending passive invoices (pagamenti dovuti)
 * - Recurring expenses (prossime scadenze)
 * - Expected payables (pagamenti programmati)
 * - VAT payments (from VatSnapshot)
 *
 * Query params:
 *   days=N — look-ahead window in days (default 90, max 365)
 */
export async function GET(request: NextRequest) {
  const { error, organizationId } = await getClientSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;
  const daysAhead = Math.min(parseInt(sp.get("days") ?? "90") || 90, 365);

  const today = startOfDay(new Date());
  const horizon = addDays(today, daysAhead);

  try {
    const items: ScadenzaItem[] = [];

    // 1. Pending invoices with due dates
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

    // 2. Recurring expenses — expand next occurrences within horizon
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

    // 3. Expected payables — expand occurrences within horizon
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

    // 4. VAT payments from VatSnapshot
    try {
      const vatSnapshots = await prisma.vatSnapshot.findMany({
        where: {
          organizationId,
          isPaid: false,
          dueDate: { gte: today, lte: horizon },
        },
        select: {
          id: true,
          periodType: true,
          periodStart: true,
          periodEnd: true,
          amountDue: true,
          dueDate: true,
        },
      });

      for (const vs of vatSnapshots) {
        if (!vs.dueDate || Number(vs.amountDue) <= 0) continue;
        const periodLabel = `${vs.periodType} ${vs.periodStart.toISOString().slice(0, 7)}`;
        items.push({
          id: vs.id,
          date: vs.dueDate.toISOString().slice(0, 10),
          type: "vat",
          label: `IVA ${periodLabel}`,
          amount: Number(vs.amountDue),
          direction: "out",
        });
      }
    } catch {
      // VatSnapshot table may not exist
    }

    // Sort by date
    items.sort((a, b) => a.date.localeCompare(b.date));

    // Summary totals
    const totalIn = items.filter((i) => i.direction === "in").reduce((s, i) => s + i.amount, 0);
    const totalOut = items.filter((i) => i.direction === "out").reduce((s, i) => s + i.amount, 0);

    return Response.json({
      items,
      summary: {
        totalIn: Math.round(totalIn),
        totalOut: Math.round(totalOut),
        netFlow: Math.round(totalIn - totalOut),
        count: items.length,
      },
      horizon: daysAhead,
    });
  } catch (err) {
    console.error("[client/scadenze] Error:", err);
    return Response.json({ error: "Errore nel calcolo delle scadenze" }, { status: 500 });
  }
}
