import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string; userId: string }> };

/**
 * PATCH /api/firm/clients/[id]/utenti/[userId]
 *
 * Update user: change userType or isActive.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, userId } = await params;

  // Verify org ownership
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  // Verify user belongs to org
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId: id },
  });
  if (!user) {
    return Response.json({ error: "Utente non trovato" }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.userType !== undefined) {
    if (body.userType !== "CLIENT_OWNER" && body.userType !== "CLIENT_ADMIN_BANK_ONLY") {
      return Response.json(
        { error: "userType deve essere CLIENT_OWNER o CLIENT_ADMIN_BANK_ONLY" },
        { status: 400 },
      );
    }
    data.userType = body.userType;
  }

  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nessun campo da aggiornare" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      userType: true,
      isActive: true,
      createdAt: true,
    },
  });

  return Response.json(updated);
}

/**
 * DELETE /api/firm/clients/[id]/utenti/[userId]
 *
 * Delete a user from the client organization.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, userId } = await params;

  // Verify org ownership
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  // Delete only if user belongs to this org
  const deleted = await prisma.user.deleteMany({
    where: { id: userId, organizationId: id },
  });

  if (deleted.count === 0) {
    return Response.json({ error: "Utente non trovato" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
