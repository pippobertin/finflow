/**
 * VAT Split (Scorporo IVA) — pure function.
 *
 * Given a gross amount and a chart-of-accounts mapping, computes the
 * net (imponibile) and VAT (imposta) components.
 *
 * Formula:  net = gross / (1 + vatRate/100)
 *           vat = gross - net
 *
 * When the mapping is absent or the category is not vatable,
 * the full gross amount is treated as net (no VAT component).
 */

export interface VatSplitMapping {
  isVatable: boolean;
  vatRate: number | string | null; // Decimal from Prisma comes as string
}

export interface VatSplitResult {
  netAmount: number;
  vatAmount: number;
}

/**
 * Compute the VAT split for a gross amount.
 *
 * @param grossAmount  The gross (IVA-inclusive) amount
 * @param mapping      The chart-of-accounts mapping (nullable)
 * @returns            { netAmount, vatAmount } rounded to 2 decimal places
 */
export function computeVatSplit(
  grossAmount: number,
  mapping: VatSplitMapping | null,
): VatSplitResult {
  // No mapping or not vatable → full amount is net, no VAT
  if (!mapping || !mapping.isVatable) {
    return { netAmount: grossAmount, vatAmount: 0 };
  }

  const rate = Number(mapping.vatRate ?? 0);

  // Zero or invalid rate → treat as non-vatable
  if (rate <= 0 || !Number.isFinite(rate)) {
    return { netAmount: grossAmount, vatAmount: 0 };
  }

  // Scorporo formula
  const net = grossAmount / (1 + rate / 100);
  const vat = grossAmount - net;

  return {
    netAmount: Math.round(net * 100) / 100,
    vatAmount: Math.round(vat * 100) / 100,
  };
}
