import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";

/**
 * GET /api/firm/clients/[id]/utenti
 *
 * List users belonging to the client organization.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;

  // Verify ownership
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const users = await prisma.user.findMany({
    where: { organizationId: id },
    select: {
      id: true,
      email: true,
      name: true,
      userType: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(users);
}

/**
 * POST /api/firm/clients/[id]/utenti
 *
 * Create a new user for the client organization.
 * Body: { email, name?, userType: "CLIENT_OWNER" | "CLIENT_ADMIN_BANK_ONLY" }
 * Returns: { user, tempPassword }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;

  // Verify ownership
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true, accountingFirmId: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const body = await request.json();
  const { email, name, userType } = body;

  if (!email?.trim()) {
    return Response.json({ error: "Email obbligatoria" }, { status: 400 });
  }
  if (userType !== "CLIENT_OWNER" && userType !== "CLIENT_ADMIN_BANK_ONLY") {
    return Response.json(
      { error: "userType deve essere CLIENT_OWNER o CLIENT_ADMIN_BANK_ONLY" },
      { status: 400 },
    );
  }

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (existing) {
    return Response.json({ error: "Email già registrata" }, { status: 409 });
  }

  // Generate temp password (8 chars alphanumeric)
  const tempPassword = crypto.randomBytes(6).toString("base64url").slice(0, 8);
  const passwordHash = await hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      name: name?.trim() || null,
      passwordHash,
      role: "VIEWER",
      userType,
      organizationId: id,
      accountingFirmId: org.accountingFirmId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      userType: true,
      isActive: true,
      createdAt: true,
    },
  });

  return Response.json({ user, tempPassword }, { status: 201 });
}
