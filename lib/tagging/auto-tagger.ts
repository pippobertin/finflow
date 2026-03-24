import { prisma } from "@/lib/prisma";

/**
 * Auto-tag invoices by matching against cost center keywords and historical data.
 *
 * Cascade logic:
 * 1. Keywords: match invoice description/counterpart against CostCenter.keywords[]
 * 2. Historical: if no keyword match, find most-used costCenter for same counterpart
 * 3. Fallback: if nothing matches, leave needsTagging = true
 */
export async function autoTagInvoices(
  organizationId: string,
  invoiceIds?: string[],
): Promise<{ tagged: number; untagged: number }> {
  // Fetch cost centers with keywords
  const costCenters = await prisma.costCenter.findMany({
    where: { organizationId },
    select: { id: true, keywords: true },
  });

  // Build keyword → costCenterId lookup (lowercase)
  const keywordMap = new Map<string, string>();
  for (const cc of costCenters) {
    for (const kw of cc.keywords) {
      keywordMap.set(kw.toLowerCase(), cc.id);
    }
  }

  // Fetch invoices to tag
  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      ...(invoiceIds?.length ? { id: { in: invoiceIds } } : { needsTagging: true }),
    },
    select: {
      id: true,
      description: true,
      counterpart: true,
    },
  });

  let tagged = 0;
  let untagged = 0;

  for (const invoice of invoices) {
    let matchedCostCenterId: string | null = null;

    // 1. Keyword matching
    const searchText = `${invoice.description ?? ""} ${invoice.counterpart}`.toLowerCase();
    for (const [keyword, costCenterId] of keywordMap) {
      if (searchText.includes(keyword)) {
        matchedCostCenterId = costCenterId;
        break;
      }
    }

    // 2. Historical counterpart matching
    if (!matchedCostCenterId) {
      const historical = await prisma.invoice.groupBy({
        by: ["costCenterId"],
        where: {
          organizationId,
          counterpart: invoice.counterpart,
          costCenterId: { not: null },
          needsTagging: false,
        },
        _count: { costCenterId: true },
        orderBy: { _count: { costCenterId: "desc" } },
        take: 1,
      });

      if (historical.length > 0 && historical[0].costCenterId) {
        matchedCostCenterId = historical[0].costCenterId;
      }
    }

    // 3. Update invoice
    if (matchedCostCenterId) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          costCenterId: matchedCostCenterId,
          needsTagging: false,
        },
      });
      tagged++;
    } else {
      // Ensure needsTagging stays true
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { needsTagging: true },
      });
      untagged++;
    }
  }

  return { tagged, untagged };
}
