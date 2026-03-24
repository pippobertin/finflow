export interface DailyProjectionPoint {
  date: string; // YYYY-MM-DD
  balance: number;
  activeInvoices: number;
  passiveInvoices: number;
  recurringExpenses: number;
  oneOffExpenses: number;
  netFlow: number;
}

export interface CashflowProjectionResult {
  startingBalance: number;
  asOfDate: string;
  projection: DailyProjectionPoint[];
  totalPendingActiveGross: number;
  avgDso: number;
}

export type ScenarioType = "base" | "optimistic" | "pessimistic";

export interface WhatIfParams {
  extraExpense: number;
  extraExpenseDate: string | null;
  missedCollectionPct: number;
  dsoAdjustment: number;
}

export interface ScenarioPreset {
  label: string;
  inflowMultiplier: number;
  outflowMultiplier: number;
}
