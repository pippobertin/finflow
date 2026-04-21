import { describe, it, expect } from "vitest";
import { computeVatSplit } from "../vat-split";
import type { VatSplitMapping } from "../vat-split";

describe("computeVatSplit", () => {
  // ─── Standard Italian VAT rates ───────────────────────────────────────────

  it("22% standard rate — scorporo from 1220", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: 22 };
    const result = computeVatSplit(1220, mapping);
    expect(result.netAmount).toBe(1000);
    expect(result.vatAmount).toBe(220);
  });

  it("22% rate — odd amount (123.45)", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: 22 };
    const result = computeVatSplit(123.45, mapping);
    // 123.45 / 1.22 = 101.18852... → 101.19
    // 123.45 - 101.19 = 22.26
    expect(result.netAmount).toBe(101.19);
    expect(result.vatAmount).toBe(22.26);
  });

  it("10% reduced rate — scorporo from 1100", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: 10 };
    const result = computeVatSplit(1100, mapping);
    expect(result.netAmount).toBe(1000);
    expect(result.vatAmount).toBe(100);
  });

  it("4% super-reduced rate — scorporo from 1040", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: 4 };
    const result = computeVatSplit(1040, mapping);
    expect(result.netAmount).toBe(1000);
    expect(result.vatAmount).toBe(40);
  });

  it("5% rate — scorporo from 525", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: 5 };
    const result = computeVatSplit(525, mapping);
    expect(result.netAmount).toBe(500);
    expect(result.vatAmount).toBe(25);
  });

  // ─── Non-vatable / exempt ─────────────────────────────────────────────────

  it("non-vatable category → full amount is net", () => {
    const mapping: VatSplitMapping = { isVatable: false, vatRate: 22 };
    const result = computeVatSplit(1000, mapping);
    expect(result.netAmount).toBe(1000);
    expect(result.vatAmount).toBe(0);
  });

  it("null mapping → full amount is net", () => {
    const result = computeVatSplit(1000, null);
    expect(result.netAmount).toBe(1000);
    expect(result.vatAmount).toBe(0);
  });

  it("null vatRate on vatable → treated as non-vatable", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: null };
    const result = computeVatSplit(500, mapping);
    expect(result.netAmount).toBe(500);
    expect(result.vatAmount).toBe(0);
  });

  it("zero vatRate on vatable → treated as non-vatable", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: 0 };
    const result = computeVatSplit(500, mapping);
    expect(result.netAmount).toBe(500);
    expect(result.vatAmount).toBe(0);
  });

  // ─── Prisma Decimal edge case (comes as string) ──────────────────────────

  it("vatRate as string '22' — Prisma Decimal", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: "22" };
    const result = computeVatSplit(1220, mapping);
    expect(result.netAmount).toBe(1000);
    expect(result.vatAmount).toBe(220);
  });

  it("vatRate as string '10.00' — Prisma Decimal with decimals", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: "10.00" };
    const result = computeVatSplit(550, mapping);
    expect(result.netAmount).toBe(500);
    expect(result.vatAmount).toBe(50);
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  it("zero gross amount", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: 22 };
    const result = computeVatSplit(0, mapping);
    expect(result.netAmount).toBe(0);
    expect(result.vatAmount).toBe(0);
  });

  it("negative gross amount (refund/credit note)", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: 22 };
    const result = computeVatSplit(-1220, mapping);
    expect(result.netAmount).toBe(-1000);
    expect(result.vatAmount).toBe(-220);
  });

  it("very large amount preserves precision", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: 22 };
    const result = computeVatSplit(1220000, mapping);
    expect(result.netAmount).toBe(1000000);
    expect(result.vatAmount).toBe(220000);
  });

  it("net + vat always equals gross (rounding consistency)", () => {
    const mapping: VatSplitMapping = { isVatable: true, vatRate: 22 };
    const grossAmounts = [99.99, 1.01, 333.33, 7777.77, 0.01];
    for (const gross of grossAmounts) {
      const result = computeVatSplit(gross, mapping);
      // Due to independent rounding, allow ±0.01 tolerance
      expect(Math.abs(result.netAmount + result.vatAmount - gross)).toBeLessThanOrEqual(0.01);
    }
  });
});
