/**
 * Category suggestion engine (V1).
 *
 * Given a bank statement description, suggests a CDG category based on
 * previously categorized movements with similar descriptions.
 *
 * Strategy: token-overlap similarity (Jaccard-like).
 * No external dependencies, no DB persistence — runs at query time.
 */

import { prisma } from "@/lib/prisma";

interface SuggestionResult {
  cdgCategory: string;
  confidence: number; // 0..1
  matchedDescription: string;
}

/**
 * Tokenize a description into lowercase words, stripping noise.
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-zà-ú0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2), // drop tiny tokens (di, il, a, ...)
  );
}

/**
 * Jaccard similarity between two token sets.
 */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Suggest a CDG category for the given description, based on already-categorized
 * movements in the same organization.
 *
 * Returns the best match if confidence > threshold, or null.
 */
export async function suggestCategory(
  organizationId: string,
  description: string,
  threshold = 0.3,
): Promise<SuggestionResult | null> {
  // Fetch a sample of already-categorized movements (up to 500 distinct descriptions)
  const categorized = await prisma.bankStatement.findMany({
    where: {
      organizationId,
      cdgCategory: { not: null },
    },
    select: {
      description: true,
      cdgCategory: true,
    },
    distinct: ["description"],
    take: 500,
    orderBy: { date: "desc" },
  });

  if (categorized.length === 0) return null;

  const inputTokens = tokenize(description);
  if (inputTokens.size === 0) return null;

  let best: SuggestionResult | null = null;

  for (const row of categorized) {
    const rowTokens = tokenize(row.description);
    const sim = jaccard(inputTokens, rowTokens);
    if (sim > threshold && (!best || sim > best.confidence)) {
      best = {
        cdgCategory: row.cdgCategory!,
        confidence: Math.round(sim * 100) / 100,
        matchedDescription: row.description,
      };
    }
  }

  return best;
}

/**
 * Batch suggest categories for multiple descriptions at once.
 * More efficient than calling suggestCategory N times (single DB query).
 */
export async function suggestCategoriesBatch(
  organizationId: string,
  descriptions: string[],
  threshold = 0.3,
): Promise<Map<string, SuggestionResult | null>> {
  const categorized = await prisma.bankStatement.findMany({
    where: {
      organizationId,
      cdgCategory: { not: null },
    },
    select: {
      description: true,
      cdgCategory: true,
    },
    distinct: ["description"],
    take: 500,
    orderBy: { date: "desc" },
  });

  const results = new Map<string, SuggestionResult | null>();

  if (categorized.length === 0) {
    for (const d of descriptions) results.set(d, null);
    return results;
  }

  // Pre-tokenize categorized descriptions
  const tokenized = categorized.map((row) => ({
    tokens: tokenize(row.description),
    description: row.description,
    cdgCategory: row.cdgCategory!,
  }));

  for (const description of descriptions) {
    const inputTokens = tokenize(description);
    if (inputTokens.size === 0) {
      results.set(description, null);
      continue;
    }

    let best: SuggestionResult | null = null;
    for (const row of tokenized) {
      const sim = jaccard(inputTokens, row.tokens);
      if (sim > threshold && (!best || sim > best.confidence)) {
        best = {
          cdgCategory: row.cdgCategory,
          confidence: Math.round(sim * 100) / 100,
          matchedDescription: row.description,
        };
      }
    }
    results.set(description, best);
  }

  return results;
}
