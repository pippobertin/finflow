/**
 * income-statement.ts — Motore CE riclassificato (Conto Economico)
 *
 * Cascade:
 *   Revenue (REVENUE)
 *   − Variable Costs (VAR_COST_*)
 *   = MdC (Margine di Contribuzione)
 *   − Fixed Costs (FIXED_COST_* EXCEPT FIXED_COST_DEPRECIATION)
 *   = EBITDA
 *   − Depreciation (FIXED_COST_DEPRECIATION)
 *   = EBIT
 *   +/− Financial (FINANCIAL_INCOME − FINANCIAL_EXPENSE)
 *   +/− Extraordinary (EXTRAORDINARY_INCOME − EXTRAORDINARY_EXPENSE)
 *   = Utile ante imposte
 *   − Tax (TAX_INCOME)
 *   = Utile Netto
 *
 * Sign convention: all input `balance` values are positive absolute amounts.
 * The engine decides +/− based on category type.
 *
 * ADR-006: The motor uses only TrialBalanceLine data from frozen snapshots.
 * Operational invoices for closed periods are excluded upstream.
 */

// ─── Types ──────────────────────────────────────────────────────

/** Input row — matches TrialBalanceLine shape (balance as number) */
export interface CEInputLine {
  cdgCategory: string;
  balance: number;
  /** Optional: account-level detail preserved in output */
  accountCode?: string;
  accountName?: string;
}

/** A single category total in the detail breakdown */
export interface CECategoryDetail {
  cdgCategory: string;
  label: string;
  amount: number;
}

/** Full CE riclassificato result */
export interface IncomeStatementResult {
  // Subtotals
  revenue: number;
  variableCosts: number;
  mdc: number; // Margine di Contribuzione
  fixedCostsOperating: number; // Fixed costs EXCLUDING depreciation
  ebitda: number;
  depreciation: number;
  ebit: number;
  financialNet: number; // FINANCIAL_INCOME − FINANCIAL_EXPENSE
  extraordinaryNet: number; // EXTRAORDINARY_INCOME − EXTRAORDINARY_EXPENSE
  pretaxIncome: number; // Utile ante imposte
  tax: number;
  netIncome: number; // Utile Netto

  // Detail breakdowns
  revenueDetail: CECategoryDetail[];
  variableCostDetail: CECategoryDetail[];
  fixedCostOperatingDetail: CECategoryDetail[];
  depreciationDetail: CECategoryDetail[];
  financialDetail: CECategoryDetail[];
  extraordinaryDetail: CECategoryDetail[];
  taxDetail: CECategoryDetail[];
}

// ─── Category classification ─────────────────────────────────────

const VARIABLE_COST_CATEGORIES = new Set([
  "VAR_COST_MATERIALS",
  "VAR_COST_SERVICES",
  "VAR_COST_DIRECT_LABOR",
]);

/** Fixed costs that go BEFORE EBITDA (everything except depreciation) */
const FIXED_COST_OPERATING_CATEGORIES = new Set([
  "FIXED_COST_ADMIN_COMPENSATION",
  "FIXED_COST_RENT",
  "FIXED_COST_UTILITIES",
  "FIXED_COST_INSURANCE",
  "FIXED_COST_CONSULTING",
  "FIXED_COST_MARKETING",
  "FIXED_COST_GENERAL",
]);

/** Labels for Italian display (duplicated from cdg-labels to keep this module pure) */
const LABELS: Record<string, string> = {
  REVENUE: "Ricavi",
  VAR_COST_MATERIALS: "Materiali",
  VAR_COST_SERVICES: "Servizi e consulenze",
  VAR_COST_DIRECT_LABOR: "Manodopera diretta",
  FIXED_COST_DEPRECIATION: "Ammortamenti",
  FIXED_COST_ADMIN_COMPENSATION: "Compensi amm./soci",
  FIXED_COST_RENT: "Affitti",
  FIXED_COST_UTILITIES: "Utenze e telecomunicazioni",
  FIXED_COST_INSURANCE: "Assicurazioni",
  FIXED_COST_CONSULTING: "Consulenze amministrative",
  FIXED_COST_MARKETING: "Marketing e pubblicità",
  FIXED_COST_GENERAL: "Costi fissi generali",
  FINANCIAL_INCOME: "Proventi finanziari",
  FINANCIAL_EXPENSE: "Oneri finanziari",
  EXTRAORDINARY_INCOME: "Proventi straordinari",
  EXTRAORDINARY_EXPENSE: "Oneri straordinari",
  TAX_INCOME: "Imposte sul reddito",
};

// ─── Engine ──────────────────────────────────────────────────────

/**
 * Aggregate CE input lines by cdgCategory, summing balances.
 */
function aggregateByCategory(lines: CEInputLine[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of lines) {
    if (!line.cdgCategory) continue;
    const current = map.get(line.cdgCategory) ?? 0;
    map.set(line.cdgCategory, current + line.balance);
  }
  return map;
}

/**
 * Build detail array for a set of categories from the aggregate map.
 */
function buildDetail(agg: Map<string, number>, categories: Iterable<string>): CECategoryDetail[] {
  const details: CECategoryDetail[] = [];
  for (const cat of categories) {
    const amount = agg.get(cat);
    if (amount != null && amount !== 0) {
      details.push({
        cdgCategory: cat,
        label: LABELS[cat] ?? cat,
        amount,
      });
    }
  }
  return details;
}

/**
 * Sum values for a given set of categories from the aggregate map.
 */
function sumCategories(agg: Map<string, number>, categories: Set<string>): number {
  let total = 0;
  for (const cat of categories) {
    total += agg.get(cat) ?? 0;
  }
  return total;
}

/**
 * Compute the CE riclassificato (reclassified income statement).
 *
 * @param lines - Array of CEInputLine with positive balances and cdgCategory
 * @returns Full IncomeStatementResult with subtotals and detail breakdowns
 */
export function computeIncomeStatement(lines: CEInputLine[]): IncomeStatementResult {
  const agg = aggregateByCategory(lines);

  // 1. Revenue
  const revenue = agg.get("REVENUE") ?? 0;

  // 2. Variable Costs
  const variableCosts = sumCategories(agg, VARIABLE_COST_CATEGORIES);

  // 3. MdC = Revenue − Variable Costs
  const mdc = revenue - variableCosts;

  // 4. Fixed Costs Operating (EXCLUDING depreciation)
  const fixedCostsOperating = sumCategories(agg, FIXED_COST_OPERATING_CATEGORIES);

  // 5. EBITDA = MdC − Fixed Costs Operating
  const ebitda = mdc - fixedCostsOperating;

  // 6. Depreciation (between EBITDA and EBIT)
  const depreciation = agg.get("FIXED_COST_DEPRECIATION") ?? 0;

  // 7. EBIT = EBITDA − Depreciation
  const ebit = ebitda - depreciation;

  // 8. Financial net = FINANCIAL_INCOME − FINANCIAL_EXPENSE
  const financialIncome = agg.get("FINANCIAL_INCOME") ?? 0;
  const financialExpense = agg.get("FINANCIAL_EXPENSE") ?? 0;
  const financialNet = financialIncome - financialExpense;

  // 9. Extraordinary net = EXTRAORDINARY_INCOME − EXTRAORDINARY_EXPENSE
  const extraordinaryIncome = agg.get("EXTRAORDINARY_INCOME") ?? 0;
  const extraordinaryExpense = agg.get("EXTRAORDINARY_EXPENSE") ?? 0;
  const extraordinaryNet = extraordinaryIncome - extraordinaryExpense;

  // 10. Pretax income = EBIT + financialNet + extraordinaryNet
  const pretaxIncome = ebit + financialNet + extraordinaryNet;

  // 11. Tax
  const tax = agg.get("TAX_INCOME") ?? 0;

  // 12. Net Income = Pretax − Tax
  const netIncome = pretaxIncome - tax;

  // Detail breakdowns
  const revenueDetail = buildDetail(agg, ["REVENUE"]);
  const variableCostDetail = buildDetail(agg, VARIABLE_COST_CATEGORIES);
  const fixedCostOperatingDetail = buildDetail(agg, FIXED_COST_OPERATING_CATEGORIES);
  const depreciationDetail = buildDetail(agg, ["FIXED_COST_DEPRECIATION"]);
  const financialDetail = buildDetail(agg, ["FINANCIAL_INCOME", "FINANCIAL_EXPENSE"]);
  const extraordinaryDetail = buildDetail(agg, ["EXTRAORDINARY_INCOME", "EXTRAORDINARY_EXPENSE"]);
  const taxDetail = buildDetail(agg, ["TAX_INCOME"]);

  return {
    revenue: round2(revenue),
    variableCosts: round2(variableCosts),
    mdc: round2(mdc),
    fixedCostsOperating: round2(fixedCostsOperating),
    ebitda: round2(ebitda),
    depreciation: round2(depreciation),
    ebit: round2(ebit),
    financialNet: round2(financialNet),
    extraordinaryNet: round2(extraordinaryNet),
    pretaxIncome: round2(pretaxIncome),
    tax: round2(tax),
    netIncome: round2(netIncome),
    revenueDetail,
    variableCostDetail,
    fixedCostOperatingDetail,
    depreciationDetail,
    financialDetail,
    extraordinaryDetail,
    taxDetail,
  };
}

/** Round to 2 decimal places to avoid floating point drift */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
