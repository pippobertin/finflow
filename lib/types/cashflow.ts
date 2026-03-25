export interface DailyItemDetail {
  id: string;
  type:
    | "activeInvoice"
    | "passiveInvoice"
    | "recurringExpense"
    | "oneOffExpense"
    | "futureReceivable";
  label: string;
  counterpart?: string;
  amount: number;
}

export interface DailyProjectionPoint {
  date: string; // YYYY-MM-DD
  balance: number;
  activeInvoices: number;
  passiveInvoices: number;
  recurringExpenses: number;
  oneOffExpenses: number;
  futureReceivables: number;
  netFlow: number;
  details: DailyItemDetail[];
}

export interface CashflowProjectionResult {
  startingBalance: number;
  asOfDate: string;
  projection: DailyProjectionPoint[];
  totalPendingActiveGross: number;
  avgDso: number;
}

export interface CashflowTimelineResult extends CashflowProjectionResult {
  history: DailyProjectionPoint[];
  fullTimeline: DailyProjectionPoint[];
  historyLength: number;
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
