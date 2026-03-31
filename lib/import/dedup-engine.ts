import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

/**
 * Compute a fingerprint for a bank statement row.
 * Uses SHA-256 of "YYYY-MM-DD|amount|sorted_keywords" for deterministic dedup.
 */
export function computeFingerprint(date: Date, amount: number, description: string): string {
  const dateStr = date.toISOString().slice(0, 10);
  const amountStr = amount.toFixed(2);
  // Normalize description: lowercase, extract alphanumeric tokens, sort
  const keywords = description
    .toLowerCase()
    .replace(/[^a-z0-9àèéìòùü\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .sort()
    .join(" ");

  const input = `${dateStr}|${amountStr}|${keywords}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}

/**
 * Jaccard similarity between two sets of tokens.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function tokenize(description: string): Set<string> {
  return new Set(
    description
      .toLowerCase()
      .replace(/[^a-z0-9àèéìòùü\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

export interface DedupRow {
  date: Date;
  amount: number;
  description: string;
  fingerprint: string;
}

export interface DedupResult {
  newRows: DedupRow[];
  duplicateRows: DedupRow[];
  ambiguousRows: Array<DedupRow & { existingId: string; similarity: number }>;
}

/**
 * Check a batch of new rows against existing bank statements.
 * Returns categorized results: new (safe to insert), duplicate (skip), ambiguous (user review).
 */
export async function findDuplicates(
  organizationId: string,
  newRows: Array<{ date: Date; amount: number; description: string }>,
): Promise<DedupResult> {
  // Compute fingerprints for all new rows
  const rowsWithFp: DedupRow[] = newRows.map((r) => ({
    ...r,
    fingerprint: computeFingerprint(r.date, r.amount, r.description),
  }));

  // Get existing fingerprints from DB
  const fingerprints = rowsWithFp.map((r) => r.fingerprint);
  const existing = await prisma.bankStatement.findMany({
    where: {
      organizationId,
      fingerprint: { in: fingerprints },
    },
    select: { id: true, fingerprint: true, date: true, amount: true, description: true },
  });

  const existingFpSet = new Set(existing.map((e) => e.fingerprint).filter(Boolean));

  // For ambiguous detection: find rows with same date+amount but different description
  const dateAmountKey = (d: Date, a: number) => `${d.toISOString().slice(0, 10)}|${a.toFixed(2)}`;

  const existingByDateAmount = new Map<string, typeof existing>();
  // Only fetch potential matches for non-fingerprint-matched rows
  const potentialDates = rowsWithFp
    .filter((r) => !existingFpSet.has(r.fingerprint))
    .map((r) => r.date);

  if (potentialDates.length > 0) {
    const minDate = new Date(Math.min(...potentialDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...potentialDates.map((d) => d.getTime())));

    const nearbyExisting = await prisma.bankStatement.findMany({
      where: {
        organizationId,
        date: { gte: minDate, lte: maxDate },
      },
      select: { id: true, fingerprint: true, date: true, amount: true, description: true },
    });

    for (const e of nearbyExisting) {
      const key = dateAmountKey(e.date, Number(e.amount));
      if (!existingByDateAmount.has(key)) existingByDateAmount.set(key, []);
      existingByDateAmount.get(key)!.push(e);
    }
  }

  const result: DedupResult = { newRows: [], duplicateRows: [], ambiguousRows: [] };

  for (const row of rowsWithFp) {
    // Exact fingerprint match → duplicate
    if (existingFpSet.has(row.fingerprint)) {
      result.duplicateRows.push(row);
      continue;
    }

    // Check for same date+amount with different description
    const key = dateAmountKey(row.date, row.amount);
    const candidates = existingByDateAmount.get(key);

    if (candidates && candidates.length > 0) {
      const rowTokens = tokenize(row.description);
      let bestMatch: { id: string; similarity: number } | null = null;

      for (const candidate of candidates) {
        const candidateTokens = tokenize(candidate.description);
        const similarity = jaccardSimilarity(rowTokens, candidateTokens);
        if (similarity > 0.5 && (!bestMatch || similarity > bestMatch.similarity)) {
          bestMatch = { id: candidate.id, similarity };
        }
      }

      if (bestMatch) {
        result.ambiguousRows.push({
          ...row,
          existingId: bestMatch.id,
          similarity: bestMatch.similarity,
        });
        continue;
      }
    }

    // No match → new
    result.newRows.push(row);
  }

  return result;
}
