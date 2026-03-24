import { create } from "zustand";
import type { ScenarioType, WhatIfParams } from "@/lib/types/cashflow";

interface CashflowSettingsState {
  days: number;
  scenario: ScenarioType;
  threshold: number;
  whatIf: WhatIfParams;
  setDays: (days: number) => void;
  setScenario: (scenario: ScenarioType) => void;
  setThreshold: (threshold: number) => void;
  setWhatIfExtraExpense: (amount: number) => void;
  setWhatIfExtraExpenseDate: (date: string | null) => void;
  setWhatIfMissedCollectionPct: (pct: number) => void;
  setWhatIfDsoAdjustment: (days: number) => void;
  resetWhatIf: () => void;
}

const DEFAULT_WHAT_IF: WhatIfParams = {
  extraExpense: 0,
  extraExpenseDate: null,
  missedCollectionPct: 0,
  dsoAdjustment: 60,
};

export const useCashflowSettings = create<CashflowSettingsState>((set) => ({
  days: 90,
  scenario: "base",
  threshold: 0,
  whatIf: { ...DEFAULT_WHAT_IF },
  setDays: (days) => set({ days }),
  setScenario: (scenario) => set({ scenario }),
  setThreshold: (threshold) => set({ threshold }),
  setWhatIfExtraExpense: (amount) =>
    set((s) => ({ whatIf: { ...s.whatIf, extraExpense: amount } })),
  setWhatIfExtraExpenseDate: (date) =>
    set((s) => ({ whatIf: { ...s.whatIf, extraExpenseDate: date } })),
  setWhatIfMissedCollectionPct: (pct) =>
    set((s) => ({ whatIf: { ...s.whatIf, missedCollectionPct: pct } })),
  setWhatIfDsoAdjustment: (days) => set((s) => ({ whatIf: { ...s.whatIf, dsoAdjustment: days } })),
  resetWhatIf: () => set({ whatIf: { ...DEFAULT_WHAT_IF } }),
}));
