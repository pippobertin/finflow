import { prisma } from "@/lib/prisma";
import { computeVatSplit } from "@/lib/vat/vat-split";

export interface MovementPatternInput {
  descriptionRegex: string;
  cdgCategory: string;
  vatRate?: number | null;
  priority?: number;
}

/**
 * List movement patterns for an organization.
 */
export async function listMovementPatterns(organizationId: string, opts?: { isActive?: boolean }) {
  return prisma.movementPattern.findMany({
    where: {
      organizationId,
      ...(opts?.isActive != null ? { isActive: opts.isActive } : {}),
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
}

/**
 * Create a movement pattern.
 */
export async function createMovementPattern(organizationId: string, data: MovementPatternInput) {
  // Validate regex
  try {
    new RegExp(data.descriptionRegex, "i");
  } catch {
    throw new Error(`Regex non valida: "${data.descriptionRegex}"`);
  }

  return prisma.movementPattern.create({
    data: {
      organizationId,
      descriptionRegex: data.descriptionRegex,
      cdgCategory: data.cdgCategory,
      vatRate: data.vatRate ?? null,
      priority: data.priority ?? 100,
    },
  });
}

/**
 * Update a movement pattern (must belong to organization).
 */
export async function updateMovementPattern(
  id: string,
  organizationId: string,
  data: Partial<MovementPatternInput> & { isActive?: boolean },
) {
  // Validate regex if changed
  if (data.descriptionRegex) {
    try {
      new RegExp(data.descriptionRegex, "i");
    } catch {
      throw new Error(`Regex non valida: "${data.descriptionRegex}"`);
    }
  }

  return prisma.movementPattern.updateMany({
    where: { id, organizationId },
    data: {
      ...(data.descriptionRegex != null ? { descriptionRegex: data.descriptionRegex } : {}),
      ...(data.cdgCategory != null ? { cdgCategory: data.cdgCategory } : {}),
      ...(data.vatRate !== undefined ? { vatRate: data.vatRate } : {}),
      ...(data.priority != null ? { priority: data.priority } : {}),
      ...(data.isActive != null ? { isActive: data.isActive } : {}),
    },
  });
}

/**
 * Deactivate a movement pattern (soft delete).
 */
export async function deleteMovementPattern(id: string, organizationId: string) {
  return prisma.movementPattern.updateMany({
    where: { id, organizationId },
    data: { isActive: false },
  });
}

/**
 * Match a description against all active patterns for an organization.
 * Returns the best matching pattern (lowest priority number wins).
 */
export async function matchMovementAgainstPatterns(
  organizationId: string,
  description: string,
): Promise<{
  patternId: string;
  cdgCategory: string;
  vatRate: number | null;
} | null> {
  const patterns = await prisma.movementPattern.findMany({
    where: { organizationId, isActive: true },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern.descriptionRegex, "i");
      if (regex.test(description)) {
        return {
          patternId: pattern.id,
          cdgCategory: pattern.cdgCategory,
          vatRate: pattern.vatRate != null ? Number(pattern.vatRate) : null,
        };
      }
    } catch {
      // Skip invalid regex
      continue;
    }
  }

  return null;
}

/**
 * Apply all active patterns to uncategorized bank statements.
 * Returns the number of statements categorized.
 */
export async function applyPatternsToUncategorized(
  organizationId: string,
): Promise<{ categorized: number; patternMatches: Map<string, number> }> {
  const patterns = await prisma.movementPattern.findMany({
    where: { organizationId, isActive: true },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  if (patterns.length === 0) return { categorized: 0, patternMatches: new Map() };

  // Compile all regex upfront
  const compiled = patterns
    .map((p) => {
      try {
        return { pattern: p, regex: new RegExp(p.descriptionRegex, "i") };
      } catch {
        return null;
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Fetch uncategorized (not frozen) statements
  const statements = await prisma.bankStatement.findMany({
    where: {
      organizationId,
      cdgCategory: null,
      OR: [{ isFrozen: false }, { isFrozen: null }],
    },
    select: { id: true, description: true, amount: true },
  });

  let categorized = 0;
  const patternMatches = new Map<string, number>();

  for (const stmt of statements) {
    // Find first matching pattern (already sorted by priority)
    for (const { pattern, regex } of compiled) {
      if (regex.test(stmt.description)) {
        const amount = Math.abs(Number(stmt.amount));
        const vatRate = pattern.vatRate != null ? Number(pattern.vatRate) : null;

        // Compute VAT split if vatRate is set
        const vatSplit =
          vatRate != null && vatRate > 0
            ? computeVatSplit(amount, { isVatable: true, vatRate })
            : null;

        await prisma.bankStatement.update({
          where: { id: stmt.id },
          data: {
            cdgCategory: pattern.cdgCategory,
            ...(vatSplit ? { netAmount: vatSplit.netAmount, vatAmount: vatSplit.vatAmount } : {}),
          },
        });

        categorized++;
        patternMatches.set(pattern.id, (patternMatches.get(pattern.id) ?? 0) + 1);
        break; // First match wins
      }
    }
  }

  // Update matchCount on patterns
  for (const [patternId, count] of patternMatches) {
    await prisma.movementPattern.update({
      where: { id: patternId },
      data: { matchCount: { increment: count } },
    });
  }

  return { categorized, patternMatches };
}
