/**
 * budget-variance.ts — Budget vs Actual variance + Preconsuntivo engine
 *
 * Pure functions (no DB access). Reuses computeIncomeStatement from income-statement.ts
 * to produce CE-level comparisons between budget and actual data.
 *
 * Variance: compare budget YTD vs actual YTD for months 1..upToMonth.
 * Preconsuntivo: actual months 1..boundary + budget months (boundary+1)..12 → full-year projection.
 */

import {
  computeIncomeStatement,
  type CEInputLine,
  type IncomeStatementResult,
} from "./income-statement";

// ─── Types ──────────────────────────────────────────────────────

/** Budget row as stored in MonthlyBudget */
export interface BudgetLine {
  cdgCategory: string;
  month: number;
  amount: number;
}

/** Single variance line for a CE row */
export interface VarianceLine {
  label: string;
  budget: number;
  actual: number;
  varianceAbs: number; // actual - budget
  variancePct: number | null; // null when budget is 0
  favorable: boolean | null; // null when both are 0
}

/** Full variance result — mirrors CE structure */
export interface VarianceResult {
  revenue: VarianceLine;
  variableCosts: VarianceLine;
  mdc: VarianceLine;
  fixedCostsOperating: VarianceLine;
  ebitda: VarianceLine;
  depreciation: VarianceLine;
  ebit: VarianceLine;
  financialNet: VarianceLine;
  extraordinaryNet: VarianceLine;
  pretaxIncome: VarianceLine;
  tax: VarianceLine;
  netIncome: VarianceLine;

  /** Raw CE results for budget and actual (for detail breakdowns) */
  budgetCE: IncomeStatementResult;
  actualCE: IncomeStatementResult;

  /** How many months included */
  upToMonth: number;
}

/** Preconsuntivo result — projected full year */
export interface PreconsuntivoResult {
  /** Full-year projected CE (actual 1..boundary + budget boundary+1..12) */
  projected: IncomeStatementResult;
  /** CE from actual months only */
  actualPortion: IncomeStatementResult;
  /** CE from budget months only */
  budgetPortion: IncomeStatementResult;
  /** Boundary month (last month of actual data) */
  boundaryMonth: number;
}

// ─── Helpers ────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Convert budget lines for a month range into CEInputLine[].
 * Budget amounts are positive — they map directly to balance.
 */
function budgetToCELines(lines: BudgetLine[], fromMonth: number, toMonth: number): CEInputLine[] {
  const filtered = lines.filter((l) => l.month >= fromMonth && l.month <= toMonth);
  return filtered.map((l) => ({
    cdgCategory: l.cdgCategory,
    balance: l.amount,
  }));
}

/**
 * Determine favorability for a CE subtotal line.
 *
 * Revenue/income subtotals: actual > budget = favorable
 * Cost subtotals: actual < budget = favorable
 */
function buildVarianceLine(
  label: string,
  budget: number,
  actual: number,
  isCostLine: boolean,
): VarianceLine {
  const varianceAbs = round2(actual - budget);
  const variancePct = budget !== 0 ? round2((varianceAbs / Math.abs(budget)) * 100) : null;

  let favorable: boolean | null = null;
  if (budget !== 0 || actual !== 0) {
    // For cost lines, lower actual is favorable
    // For income/subtotal lines, higher actual is favorable
    favorable = isCostLine ? actual <= budget : actual >= budget;
  }

  return {
    label,
    budget: round2(budget),
    actual: round2(actual),
    varianceAbs,
    variancePct,
    favorable,
  };
}

// ─── Engine ─────────────────────────────────────────────────────

/**
 * Compare budget YTD vs actual YTD through the CE cascade.
 *
 * @param budgetLines - All monthly budget rows (will be filtered to 1..upToMonth)
 * @param actualLines - Actual CE lines for the period (already aggregated upstream)
 * @param upToMonth - Last month to include (1-12)
 */
export function computeBudgetVariance(
  budgetLines: BudgetLine[],
  actualLines: CEInputLine[],
  upToMonth: number,
): VarianceResult {
  const budgetCELines = budgetToCELines(budgetLines, 1, upToMonth);
  const budgetCE = computeIncomeStatement(budgetCELines);
  const actualCE = computeIncomeStatement(actualLines);

  return {
    revenue: buildVarianceLine("Ricavi", budgetCE.revenue, actualCE.revenue, false),
    variableCosts: buildVarianceLine(
      "Costi variabili",
      budgetCE.variableCosts,
      actualCE.variableCosts,
      true,
    ),
    mdc: buildVarianceLine("Margine di Contribuzione", budgetCE.mdc, actualCE.mdc, false),
    fixedCostsOperating: buildVarianceLine(
      "Costi fissi operativi",
      budgetCE.fixedCostsOperating,
      actualCE.fixedCostsOperating,
      true,
    ),
    ebitda: buildVarianceLine("EBITDA", budgetCE.ebitda, actualCE.ebitda, false),
    depreciation: buildVarianceLine(
      "Ammortamenti",
      budgetCE.depreciation,
      actualCE.depreciation,
      true,
    ),
    ebit: buildVarianceLine("EBIT", budgetCE.ebit, actualCE.ebit, false),
    financialNet: buildVarianceLine(
      "Gestione finanziaria",
      budgetCE.financialNet,
      actualCE.financialNet,
      false,
    ),
    extraordinaryNet: buildVarianceLine(
      "Gestione straordinaria",
      budgetCE.extraordinaryNet,
      actualCE.extraordinaryNet,
      false,
    ),
    pretaxIncome: buildVarianceLine(
      "Utile ante imposte",
      budgetCE.pretaxIncome,
      actualCE.pretaxIncome,
      false,
    ),
    tax: buildVarianceLine("Imposte", budgetCE.tax, actualCE.tax, true),
    netIncome: buildVarianceLine("Utile Netto", budgetCE.netIncome, actualCE.netIncome, false),
    budgetCE,
    actualCE,
    upToMonth,
  };
}

/**
 * Project full-year CE by combining actual data (1..boundary) with
 * budget data (boundary+1..12).
 *
 * @param budgetLines - All monthly budget rows for the year
 * @param actualLines - Actual CE lines for months 1..boundaryMonth
 * @param boundaryMonth - Last month with actual data (1-12)
 */
export function computePreconsuntivo(
  budgetLines: BudgetLine[],
  actualLines: CEInputLine[],
  boundaryMonth: number,
): PreconsuntivoResult {
  // Actual portion — as-is
  const actualPortion = computeIncomeStatement(actualLines);

  // Budget portion — remaining months
  const budgetRemainingLines = budgetToCELines(budgetLines, boundaryMonth + 1, 12);
  const budgetPortion = computeIncomeStatement(budgetRemainingLines);

  // Combined projection — merge both sets of CE lines
  const combinedLines: CEInputLine[] = [...actualLines, ...budgetRemainingLines];
  const projected = computeIncomeStatement(combinedLines);

  return {
    projected,
    actualPortion,
    budgetPortion,
    boundaryMonth,
  };
}
