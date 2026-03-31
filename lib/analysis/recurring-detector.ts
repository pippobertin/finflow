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
 */
export async function detectRecurringExpenses(
  organizationId: string,
): Promise<RecurringSuggestion[]> {
  // Fetch outflow movements (negative amounts) from last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const movements = await prisma.bankStatement.findMany({
    where: {
      organizationId,
      amount: { lt: 0 },
      date: { gte: twelveMonthsAgo },
    },
    orderBy: { date: "asc" },
    select: { id: true, date: true, description: true, amount: true },
  });

  // Group by normalized description
  const groups = new Map<
    string,
    Array<{ id: string; date: Date; amount: number; description: string }>
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

    suggestions.push({
      description: items[0].description,
      normalizedDescription: normalizedDesc,
      avgAmount: Math.round(avgAmount * 100) / 100,
      occurrences: items.length,
      dayOfMonth: medianDay,
      firstSeen: items[0].date,
      lastSeen: items[items.length - 1].date,
      sampleIds: items.slice(0, 5).map((i) => i.id),
    });
  }

  // Sort by occurrences (most frequent first)
  suggestions.sort((a, b) => b.occurrences - a.occurrences);

  return suggestions;
}
