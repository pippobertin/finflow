import { describe, it, expect } from "vitest";
import { computeBudgetVariance, computePreconsuntivo, type BudgetLine } from "../budget-variance";
import type { CEInputLine } from "../income-statement";

// ─── Helpers ────────────────────────────────────────────────────

function budgetLine(cdgCategory: string, month: number, amount: number): BudgetLine {
  return { cdgCategory, month, amount };
}

function ceLine(cdgCategory: string, balance: number): CEInputLine {
  return { cdgCategory, balance };
}

/**
 * Generate 12 monthly budget lines for a category with uniform amount.
 */
function uniformBudget(cdgCategory: string, monthlyAmount: number): BudgetLine[] {
  return Array.from({ length: 12 }, (_, i) => budgetLine(cdgCategory, i + 1, monthlyAmount));
}

// ─── computeBudgetVariance ──────────────────────────────────────

describe("computeBudgetVariance", () => {
  it("returns zero variance for empty inputs", () => {
    const result = computeBudgetVariance([], [], 6);
    expect(result.revenue.budget).toBe(0);
    expect(result.revenue.actual).toBe(0);
    expect(result.revenue.varianceAbs).toBe(0);
    expect(result.revenue.variancePct).toBeNull();
    expect(result.revenue.favorable).toBeNull();
    expect(result.netIncome.varianceAbs).toBe(0);
  });

  it("symmetric case — budget equals actual → zero variance", () => {
    const budget = [
      ...uniformBudget("REVENUE", 10_000),
      ...uniformBudget("VAR_COST_MATERIALS", 2_000),
    ];
    // 6-month actual matching 6 months of budget
    const actual: CEInputLine[] = [
      ceLine("REVENUE", 60_000), // 10k × 6
      ceLine("VAR_COST_MATERIALS", 12_000), // 2k × 6
    ];

    const result = computeBudgetVariance(budget, actual, 6);
    expect(result.revenue.varianceAbs).toBe(0);
    expect(result.revenue.variancePct).toBe(0);
    expect(result.variableCosts.varianceAbs).toBe(0);
    expect(result.mdc.varianceAbs).toBe(0);
    expect(result.netIncome.varianceAbs).toBe(0);
  });

  it("revenue favorable — actual > budget", () => {
    const budget = uniformBudget("REVENUE", 10_000);
    const actual: CEInputLine[] = [ceLine("REVENUE", 75_000)]; // vs budget 60k (6mo)

    const result = computeBudgetVariance(budget, actual, 6);
    expect(result.revenue.budget).toBe(60_000);
    expect(result.revenue.actual).toBe(75_000);
    expect(result.revenue.varianceAbs).toBe(15_000);
    expect(result.revenue.variancePct).toBe(25); // 15k/60k = 25%
    expect(result.revenue.favorable).toBe(true);
  });

  it("revenue unfavorable — actual < budget", () => {
    const budget = uniformBudget("REVENUE", 10_000);
    const actual: CEInputLine[] = [ceLine("REVENUE", 45_000)]; // vs budget 60k (6mo)

    const result = computeBudgetVariance(budget, actual, 6);
    expect(result.revenue.varianceAbs).toBe(-15_000);
    expect(result.revenue.variancePct).toBe(-25);
    expect(result.revenue.favorable).toBe(false);
  });

  it("cost favorable — actual < budget (spending less)", () => {
    const budget = [
      ...uniformBudget("REVENUE", 10_000),
      ...uniformBudget("VAR_COST_MATERIALS", 5_000),
    ];
    const actual: CEInputLine[] = [
      ceLine("REVENUE", 60_000),
      ceLine("VAR_COST_MATERIALS", 20_000), // vs budget 30k → 10k saving
    ];

    const result = computeBudgetVariance(budget, actual, 6);
    expect(result.variableCosts.budget).toBe(30_000);
    expect(result.variableCosts.actual).toBe(20_000);
    expect(result.variableCosts.varianceAbs).toBe(-10_000);
    expect(result.variableCosts.favorable).toBe(true);
  });

  it("cost unfavorable — actual > budget (spending more)", () => {
    const budget = [
      ...uniformBudget("REVENUE", 10_000),
      ...uniformBudget("VAR_COST_MATERIALS", 3_000),
    ];
    const actual: CEInputLine[] = [
      ceLine("REVENUE", 60_000),
      ceLine("VAR_COST_MATERIALS", 25_000), // vs budget 18k → 7k over
    ];

    const result = computeBudgetVariance(budget, actual, 6);
    expect(result.variableCosts.varianceAbs).toBe(7_000);
    expect(result.variableCosts.favorable).toBe(false);
  });

  it("EBITDA variance cascades correctly", () => {
    const budget = [
      ...uniformBudget("REVENUE", 20_000),
      ...uniformBudget("VAR_COST_SERVICES", 5_000),
      ...uniformBudget("FIXED_COST_RENT", 2_000),
    ];
    // 3-month comparison
    const actual: CEInputLine[] = [
      ceLine("REVENUE", 70_000), // vs budget 60k
      ceLine("VAR_COST_SERVICES", 12_000), // vs budget 15k (saving)
      ceLine("FIXED_COST_RENT", 7_000), // vs budget 6k (overspend)
    ];

    const result = computeBudgetVariance(budget, actual, 3);
    // Budget: Rev 60k - VC 15k = MdC 45k - FC 6k = EBITDA 39k
    expect(result.budgetCE.ebitda).toBe(39_000);
    // Actual: Rev 70k - VC 12k = MdC 58k - FC 7k = EBITDA 51k
    expect(result.actualCE.ebitda).toBe(51_000);
    expect(result.ebitda.varianceAbs).toBe(12_000);
    expect(result.ebitda.favorable).toBe(true);
  });

  it("filters budget to upToMonth correctly", () => {
    const budget = [
      budgetLine("REVENUE", 1, 10_000),
      budgetLine("REVENUE", 2, 15_000),
      budgetLine("REVENUE", 3, 20_000),
      budgetLine("REVENUE", 4, 25_000), // should be excluded for upToMonth=3
    ];
    const actual: CEInputLine[] = [ceLine("REVENUE", 50_000)];

    const result = computeBudgetVariance(budget, actual, 3);
    expect(result.revenue.budget).toBe(45_000); // 10k + 15k + 20k
    expect(result.revenue.actual).toBe(50_000);
    expect(result.upToMonth).toBe(3);
  });

  it("handles all CE sections including financial and tax", () => {
    const budget = [
      ...uniformBudget("REVENUE", 50_000),
      ...uniformBudget("VAR_COST_MATERIALS", 10_000),
      ...uniformBudget("FIXED_COST_GENERAL", 5_000),
      ...uniformBudget("FIXED_COST_DEPRECIATION", 1_000),
      ...uniformBudget("FINANCIAL_EXPENSE", 500),
      ...uniformBudget("EXTRAORDINARY_INCOME", 200),
      ...uniformBudget("TAX_INCOME", 3_000),
    ];
    const actual: CEInputLine[] = [
      ceLine("REVENUE", 55_000),
      ceLine("VAR_COST_MATERIALS", 11_000),
      ceLine("FIXED_COST_GENERAL", 4_500),
      ceLine("FIXED_COST_DEPRECIATION", 1_000),
      ceLine("FINANCIAL_EXPENSE", 600),
      ceLine("EXTRAORDINARY_INCOME", 100),
      ceLine("TAX_INCOME", 2_800),
    ];

    const result = computeBudgetVariance(budget, actual, 1);

    // Budget CE for 1 month
    expect(result.budgetCE.revenue).toBe(50_000);
    expect(result.budgetCE.netIncome).toBe(30_700); // 50k-10k-5k-1k-500+200-3k

    // Actual CE
    expect(result.actualCE.revenue).toBe(55_000);

    // Financial: budget -500, actual -600 → favorable=false (worse net)
    expect(result.financialNet.budget).toBe(-500);
    expect(result.financialNet.actual).toBe(-600);
    expect(result.financialNet.favorable).toBe(false);

    // Tax: budget 3000, actual 2800 → favorable=true (lower tax)
    expect(result.tax.favorable).toBe(true);
  });
});

// ─── computePreconsuntivo ───────────────────────────────────────

describe("computePreconsuntivo", () => {
  it("returns zero for empty inputs", () => {
    const result = computePreconsuntivo([], [], 6);
    expect(result.projected.revenue).toBe(0);
    expect(result.projected.netIncome).toBe(0);
    expect(result.boundaryMonth).toBe(6);
  });

  it("boundary at month 12 — all actual, no budget", () => {
    const budget = uniformBudget("REVENUE", 10_000);
    const actual: CEInputLine[] = [ceLine("REVENUE", 130_000)];

    const result = computePreconsuntivo(budget, actual, 12);
    // All 12 months are actual, no budget portion
    expect(result.projected.revenue).toBe(130_000);
    expect(result.actualPortion.revenue).toBe(130_000);
    expect(result.budgetPortion.revenue).toBe(0);
  });

  it("boundary at month 0 — all budget, no actual", () => {
    const budget = uniformBudget("REVENUE", 10_000);
    const actual: CEInputLine[] = [];

    const result = computePreconsuntivo(budget, actual, 0);
    expect(result.projected.revenue).toBe(120_000); // 10k × 12
    expect(result.actualPortion.revenue).toBe(0);
    expect(result.budgetPortion.revenue).toBe(120_000);
  });

  it("boundary at month 6 — combines actual + remaining budget", () => {
    const budget = [
      ...uniformBudget("REVENUE", 10_000),
      ...uniformBudget("VAR_COST_MATERIALS", 3_000),
    ];
    // 6 months actual
    const actual: CEInputLine[] = [
      ceLine("REVENUE", 65_000), // slightly better than budget 60k
      ceLine("VAR_COST_MATERIALS", 15_000), // slightly less than budget 18k
    ];

    const result = computePreconsuntivo(budget, actual, 6);

    // Actual portion
    expect(result.actualPortion.revenue).toBe(65_000);
    expect(result.actualPortion.variableCosts).toBe(15_000);
    expect(result.actualPortion.mdc).toBe(50_000);

    // Budget portion (months 7-12 = 6 months)
    expect(result.budgetPortion.revenue).toBe(60_000); // 10k × 6
    expect(result.budgetPortion.variableCosts).toBe(18_000); // 3k × 6

    // Projected = combined
    expect(result.projected.revenue).toBe(125_000); // 65k + 60k
    expect(result.projected.variableCosts).toBe(33_000); // 15k + 18k
    expect(result.projected.mdc).toBe(92_000); // 125k - 33k
  });

  it("cascades through full CE correctly", () => {
    const budget = [
      ...uniformBudget("REVENUE", 20_000),
      ...uniformBudget("VAR_COST_SERVICES", 4_000),
      ...uniformBudget("FIXED_COST_RENT", 2_000),
      ...uniformBudget("FIXED_COST_DEPRECIATION", 500),
      ...uniformBudget("TAX_INCOME", 1_500),
    ];
    // 9 months actual
    const actual: CEInputLine[] = [
      ceLine("REVENUE", 190_000),
      ceLine("VAR_COST_SERVICES", 38_000),
      ceLine("FIXED_COST_RENT", 17_000),
      ceLine("FIXED_COST_DEPRECIATION", 4_500),
      ceLine("TAX_INCOME", 12_000),
    ];

    const result = computePreconsuntivo(budget, actual, 9);

    // Budget remaining: 3 months
    expect(result.budgetPortion.revenue).toBe(60_000); // 20k × 3

    // Projected revenue = 190k + 60k = 250k
    expect(result.projected.revenue).toBe(250_000);

    // Projected VC = 38k + 12k = 50k
    expect(result.projected.variableCosts).toBe(50_000);

    // Projected MdC = 250k - 50k = 200k
    expect(result.projected.mdc).toBe(200_000);

    // Projected FC operating = 17k + 6k = 23k
    expect(result.projected.fixedCostsOperating).toBe(23_000);

    // EBITDA = 200k - 23k = 177k
    expect(result.projected.ebitda).toBe(177_000);

    // Depreciation = 4.5k + 1.5k = 6k
    expect(result.projected.depreciation).toBe(6_000);

    // EBIT = 177k - 6k = 171k
    expect(result.projected.ebit).toBe(171_000);

    // Tax = 12k + 4.5k = 16.5k
    expect(result.projected.tax).toBe(16_500);

    // Net = 171k - 16.5k = 154.5k
    expect(result.projected.netIncome).toBe(154_500);

    expect(result.boundaryMonth).toBe(9);
  });

  it("non-uniform monthly budget is filtered correctly", () => {
    const budget = [
      budgetLine("REVENUE", 1, 5_000),
      budgetLine("REVENUE", 2, 8_000),
      budgetLine("REVENUE", 3, 12_000),
      budgetLine("REVENUE", 4, 15_000),
      budgetLine("REVENUE", 5, 10_000),
      budgetLine("REVENUE", 6, 10_000),
    ];
    // Actual for months 1-3
    const actual: CEInputLine[] = [ceLine("REVENUE", 30_000)];

    const result = computePreconsuntivo(budget, actual, 3);
    // Budget months 4-6: 15k + 10k + 10k = 35k
    expect(result.budgetPortion.revenue).toBe(35_000);
    // Projected: 30k + 35k = 65k
    expect(result.projected.revenue).toBe(65_000);
  });
});
