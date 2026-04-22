import { prisma } from "@/lib/prisma";

export interface RecurringSuggestion {
  description: string;
  normalizedDescription: string;
  avgAmount: number;
  occurrences: number;
  dayOfMonth: number;
  firstSeen: Date;
  lastSeen: Date;
  sampleIds: string[];
  /** Suggested CDG category from already-categorized matches in the group */
  suggestedCdgCategory: string | null;
  /** Suggested VAT rate from categorized matches */
  suggestedVatRate: number | null;
  /** Confidence score 0..1 based on categorized ratio and consistency */
  confidence: number;
}

/**
 * Normalize a bank statement description for grouping.
 * Removes dates, amounts, reference numbers, and normalizes whitespace.
 */
function normalizeDescription(desc: string): string {
  return (
    desc
      .toUpperCase()
      // Remove dates (DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY)
      .replace(/\d{2}[\/.\-]\d{2}[\/.\-]\d{2,4}/g, "")
      // Remove amounts (with dots/commas)
      .replace(/\d{1,3}(?:[.\s]\d{3})*,\d{2}/g, "")
      // Remove reference numbers (TRN, mandato, etc.)
      .replace(/TRN\s*\S+/gi, "")
      .replace(/MANDATO\s*\S+/gi, "")
      // Remove pure numeric sequences
      .replace(/\b\d{4,}\b/g, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Token-based fuzzy grouping: group descriptions that share >70% of tokens.
 */
function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function tokenSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Analyze bank statements for recurring patterns.
 * Groups by normalized description, checks monthly regularity (±5 days),
 * requires at least 3 occurrences.
 * Searches ALL history (not just 12 months) for better pattern detection.
 */
export async function detectRecurringExpenses(
  organizationId: string,
): Promise<RecurringSuggestion[]> {
  // Fetch ALL outflow movements (full history for better detection)
  const movements = await prisma.bankStatement.findMany({
    where: {
      organizationId,
      amount: { lt: 0 },
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      description: true,
      amount: true,
      cdgCategory: true,
      vatAmount: true,
      netAmount: true,
    },
  });

  // Group by normalized description
  const groups = new Map<
    string,
    Array<{
      id: string;
      date: Date;
      amount: number;
      description: string;
      cdgCategory: string | null;
      vatAmount: number | null;
      netAmount: number | null;
    }>
  >();

  for (const m of movements) {
    const normalized = normalizeDescription(m.description);
    if (normalized.length < 5) continue;

    // Find existing group by fuzzy match
    const mTokens = tokenize(normalized);
    let matchedKey: string | null = null;

    for (const [key] of groups) {
      const keyTokens = tokenize(key);
      if (tokenSimilarity(mTokens, keyTokens) >= 0.7) {
        matchedKey = key;
        break;
      }
    }

    const groupKey = matchedKey || normalized;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push({
      id: m.id,
      date: m.date,
      amount: Math.abs(Number(m.amount)),
      description: m.description,
      cdgCategory: m.cdgCategory,
      vatAmount: m.vatAmount != null ? Number(m.vatAmount) : null,
      netAmount: m.netAmount != null ? Number(m.netAmount) : null,
    });
  }

  const suggestions: RecurringSuggestion[] = [];

  for (const [normalizedDesc, items] of groups) {
    // Need at least 3 occurrences
    if (items.length < 3) continue;

    // Check if they appear roughly monthly (±5 days)
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    const intervals: number[] = [];
    for (let i = 1; i < items.length; i++) {
      const daysDiff = Math.round(
        (items[i].date.getTime() - items[i - 1].date.getTime()) / (1000 * 60 * 60 * 24),
      );
      intervals.push(daysDiff);
    }

    // Average interval should be around 25-35 days for monthly
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const isMonthly = avgInterval >= 25 && avgInterval <= 40;

    if (!isMonthly) continue;

    // Check consistency of day-of-month (±5 days)
    const daysOfMonth = items.map((i) => i.date.getDate());
    const medianDay = daysOfMonth.sort((a, b) => a - b)[Math.floor(daysOfMonth.length / 2)];
    const consistentDays = daysOfMonth.filter((d) => Math.abs(d - medianDay) <= 5).length;

    if (consistentDays < items.length * 0.7) continue;

    const avgAmount = items.reduce((sum, i) => sum + i.amount, 0) / items.length;

    // Suggest CDG category from already-categorized items in this group
    const { suggestedCdgCategory, suggestedVatRate, confidence } = suggestCategoryFromGroup(items);

    suggestions.push({
      description: items[0].description,
      normalizedDescription: normalizedDesc,
      avgAmount: Math.round(avgAmount * 100) / 100,
      occurrences: items.length,
      dayOfMonth: medianDay,
      firstSeen: items[0].date,
      lastSeen: items[items.length - 1].date,
      sampleIds: items.slice(0, 5).map((i) => i.id),
      suggestedCdgCategory,
      suggestedVatRate,
      confidence,
    });
  }

  // Sort by occurrences (most frequent first)
  suggestions.sort((a, b) => b.occurrences - a.occurrences);

  return suggestions;
}

/**
 * Infer category from already-categorized items in a group.
 * Returns the most common cdgCategory + confidence based on categorized ratio.
 */
function suggestCategoryFromGroup(
  items: Array<{
    cdgCategory: string | null;
    vatAmount: number | null;
    netAmount: number | null;
    amount: number;
  }>,
): {
  suggestedCdgCategory: string | null;
  suggestedVatRate: number | null;
  confidence: number;
} {
  const categorized = items.filter((i) => i.cdgCategory != null);
  if (categorized.length === 0) {
    return { suggestedCdgCategory: null, suggestedVatRate: null, confidence: 0 };
  }

  // Count occurrences of each category
  const counts = new Map<string, number>();
  for (const item of categorized) {
    const cat = item.cdgCategory!;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }

  // Find the most common category
  let bestCategory = "";
  let bestCount = 0;
  for (const [cat, count] of counts) {
    if (count > bestCount) {
      bestCategory = cat;
      bestCount = count;
    }
  }

  // Confidence = (categorized with this category / total items) * consistency bonus
  const categorizedRatio = categorized.length / items.length;
  const categoryConsistency = bestCount / categorized.length;
  const confidence = Math.round(categorizedRatio * categoryConsistency * 100) / 100;

  // Infer VAT rate from categorized items that have vatAmount
  let suggestedVatRate: number | null = null;
  const withVat = categorized.filter(
    (i) => i.cdgCategory === bestCategory && i.vatAmount != null && i.amount > 0,
  );
  if (withVat.length > 0) {
    // Calculate average effective VAT rate
    const rates = withVat
      .map((i) => {
        const net = i.netAmount ?? i.amount - (i.vatAmount ?? 0);
        return net > 0 ? ((i.vatAmount ?? 0) / net) * 100 : 0;
      })
      .filter((r) => r > 0);

    if (rates.length > 0) {
      const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
      // Round to nearest standard rate (4, 5, 10, 22)
      const standardRates = [4, 5, 10, 22];
      suggestedVatRate = standardRates.reduce((closest, rate) =>
        Math.abs(rate - avgRate) < Math.abs(closest - avgRate) ? rate : closest,
      );
    }
  }

  return { suggestedCdgCategory: bestCategory, suggestedVatRate, confidence };
}

/**
 * Detect uncategorized movement groups for the pattern training wizard.
 * Groups ALL movements (not just outflows) by similar description,
 * requires at least 2 occurrences, and includes category suggestion from history.
 */
export async function detectUncategorizedGroups(
  organizationId: string,
): Promise<RecurringSuggestion[]> {
  // Fetch uncategorized movements
  const movements = await prisma.bankStatement.findMany({
    where: {
      organizationId,
      cdgCategory: null,
    },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      description: true,
      amount: true,
      cdgCategory: true,
      vatAmount: true,
      netAmount: true,
    },
    take: 2000, // Limit for performance
  });

  if (movements.length === 0) return [];

  // Also fetch categorized movements for suggestion
  const categorized = await prisma.bankStatement.findMany({
    where: {
      organizationId,
      cdgCategory: { not: null },
    },
    select: {
      description: true,
      cdgCategory: true,
      vatAmount: true,
      netAmount: true,
      amount: true,
    },
    distinct: ["description"],
    take: 500,
    orderBy: { date: "desc" },
  });

  // Group uncategorized by normalized description
  const groups = new Map<
    string,
    Array<{
      id: string;
      date: Date;
      amount: number;
      description: string;
      cdgCategory: string | null;
      vatAmount: number | null;
      netAmount: number | null;
    }>
  >();

  for (const m of movements) {
    const normalized = normalizeDescription(m.description);
    if (normalized.length < 5) continue;

    const mTokens = tokenize(normalized);
    let matchedKey: string | null = null;

    for (const [key] of groups) {
      const keyTokens = tokenize(key);
      if (tokenSimilarity(mTokens, keyTokens) >= 0.7) {
        matchedKey = key;
        break;
      }
    }

    const groupKey = matchedKey || normalized;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push({
      id: m.id,
      date: m.date,
      amount: Math.abs(Number(m.amount)),
      description: m.description,
      cdgCategory: null,
      vatAmount: null,
      netAmount: null,
    });
  }

  // Pre-tokenize categorized for similarity lookup
  const catTokenized = categorized.map((c) => ({
    tokens: tokenize(normalizeDescription(c.description)),
    cdgCategory: c.cdgCategory!,
    vatAmount: c.vatAmount != null ? Number(c.vatAmount) : null,
    netAmount: c.netAmount != null ? Number(c.netAmount) : null,
    amount: Math.abs(Number(c.amount)),
  }));

  const suggestions: RecurringSuggestion[] = [];

  for (const [normalizedDesc, items] of groups) {
    if (items.length < 2) continue;

    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    const avgAmount = items.reduce((sum, i) => sum + i.amount, 0) / items.length;
    const daysOfMonth = items.map((i) => i.date.getDate());
    const medianDay = daysOfMonth.sort((a, b) => a - b)[Math.floor(daysOfMonth.length / 2)];

    // Try to find a category suggestion from categorized history
    const groupTokens = tokenize(normalizedDesc);
    let bestSuggestion: { cdgCategory: string; vatRate: number | null; sim: number } | null = null;

    for (const cat of catTokenized) {
      const sim = tokenSimilarity(groupTokens, cat.tokens);
      if (sim >= 0.5 && (!bestSuggestion || sim > bestSuggestion.sim)) {
        // Infer VAT rate
        let vatRate: number | null = null;
        if (cat.vatAmount != null && cat.netAmount != null && cat.netAmount > 0) {
          const rawRate = (cat.vatAmount / cat.netAmount) * 100;
          const standardRates = [4, 5, 10, 22];
          vatRate = standardRates.reduce((closest, rate) =>
            Math.abs(rate - rawRate) < Math.abs(closest - rawRate) ? rate : closest,
          );
        }
        bestSuggestion = { cdgCategory: cat.cdgCategory, vatRate, sim };
      }
    }

    suggestions.push({
      description: items[0].description,
      normalizedDescription: normalizedDesc,
      avgAmount: Math.round(avgAmount * 100) / 100,
      occurrences: items.length,
      dayOfMonth: medianDay,
      firstSeen: items[0].date,
      lastSeen: items[items.length - 1].date,
      sampleIds: items.slice(0, 5).map((i) => i.id),
      suggestedCdgCategory: bestSuggestion?.cdgCategory ?? null,
      suggestedVatRate: bestSuggestion?.vatRate ?? null,
      confidence: bestSuggestion ? Math.round(bestSuggestion.sim * 100) / 100 : 0,
    });
  }

  // Sort by occurrences (most frequent first)
  suggestions.sort((a, b) => b.occurrences - a.occurrences);

  return suggestions;
}

// Export helpers for use in other modules
export { normalizeDescription, tokenize, tokenSimilarity };
