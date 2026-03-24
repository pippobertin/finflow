import type { DailyProjectionPoint, ScenarioType, ScenarioPreset } from "@/lib/types/cashflow";

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
 */
export function applyScenario(
  projection: DailyProjectionPoint[],
  startingBalance: number,
  scenario: ScenarioType,
): DailyProjectionPoint[] {
  const preset = SCENARIO_PRESETS[scenario];
  let runningBalance = startingBalance;

  return projection.map((point) => {
    const activeInvoices = point.activeInvoices * preset.inflowMultiplier;
    const passiveInvoices = point.passiveInvoices * preset.outflowMultiplier;
    const recurringExpenses = point.recurringExpenses * preset.outflowMultiplier;
    const oneOffExpenses = point.oneOffExpenses * preset.outflowMultiplier;

    const netFlow = activeInvoices - passiveInvoices - recurringExpenses - oneOffExpenses;
    runningBalance += netFlow;

    return {
      ...point,
      activeInvoices: Math.round(activeInvoices * 100) / 100,
      passiveInvoices: Math.round(passiveInvoices * 100) / 100,
      recurringExpenses: Math.round(recurringExpenses * 100) / 100,
      oneOffExpenses: Math.round(oneOffExpenses * 100) / 100,
      netFlow: Math.round(netFlow * 100) / 100,
      balance: Math.round(runningBalance * 100) / 100,
    };
  });
}
