/**
 * balance-sheet.ts — Minimal balance sheet aggregation placeholder.
 *
 * BLM doesn't have analytical chart of accounts for SP (Stato Patrimoniale),
 * so this is a structural placeholder ready for when balance sheet data
 * becomes available via TrialBalanceLine with SP categories.
 *
 * For now it provides the type definitions and a no-op aggregator.
 */

// ─── Types ──────────────────────────────────────────────────────

export interface BSInputLine {
  category: string;
  balance: number;
  accountCode?: string;
  accountName?: string;
}

export interface BalanceSheetResult {
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  /** Raw detail lines grouped by category */
  detail: Map<string, number>;
}

// ─── Engine ──────────────────────────────────────────────────────

/**
 * Placeholder: aggregate balance sheet lines by category.
 * Will be expanded when SP categories are added to the CdgCategory enum.
 */
export function computeBalanceSheet(lines: BSInputLine[]): BalanceSheetResult {
  const detail = new Map<string, number>();

  for (const line of lines) {
    if (!line.category) continue;
    const current = detail.get(line.category) ?? 0;
    detail.set(line.category, current + line.balance);
  }

  // No SP categories defined yet — return zeroes
  return {
    totalAssets: 0,
    totalLiabilities: 0,
    equity: 0,
    detail,
  };
}
