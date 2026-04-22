import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { updateMovementPattern, deleteMovementPattern } from "@/lib/queries/movement-patterns";

/**
 * PATCH /api/firm/clients/[id]/movimenti/patterns/[patternId]
 * Update a movement pattern.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patternId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id: organizationId, patternId } = await params;

  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const body = await request.json();

  try {
    const result = await updateMovementPattern(patternId, organizationId, body);
    if (result.count === 0) {
      return Response.json({ error: "Pattern non trovato" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Errore nell'aggiornamento" },
      { status: 400 },
    );
  }
}

/**
 * DELETE /api/firm/clients/[id]/movimenti/patterns/[patternId]
 * Deactivate a movement pattern (soft delete).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; patternId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id: organizationId, patternId } = await params;

  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const result = await deleteMovementPattern(patternId, organizationId);
  if (result.count === 0) {
    return Response.json({ error: "Pattern non trovato" }, { status: 404 });
  }

  return Response.json({ success: true });
}
