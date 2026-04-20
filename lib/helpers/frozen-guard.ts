/**
 * Guard for preventing mutations on frozen records.
 * Returns a 423 Locked Response if the record is frozen, null otherwise.
 *
 * Ref: docs/adr/005-data-freezing-strategy.md
 */

import { prisma } from "@/lib/prisma";

type FrozenModel = "invoice" | "bankStatement" | "recurringExpense" | "oneOffExpense";

/**
 * Check if a single record is frozen. Returns a 423 Response if yes, null if no.
 */
export async function checkFrozen(
  model: FrozenModel,
  id: string,
  organizationId: string,
): Promise<Response | null> {
  const record = await findRecord(model, id, organizationId);
  if (!record) return null; // let the caller handle 404
  if (record.isFrozen) {
    return Response.json(
      { error: "Record congelato — impossibile modificare dati di un periodo confermato" },
      { status: 423 },
    );
  }
  return null;
}

/**
 * Check if any record in a list of IDs is frozen.
 * Returns a 423 Response with the frozen IDs, or null if none are frozen.
 */
export async function checkBulkFrozen(
  model: FrozenModel,
  ids: string[],
  organizationId: string,
): Promise<Response | null> {
  const frozenIds = await findFrozenIds(model, ids, organizationId);
  if (frozenIds.length > 0) {
    return Response.json(
      {
        error: `${frozenIds.length} record congelati — impossibile modificare dati di un periodo confermato`,
        frozenIds,
      },
      { status: 423 },
    );
  }
  return null;
}

// ─── Internal ───────────────────────────────────────────────

async function findRecord(model: FrozenModel, id: string, organizationId: string) {
  const where = { id, organizationId };
  const select = { isFrozen: true } as const;
  switch (model) {
    case "invoice":
      return prisma.invoice.findFirst({ where, select });
    case "bankStatement":
      return prisma.bankStatement.findFirst({ where, select });
    case "recurringExpense":
      return prisma.recurringExpense.findFirst({ where, select });
    case "oneOffExpense":
      return prisma.oneOffExpense.findFirst({ where, select });
  }
}

async function findFrozenIds(
  model: FrozenModel,
  ids: string[],
  organizationId: string,
): Promise<string[]> {
  const where = { id: { in: ids }, organizationId, isFrozen: true };
  const select = { id: true } as const;
  let records: { id: string }[];
  switch (model) {
    case "invoice":
      records = await prisma.invoice.findMany({ where, select });
      break;
    case "bankStatement":
      records = await prisma.bankStatement.findMany({ where, select });
      break;
    case "recurringExpense":
      records = await prisma.recurringExpense.findMany({ where, select });
      break;
    case "oneOffExpense":
      records = await prisma.oneOffExpense.findMany({ where, select });
      break;
  }
  return records.map((r) => r.id);
}
