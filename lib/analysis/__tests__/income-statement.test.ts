import { describe, it, expect } from "vitest";
import { computeIncomeStatement, type CEInputLine } from "../income-statement";

// ─── Helper ──────────────────────────────────────────────────────

function line(cdgCategory: string, balance: number): CEInputLine {
  return { cdgCategory, balance };
}

// ─── Unit Tests ─────────────────────────────────────────────────

describe("computeIncomeStatement", () => {
  it("returns zero for empty input", () => {
    const result = computeIncomeStatement([]);
    expect(result.revenue).toBe(0);
    expect(result.variableCosts).toBe(0);
    expect(result.mdc).toBe(0);
    expect(result.ebitda).toBe(0);
    expect(result.ebit).toBe(0);
    expect(result.netIncome).toBe(0);
  });

  it("computes MdC = Revenue − Variable Costs", () => {
    const result = computeIncomeStatement([
      line("REVENUE", 100_000),
      line("VAR_COST_MATERIALS", 20_000),
      line("VAR_COST_SERVICES", 30_000),
    ]);
    expect(result.revenue).toBe(100_000);
    expect(result.variableCosts).toBe(50_000);
    expect(result.mdc).toBe(50_000);
  });

  it("separates FIXED_COST_DEPRECIATION from operating fixed costs", () => {
    const result = computeIncomeStatement([
      line("REVENUE", 200_000),
      line("VAR_COST_MATERIALS", 40_000),
      line("FIXED_COST_RENT", 10_000),
      line("FIXED_COST_GENERAL", 5_000),
      line("FIXED_COST_DEPRECIATION", 8_000),
    ]);
    // MdC = 200k - 40k = 160k
    expect(result.mdc).toBe(160_000);
    // Fixed operating = rent + general = 15k (NO depreciation)
    expect(result.fixedCostsOperating).toBe(15_000);
    // EBITDA = 160k - 15k = 145k
    expect(result.ebitda).toBe(145_000);
    // Depreciation separate
    expect(result.depreciation).toBe(8_000);
    // EBIT = 145k - 8k = 137k
    expect(result.ebit).toBe(137_000);
  });

  it("handles financial and extraordinary net correctly", () => {
    const result = computeIncomeStatement([
      line("REVENUE", 100_000),
      line("FINANCIAL_INCOME", 2_000),
      line("FINANCIAL_EXPENSE", 5_000),
      line("EXTRAORDINARY_INCOME", 3_000),
      line("EXTRAORDINARY_EXPENSE", 1_000),
    ]);
    // Financial net = 2k - 5k = -3k
    expect(result.financialNet).toBe(-3_000);
    // Extraordinary net = 3k - 1k = +2k
    expect(result.extraordinaryNet).toBe(2_000);
    // EBIT = 100k, pretax = 100k - 3k + 2k = 99k
    expect(result.pretaxIncome).toBe(99_000);
  });

  it("subtracts tax from pretax income", () => {
    const result = computeIncomeStatement([line("REVENUE", 50_000), line("TAX_INCOME", 10_000)]);
    expect(result.pretaxIncome).toBe(50_000);
    expect(result.tax).toBe(10_000);
    expect(result.netIncome).toBe(40_000);
  });

  it("aggregates multiple lines of the same category", () => {
    const result = computeIncomeStatement([
      line("REVENUE", 100_000),
      line("REVENUE", 50_000), // two revenue lines
      line("FIXED_COST_GENERAL", 3_000),
      line("FIXED_COST_GENERAL", 7_000), // two general lines
    ]);
    expect(result.revenue).toBe(150_000);
    expect(result.fixedCostsOperating).toBe(10_000);
  });

  it("skips lines with empty cdgCategory", () => {
    const result = computeIncomeStatement([
      line("REVENUE", 100_000),
      { cdgCategory: "", balance: 5_000 },
      line("VAR_COST_MATERIALS", 10_000),
    ]);
    expect(result.revenue).toBe(100_000);
    expect(result.variableCosts).toBe(10_000);
    expect(result.mdc).toBe(90_000);
  });

  it("handles decimal precision", () => {
    const result = computeIncomeStatement([
      line("REVENUE", 100.33),
      line("VAR_COST_SERVICES", 33.11),
      line("VAR_COST_DIRECT_LABOR", 22.22),
    ]);
    // MdC = 100.33 - 55.33 = 45.00
    expect(result.mdc).toBe(45);
  });

  it("returns correct detail breakdowns", () => {
    const result = computeIncomeStatement([
      line("REVENUE", 100_000),
      line("VAR_COST_MATERIALS", 10_000),
      line("VAR_COST_SERVICES", 20_000),
      line("FIXED_COST_RENT", 5_000),
      line("FIXED_COST_DEPRECIATION", 3_000),
      line("FINANCIAL_EXPENSE", 1_000),
      line("EXTRAORDINARY_INCOME", 500),
      line("TAX_INCOME", 8_000),
    ]);

    expect(result.revenueDetail).toHaveLength(1);
    expect(result.revenueDetail[0].cdgCategory).toBe("REVENUE");
    expect(result.revenueDetail[0].amount).toBe(100_000);

    expect(result.variableCostDetail).toHaveLength(2);
    expect(result.fixedCostOperatingDetail).toHaveLength(1);
    expect(result.fixedCostOperatingDetail[0].cdgCategory).toBe("FIXED_COST_RENT");

    expect(result.depreciationDetail).toHaveLength(1);
    expect(result.depreciationDetail[0].amount).toBe(3_000);

    expect(result.financialDetail).toHaveLength(1);
    expect(result.financialDetail[0].cdgCategory).toBe("FINANCIAL_EXPENSE");

    expect(result.extraordinaryDetail).toHaveLength(1);
    expect(result.taxDetail).toHaveLength(1);
  });

  it("omits zero-amount categories from detail", () => {
    const result = computeIncomeStatement([
      line("REVENUE", 100_000),
      line("VAR_COST_MATERIALS", 0), // zero, should be omitted
    ]);
    expect(result.variableCostDetail).toHaveLength(0);
  });
});

// ─── Golden Test: BLM 2024 CE riclassificato ────────────────────
// Data from COWORK/Modello CDG settembre 2025.xlsx, sheet 4-ANBIL
// Column H = 2024 Consuntivo 12 months
// User-verified mapping with corrections:
//   Row 32 "Tasse" → FIXED_COST_GENERAL (not TAX_INCOME)
//   Row 33 "Spese bancarie" → FIXED_COST_GENERAL (not FINANCIAL_EXPENSE)

describe("Golden Test — BLM 2024", () => {
  const BLM_2024_LINES: CEInputLine[] = [
    // Revenue
    line("REVENUE", 290_682.0),

    // Variable Costs
    line("VAR_COST_MATERIALS", 22.0),
    line("VAR_COST_SERVICES", 102_277.0),
    line("VAR_COST_DIRECT_LABOR", 23_794.25),

    // Fixed Costs — Depreciation (separated, between EBITDA and EBIT)
    line("FIXED_COST_DEPRECIATION", 2_850.0),

    // Fixed Costs — Operating (pre-EBITDA)
    line("FIXED_COST_ADMIN_COMPENSATION", 31_983.0),
    line("FIXED_COST_GENERAL", 978.0), // Row 19: Costi gen. industriali
    line("FIXED_COST_GENERAL", 400.0), // Row 21: Manutenzioni
    line("FIXED_COST_MARKETING", 526.0), // Row 22: Costi gen. commerciali
    line("FIXED_COST_MARKETING", 2_300.0), // Row 24: Pubblicità
    line("FIXED_COST_GENERAL", 535.0), // Row 25: Costi gen. amm.vi
    line("FIXED_COST_CONSULTING", 5_091.0), // Row 26: Consulenze amm.
    line("FIXED_COST_GENERAL", 3_043.0), // Row 27: Costi gen. vari
    line("FIXED_COST_UTILITIES", 2_730.52), // Row 28: Spese telef/Internet
    line("FIXED_COST_INSURANCE", 240.0), // Row 31: Assicurazioni
    line("FIXED_COST_GENERAL", 2_599.0), // Row 32: Tasse (bolli, IMU, ecc.) ← CORRECTED
    line("FIXED_COST_GENERAL", 2_414.0), // Row 33: Spese bancarie (fee comm.) ← CORRECTED
    line("FIXED_COST_RENT", 5_089.8), // Row 34: Affitto

    // Financial
    line("FINANCIAL_EXPENSE", 3_581.0), // Row 38: Gest. Finanziaria (positive = expense)

    // Extraordinary
    line("EXTRAORDINARY_EXPENSE", 74.0), // Row 39: Gest. Accessoria
    line("EXTRAORDINARY_INCOME", 857.0), // Row 40: Gest. Straordinaria

    // Tax
    line("TAX_INCOME", 0.0), // Row 42: Imposte sul reddito
  ];

  // User-verified targets:
  //   Ricavi:             290,682.00
  //   CV:                 126,093.25
  //   MdC:                164,588.75
  //   CF operativi:        57,929.32
  //   EBITDA:             106,659.43
  //   EBIT:               103,809.43
  //   Utile Netto:        101,011.43

  const result = computeIncomeStatement(BLM_2024_LINES);

  it("Revenue matches target", () => {
    expect(result.revenue).toBeCloseTo(290_682.0, 2);
  });

  it("Variable Costs matches target", () => {
    expect(result.variableCosts).toBeCloseTo(126_093.25, 2);
  });

  it("MdC matches target", () => {
    expect(result.mdc).toBeCloseTo(164_588.75, 2);
  });

  it("Fixed Costs Operating (excl depreciation) matches target", () => {
    expect(result.fixedCostsOperating).toBeCloseTo(57_929.32, 2);
  });

  it("EBITDA matches target", () => {
    expect(result.ebitda).toBeCloseTo(106_659.43, 2);
  });

  it("Depreciation is correct", () => {
    expect(result.depreciation).toBeCloseTo(2_850.0, 2);
  });

  it("EBIT matches target", () => {
    expect(result.ebit).toBeCloseTo(103_809.43, 2);
  });

  it("Financial net is correct (−3,581)", () => {
    expect(result.financialNet).toBeCloseTo(-3_581.0, 2);
  });

  it("Extraordinary net is correct (+783)", () => {
    // 857 income − 74 expense = +783
    expect(result.extraordinaryNet).toBeCloseTo(783.0, 2);
  });

  it("Net Income matches target", () => {
    expect(result.netIncome).toBeCloseTo(101_011.43, 2);
  });

  it("Pretax income = EBIT + financial + extraordinary", () => {
    // 103,809.43 − 3,581 + 783 = 101,011.43
    expect(result.pretaxIncome).toBeCloseTo(101_011.43, 2);
  });

  it("CE cascade arithmetic is internally consistent", () => {
    expect(result.mdc).toBeCloseTo(result.revenue - result.variableCosts, 2);
    expect(result.ebitda).toBeCloseTo(result.mdc - result.fixedCostsOperating, 2);
    expect(result.ebit).toBeCloseTo(result.ebitda - result.depreciation, 2);
    expect(result.pretaxIncome).toBeCloseTo(
      result.ebit + result.financialNet + result.extraordinaryNet,
      2,
    );
    expect(result.netIncome).toBeCloseTo(result.pretaxIncome - result.tax, 2);
  });

  it("all targets within ±2% tolerance", () => {
    const tolerance = 0.02;
    const targets: [string, number, number][] = [
      ["Revenue", result.revenue, 290_682.0],
      ["CV", result.variableCosts, 126_093.25],
      ["MdC", result.mdc, 164_588.75],
      ["CF op.", result.fixedCostsOperating, 57_929.32],
      ["EBITDA", result.ebitda, 106_659.43],
      ["EBIT", result.ebit, 103_809.43],
      ["Net Income", result.netIncome, 101_011.43],
    ];
    for (const [name, actual, expected] of targets) {
      const pctDiff = expected !== 0 ? Math.abs((actual - expected) / expected) : 0;
      expect(
        pctDiff,
        `${name}: ${actual} vs ${expected} (${(pctDiff * 100).toFixed(2)}%)`,
      ).toBeLessThan(tolerance);
    }
  });
});
