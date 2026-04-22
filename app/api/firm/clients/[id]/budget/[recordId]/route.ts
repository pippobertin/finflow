import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { updateBudgetRecord } from "@/lib/queries/budget";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/firm/clients/[id]/budget/[recordId]
 * Edit a single budget record (amount and/or notes).
 *
 * Body: { amount?: number, notes?: string | null }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, recordId } = await params;

  // Ownership check
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const body = await request.json();
  const { amount, notes } = body as { amount?: number; notes?: string | null };

  if (amount !== undefined && (typeof amount !== "number" || amount < 0)) {
    return Response.json({ error: "Importo non valido" }, { status: 400 });
  }

  const updated = await updateBudgetRecord(recordId, id, { amount, notes });
  if (!updated) {
    return Response.json({ error: "Record budget non trovato" }, { status: 404 });
  }

  return Response.json(updated);
}
