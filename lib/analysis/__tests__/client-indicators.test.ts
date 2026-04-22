import { describe, it, expect } from "vitest";
import { computeBreakEven, computeHealthIndicators, generateNarrative } from "../client-indicators";
import { computeIncomeStatement, type IncomeStatementResult } from "../income-statement";
import { computeFinancialRatios } from "../financial-ratios";

// ─── Golden data: BLM 2024 (same as Fase 3 golden test) ────────

const blm2024Lines = [
  { cdgCategory: "REVENUE", balance: 290682.43 },
  { cdgCategory: "VAR_COST_SERVICES", balance: 102277.49 },
  { cdgCategory: "VAR_COST_DIRECT_LABOR", balance: 23815.65 },
  { cdgCategory: "FIXED_COST_ADMIN_COMPENSATION", balance: 31983.0 },
  { cdgCategory: "FIXED_COST_RENT", balance: 5090.0 },
  { cdgCategory: "FIXED_COST_CONSULTING", balance: 5091.0 },
  { cdgCategory: "FIXED_COST_UTILITIES", balance: 2731.12 },
  { cdgCategory: "FIXED_COST_MARKETING", balance: 2300.0 },
  { cdgCategory: "FIXED_COST_GENERAL", balance: 10734.28 },
  { cdgCategory: "FIXED_COST_DEPRECIATION", balance: 2849.89 },
  { cdgCategory: "FINANCIAL_EXPENSE", balance: 2413.97 },
  { cdgCategory: "TAX_INCOME", balance: 2599.0 },
];

function buildBLM2024(): {
  ce: IncomeStatementResult;
  ratios: ReturnType<typeof computeFinancialRatios>;
} {
  const ce = computeIncomeStatement(blm2024Lines);
  const ratios = computeFinancialRatios(ce);
  return { ce, ratios };
}

// ─── Tests ──────────────────────────────────────────────────────

describe("computeBreakEven", () => {
  it("computes BEP for BLM 2024", () => {
    const { ce } = buildBLM2024();
    const bep = computeBreakEven(ce);
    expect(bep).not.toBeNull();
    // BEP = (fixed costs + depreciation) / (MdC / Revenue)
    // MdC ratio = 164589.29 / 290682.43 = ~0.5662
    // Total fixed = 57929.40 + 2849.89 = 60779.29
    // BEP = 60779.29 / 0.5662 = ~107351
    expect(bep!.bep).toBeGreaterThan(100000);
    expect(bep!.bep).toBeLessThan(120000);
  });

  it("computes positive safety margin for BLM 2024", () => {
    const { ce } = buildBLM2024();
    const bep = computeBreakEven(ce);
    expect(bep!.safetyMargin).toBeGreaterThan(50);
    expect(bep!.safetyMarginStatus).toBe("ok");
  });

  it("returns null for zero revenue", () => {
    const ce = computeIncomeStatement([]);
    const bep = computeBreakEven(ce);
    expect(bep).toBeNull();
  });
});

describe("computeHealthIndicators", () => {
  it("produces 6 indicators for BLM 2024", () => {
    const { ce, ratios } = buildBLM2024();
    const bep = computeBreakEven(ce);
    const indicators = computeHealthIndicators(ce, ratios, bep);
    expect(indicators).toHaveLength(6);
  });

  it("BLM 2024 EBITDA margin is ok (>15%)", () => {
    const { ce, ratios } = buildBLM2024();
    const bep = computeBreakEven(ce);
    const indicators = computeHealthIndicators(ce, ratios, bep);
    const ebitda = indicators.find((i) => i.id === "ebitda_margin");
    expect(ebitda).toBeDefined();
    expect(ebitda!.status).toBe("ok");
    expect(ebitda!.value).toBeGreaterThan(30);
  });

  it("BLM 2024 MdC margin is ok (>30%)", () => {
    const { ce, ratios } = buildBLM2024();
    const bep = computeBreakEven(ce);
    const indicators = computeHealthIndicators(ce, ratios, bep);
    const mdc = indicators.find((i) => i.id === "mdc_margin");
    expect(mdc!.status).toBe("ok");
    expect(mdc!.value).toBeGreaterThan(50);
  });

  it("produces correct semaphore for a marginal case", () => {
    // Simulate low EBITDA margin
    const lines = [
      { cdgCategory: "REVENUE", balance: 100000 },
      { cdgCategory: "VAR_COST_SERVICES", balance: 80000 },
      { cdgCategory: "FIXED_COST_GENERAL", balance: 12000 },
    ];
    const ce = computeIncomeStatement(lines);
    const ratios = computeFinancialRatios(ce);
    const bep = computeBreakEven(ce);
    const indicators = computeHealthIndicators(ce, ratios, bep);

    // MdC = 20% → warn (15-30)
    const mdc = indicators.find((i) => i.id === "mdc_margin");
    expect(mdc!.status).toBe("warn");

    // EBITDA = 8% → warn (5-15)
    const ebitda = indicators.find((i) => i.id === "ebitda_margin");
    expect(ebitda!.status).toBe("warn");

    // Var cost ratio = 80% → warn (exactly at boundary, ≤80% is warn)
    const varCost = indicators.find((i) => i.id === "var_cost_ratio");
    expect(varCost!.status).toBe("warn");
  });
});

describe("generateNarrative", () => {
  it("generates narrative for BLM 2024", () => {
    const { ce, ratios } = buildBLM2024();
    const bep = computeBreakEven(ce);
    const narrative = generateNarrative(ce, ratios, bep, "2024");
    expect(narrative.inBreve).toContain("290.682");
    expect(narrative.inBreve).toContain("EBITDA");
    expect(narrative.profitabilityNote).toContain("molto alta");
  });

  it("generates loss narrative when net income is negative", () => {
    const lines = [
      { cdgCategory: "REVENUE", balance: 50000 },
      { cdgCategory: "VAR_COST_SERVICES", balance: 40000 },
      { cdgCategory: "FIXED_COST_GENERAL", balance: 15000 },
    ];
    const ce = computeIncomeStatement(lines);
    const ratios = computeFinancialRatios(ce);
    const bep = computeBreakEven(ce);
    const narrative = generateNarrative(ce, ratios, bep, "2024");
    expect(narrative.inBreve).toContain("perdita");
  });
});
