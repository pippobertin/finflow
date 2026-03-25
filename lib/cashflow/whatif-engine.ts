import { addDays, format } from "date-fns";
import type { DailyProjectionPoint, DailyItemDetail, WhatIfParams } from "@/lib/types/cashflow";

const INFLOW_TYPES = new Set(["activeInvoice", "futureReceivable"]);

/**
 * Apply what-if parameters to projection data:
 * 1. Inject extra expense on a specific date
 * 2. Reduce all inflows by missedCollectionPct
 * 3. Shift all inflows (activeInvoices + futureReceivables) by DSO difference
 *
 * Details arrays are kept in sync so the detail panel shows correct items.
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

  // Deep-copy: clone each point AND its details array
  const adjusted = projection.map((p) => ({
    ...p,
    details: p.details.map((d) => ({ ...d })),
  }));

  // 1. Inject extra expense
  if (hasExtraExpense) {
    const idx = adjusted.findIndex((p) => p.date === params.extraExpenseDate);
    if (idx >= 0) {
      adjusted[idx].oneOffExpenses += params.extraExpense;
      adjusted[idx].details.push({
        id: "whatif-extra",
        type: "oneOffExpense",
        label: "Spesa extra (what-if)",
        amount: params.extraExpense,
      });
    }
  }

  // 2. Reduce inflows by missed collection percentage
  if (hasMissedCollection) {
    const factor = 1 - params.missedCollectionPct / 100;
    for (const point of adjusted) {
      point.activeInvoices = Math.round(point.activeInvoices * factor * 100) / 100;
      point.futureReceivables = Math.round(point.futureReceivables * factor * 100) / 100;
      // Scale detail amounts too
      for (const d of point.details) {
        if (INFLOW_TYPES.has(d.type)) {
          d.amount = Math.round(d.amount * factor * 100) / 100;
        }
      }
    }
  }

  // 3. Shift all inflows by DSO difference.
  //    Moves both numeric totals AND detail items to the new date.
  //    Dates that fall before the projection window are clamped to the first date.
  if (hasDsoShift && Math.abs(dsoShift) > 0) {
    const firstDate = adjusted[0]?.date;
    const dateSet = new Set(adjusted.map((p) => p.date));

    // Collect amounts + detail items to redistribute
    const shiftedActive = new Map<string, number>();
    const shiftedReceivables = new Map<string, number>();
    const shiftedDetails = new Map<string, DailyItemDetail[]>();

    function resolveKey(origDate: string): string {
      const newDate = addDays(new Date(origDate), dsoShift);
      let key = format(newDate, "yyyy-MM-dd");
      if (!dateSet.has(key) && key < firstDate) key = firstDate;
      return key;
    }

    for (const point of adjusted) {
      const newKey = resolveKey(point.date);

      if (point.activeInvoices > 0) {
        shiftedActive.set(newKey, (shiftedActive.get(newKey) ?? 0) + point.activeInvoices);
        point.activeInvoices = 0;
      }
      if (point.futureReceivables > 0) {
        shiftedReceivables.set(
          newKey,
          (shiftedReceivables.get(newKey) ?? 0) + point.futureReceivables,
        );
        point.futureReceivables = 0;
      }

      // Move inflow details to the new date
      const inflowDetails = point.details.filter((d) => INFLOW_TYPES.has(d.type));
      if (inflowDetails.length > 0) {
        const existing = shiftedDetails.get(newKey) ?? [];
        existing.push(...inflowDetails);
        shiftedDetails.set(newKey, existing);
        // Keep only non-inflow details on the original date
        point.details = point.details.filter((d) => !INFLOW_TYPES.has(d.type));
      }
    }

    // Re-apply shifted amounts + details
    for (const point of adjusted) {
      const sa = shiftedActive.get(point.date);
      if (sa) point.activeInvoices += sa;
      const sr = shiftedReceivables.get(point.date);
      if (sr) point.futureReceivables += sr;
      const sd = shiftedDetails.get(point.date);
      if (sd) point.details.push(...sd);
    }
  }

  // Recalculate netFlow and balance
  let runningBalance = startingBalance;
  for (const point of adjusted) {
    point.netFlow =
      point.activeInvoices +
      point.futureReceivables -
      point.passiveInvoices -
      point.recurringExpenses -
      point.oneOffExpenses;
    runningBalance += point.netFlow;
    point.balance = Math.round(runningBalance * 100) / 100;
  }

  return adjusted;
}
