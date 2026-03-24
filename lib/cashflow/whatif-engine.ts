import { addDays, format } from "date-fns";
import type { DailyProjectionPoint, WhatIfParams } from "@/lib/types/cashflow";

/**
 * Apply what-if parameters to projection data:
 * 1. Inject extra expense on a specific date
 * 2. Reduce activeInvoices by missedCollectionPct
 * 3. Shift activeInvoices forward by dsoAdjustment days vs base avgDso
 */
export function applyWhatIf(
  projection: DailyProjectionPoint[],
  startingBalance: number,
  params: WhatIfParams,
  baseAvgDso: number,
): DailyProjectionPoint[] {
  const hasExtraExpense = params.extraExpense > 0 && params.extraExpenseDate;
  const hasMissedCollection = params.missedCollectionPct > 0;
  const dsoShift = params.dsoAdjustment - baseAvgDso;
  const hasDsoShift = dsoShift !== 0;

  if (!hasExtraExpense && !hasMissedCollection && !hasDsoShift) {
    return projection;
  }

  // Build a working copy
  const adjusted = projection.map((p) => ({ ...p }));

  // 1. Inject extra expense
  if (hasExtraExpense) {
    const idx = adjusted.findIndex((p) => p.date === params.extraExpenseDate);
    if (idx >= 0) {
      adjusted[idx].oneOffExpenses += params.extraExpense;
    }
  }

  // 2. Reduce inflows by missed collection percentage
  if (hasMissedCollection) {
    const factor = 1 - params.missedCollectionPct / 100;
    for (const point of adjusted) {
      point.activeInvoices = Math.round(point.activeInvoices * factor * 100) / 100;
    }
  }

  // 3. Shift active invoices by DSO difference
  if (hasDsoShift && Math.abs(dsoShift) > 0) {
    // Collect all active invoice amounts by date, then redistribute shifted
    const shiftedInflows = new Map<string, number>();

    for (const point of adjusted) {
      if (point.activeInvoices > 0) {
        const originalDate = new Date(point.date);
        const newDate = addDays(originalDate, dsoShift);
        const newKey = format(newDate, "yyyy-MM-dd");
        shiftedInflows.set(newKey, (shiftedInflows.get(newKey) ?? 0) + point.activeInvoices);
        point.activeInvoices = 0;
      }
    }

    // Re-apply shifted inflows
    for (const point of adjusted) {
      const shifted = shiftedInflows.get(point.date);
      if (shifted) {
        point.activeInvoices += shifted;
      }
    }
  }

  // Recalculate netFlow and balance
  let runningBalance = startingBalance;
  for (const point of adjusted) {
    point.netFlow =
      point.activeInvoices - point.passiveInvoices - point.recurringExpenses - point.oneOffExpenses;
    runningBalance += point.netFlow;
    point.balance = Math.round(runningBalance * 100) / 100;
  }

  return adjusted;
}
