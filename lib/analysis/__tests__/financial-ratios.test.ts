import { describe, it, expect } from "vitest";
import { computeFinancialRatios } from "../financial-ratios";
import { computeIncomeStatement } from "../income-statement";
import type { CEInputLine } from "../income-statement";

function line(cdgCategory: string, balance: number): CEInputLine {
  return { cdgCategory, balance };
}

describe("computeFinancialRatios", () => {
  it("returns null ratios when revenue is zero", () => {
    const ce = computeIncomeStatement([]);
    const ratios = computeFinancialRatios(ce);
    expect(ratios.mdcMargin).toBeNull();
    expect(ratios.ebitdaMargin).toBeNull();
    expect(ratios.netMargin).toBeNull();
  });

  it("computes correct margins for simple case", () => {
    const ce = computeIncomeStatement([
      line("REVENUE", 100_000),
      line("VAR_COST_MATERIALS", 40_000),
      line("FIXED_COST_RENT", 10_000),
      line("FIXED_COST_DEPRECIATION", 5_000),
    ]);

    const ratios = computeFinancialRatios(ce);

    // MdC = 60k → 60%
    expect(ratios.mdcMargin).toBe(60);
    // EBITDA = 60k - 10k = 50k → 50%
    expect(ratios.ebitdaMargin).toBe(50);
    // EBIT = 50k - 5k = 45k → 45%
    expect(ratios.ebitMargin).toBe(45);
    // Net = 45k → 45%
    expect(ratios.netMargin).toBe(45);
    // Variable cost ratio = 40%
    expect(ratios.variableCostRatio).toBe(40);
    // Fixed cost ratio = 10%
    expect(ratios.fixedCostRatio).toBe(10);
  });

  it("computes BLM 2024 ratios correctly", () => {
    const ce = computeIncomeStatement([
      line("REVENUE", 290_682),
      line("VAR_COST_MATERIALS", 22),
      line("VAR_COST_SERVICES", 102_277),
      line("VAR_COST_DIRECT_LABOR", 23_794.25),
      line("FIXED_COST_DEPRECIATION", 2_850),
      line("FIXED_COST_ADMIN_COMPENSATION", 31_983),
      line("FIXED_COST_GENERAL", 9_969),
      line("FIXED_COST_MARKETING", 2_826),
      line("FIXED_COST_CONSULTING", 5_091),
      line("FIXED_COST_UTILITIES", 2_730.52),
      line("FIXED_COST_INSURANCE", 240),
      line("FIXED_COST_RENT", 5_089.8),
      line("FINANCIAL_EXPENSE", 3_581),
      line("EXTRAORDINARY_EXPENSE", 74),
      line("EXTRAORDINARY_INCOME", 857),
    ]);

    const ratios = computeFinancialRatios(ce);

    // MdC margin ≈ 56.6%
    expect(ratios.mdcMargin).toBeCloseTo(56.61, 1);
    // EBITDA margin ≈ 36.7%
    expect(ratios.ebitdaMargin).toBeCloseTo(36.69, 1);
    // Net margin ≈ 34.7%
    expect(ratios.netMargin).toBeCloseTo(34.75, 1);
  });
});
