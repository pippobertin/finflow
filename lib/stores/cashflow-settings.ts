import { create } from "zustand";
import type { ScenarioType, WhatIfParams, WhatIfEvent } from "@/lib/types/cashflow";

interface CashflowSettingsState {
  viewRange: [number, number];
  historyLength: number;
  scenario: ScenarioType;
  threshold: number;
  whatIf: WhatIfParams;
  whatIfEvents: WhatIfEvent[];
  setViewRange: (range: [number, number]) => void;
  setHistoryLength: (n: number) => void;
  setScenario: (scenario: ScenarioType) => void;
  setThreshold: (threshold: number) => void;
  setWhatIfExtraExpense: (amount: number) => void;
  setWhatIfExtraExpenseDate: (date: string | null) => void;
  setWhatIfMissedCollectionPct: (pct: number) => void;
  setWhatIfDsoAdjustment: (days: number) => void;
  resetWhatIf: () => void;
  addWhatIfEvent: (event: WhatIfEvent) => void;
  removeWhatIfEvent: (id: string) => void;
  toggleWhatIfEvent: (id: string) => void;
  updateWhatIfEvent: (id: string, updates: Partial<WhatIfEvent>) => void;
  clearWhatIfEvents: () => void;
}

const DEFAULT_WHAT_IF: WhatIfParams = {
  extraExpense: 0,
  extraExpenseDate: null,
  missedCollectionPct: 0,
  dsoAdjustment: 60,
};

export const useCashflowSettings = create<CashflowSettingsState>((set) => ({
  viewRange: [0, 90] as [number, number],
  historyLength: 0,
  scenario: "base",
  threshold: 0,
  whatIf: { ...DEFAULT_WHAT_IF },
  whatIfEvents: [],
  setViewRange: (range) => set({ viewRange: range }),
  setHistoryLength: (n) => set({ historyLength: n }),
  setScenario: (scenario) => set({ scenario }),
  setThreshold: (threshold) => set({ threshold }),
  setWhatIfExtraExpense: (amount) =>
    set((s) => ({ whatIf: { ...s.whatIf, extraExpense: amount } })),
  setWhatIfExtraExpenseDate: (date) =>
    set((s) => ({ whatIf: { ...s.whatIf, extraExpenseDate: date } })),
  setWhatIfMissedCollectionPct: (pct) =>
    set((s) => ({ whatIf: { ...s.whatIf, missedCollectionPct: pct } })),
  setWhatIfDsoAdjustment: (days) => set((s) => ({ whatIf: { ...s.whatIf, dsoAdjustment: days } })),
  resetWhatIf: () => set({ whatIf: { ...DEFAULT_WHAT_IF }, whatIfEvents: [] }),
  addWhatIfEvent: (event) => set((s) => ({ whatIfEvents: [...s.whatIfEvents, event] })),
  removeWhatIfEvent: (id) =>
    set((s) => ({ whatIfEvents: s.whatIfEvents.filter((e) => e.id !== id) })),
  toggleWhatIfEvent: (id) =>
    set((s) => ({
      whatIfEvents: s.whatIfEvents.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e)),
    })),
  updateWhatIfEvent: (id, updates) =>
    set((s) => ({
      whatIfEvents: s.whatIfEvents.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
  clearWhatIfEvents: () => set({ whatIfEvents: [] }),
}));
