/**
 * financial-ratios.ts — Key financial ratios computed from CE riclassificato.
 *
 * Pure functions, no DB access. Takes IncomeStatementResult as input.
 */

import type { IncomeStatementResult } from "./income-statement";

// ─── Types ──────────────────────────────────────────────────────

export interface FinancialRatios {
  /** MdC / Revenue (%) */
  mdcMargin: number | null;
  /** EBITDA / Revenue (%) */
  ebitdaMargin: number | null;
  /** EBIT / Revenue (%) — profitability after depreciation */
  ebitMargin: number | null;
  /** Net Income / Revenue (%) */
  netMargin: number | null;
  /** Variable Costs / Revenue (%) — cost efficiency */
  variableCostRatio: number | null;
  /** Fixed Operating Costs / Revenue (%) — structural cost weight */
  fixedCostRatio: number | null;
}

// ─── Engine ──────────────────────────────────────────────────────

/**
 * Compute key financial ratios from an income statement result.
 * Returns null for ratios that can't be computed (e.g., zero revenue).
 */
export function computeFinancialRatios(ce: IncomeStatementResult): FinancialRatios {
  const rev = ce.revenue;

  if (rev === 0) {
    return {
      mdcMargin: null,
      ebitdaMargin: null,
      ebitMargin: null,
      netMargin: null,
      variableCostRatio: null,
      fixedCostRatio: null,
    };
  }

  return {
    mdcMargin: round2((ce.mdc / rev) * 100),
    ebitdaMargin: round2((ce.ebitda / rev) * 100),
    ebitMargin: round2((ce.ebit / rev) * 100),
    netMargin: round2((ce.netIncome / rev) * 100),
    variableCostRatio: round2((ce.variableCosts / rev) * 100),
    fixedCostRatio: round2((ce.fixedCostsOperating / rev) * 100),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
