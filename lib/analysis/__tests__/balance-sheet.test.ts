import { describe, it, expect } from "vitest";
import { computeBalanceSheet } from "../balance-sheet";

describe("computeBalanceSheet", () => {
  it("returns zeroes for empty input", () => {
    const result = computeBalanceSheet([]);
    expect(result.totalAssets).toBe(0);
    expect(result.totalLiabilities).toBe(0);
    expect(result.equity).toBe(0);
  });

  it("aggregates detail by category", () => {
    const result = computeBalanceSheet([
      { category: "ASSET_FIXED", balance: 10_000 },
      { category: "ASSET_FIXED", balance: 5_000 },
      { category: "LIABILITY_SHORT", balance: 3_000 },
    ]);
    expect(result.detail.get("ASSET_FIXED")).toBe(15_000);
    expect(result.detail.get("LIABILITY_SHORT")).toBe(3_000);
  });

  it("skips lines with empty category", () => {
    const result = computeBalanceSheet([
      { category: "", balance: 999 },
      { category: "ASSET_FIXED", balance: 1_000 },
    ]);
    expect(result.detail.size).toBe(1);
  });
});
