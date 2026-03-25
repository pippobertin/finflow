import type { DailyProjectionPoint, ScenarioType, ScenarioPreset } from "@/lib/types/cashflow";

const INFLOW_TYPES = new Set(["activeInvoice", "futureReceivable"]);

export const SCENARIO_PRESETS: Record<ScenarioType, ScenarioPreset> = {
  base: {
    label: "Base",
    inflowMultiplier: 1.0,
    outflowMultiplier: 1.0,
  },
  optimistic: {
    label: "Ottimistico",
    inflowMultiplier: 1.1, // +10% entrate
    outflowMultiplier: 0.95, // -5% uscite
  },
  pessimistic: {
    label: "Pessimistico",
    inflowMultiplier: 0.9, // -10% entrate
    outflowMultiplier: 1.1, // +10% uscite
  },
};

/**
 * Apply scenario multipliers to projection data.
 * Returns a new array with adjusted values and recalculated balance.
 * Detail amounts are also scaled so the detail panel stays consistent.
 */
export function applyScenario(
  projection: DailyProjectionPoint[],
  startingBalance: number,
  scenario: ScenarioType,
): DailyProjectionPoint[] {
  const preset = SCENARIO_PRESETS[scenario];
  if (preset.inflowMultiplier === 1 && preset.outflowMultiplier === 1) {
    return projection;
  }

  let runningBalance = startingBalance;

  return projection.map((point) => {
    const activeInvoices = point.activeInvoices * preset.inflowMultiplier;
    const futureReceivables = point.futureReceivables * preset.inflowMultiplier;
    const passiveInvoices = point.passiveInvoices * preset.outflowMultiplier;
    const recurringExpenses = point.recurringExpenses * preset.outflowMultiplier;
    const oneOffExpenses = point.oneOffExpenses * preset.outflowMultiplier;

    const netFlow =
      activeInvoices + futureReceivables - passiveInvoices - recurringExpenses - oneOffExpenses;
    runningBalance += netFlow;

    // Scale detail amounts to match
    const details = point.details.map((d) => ({
      ...d,
      amount:
        Math.round(
          d.amount *
            (INFLOW_TYPES.has(d.type) ? preset.inflowMultiplier : preset.outflowMultiplier) *
            100,
        ) / 100,
    }));

    return {
      ...point,
      details,
      activeInvoices: Math.round(activeInvoices * 100) / 100,
      futureReceivables: Math.round(futureReceivables * 100) / 100,
      passiveInvoices: Math.round(passiveInvoices * 100) / 100,
      recurringExpenses: Math.round(recurringExpenses * 100) / 100,
      oneOffExpenses: Math.round(oneOffExpenses * 100) / 100,
      netFlow: Math.round(netFlow * 100) / 100,
      balance: Math.round(runningBalance * 100) / 100,
    };
  });
}
