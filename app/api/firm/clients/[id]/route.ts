import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import {
  getFirmOrganization,
  updateFirmOrganization,
  type UpdateOrganizationInput,
} from "@/lib/queries/firm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const org = await getFirmOrganization(id, accountingFirmId);

  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  return Response.json(org);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const body = (await request.json()) as UpdateOrganizationInput;

  // Merge settings with existing to avoid overwriting other keys
  if (body.settings) {
    const org = await getFirmOrganization(id, accountingFirmId);
    if (!org) {
      return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
    }
    const existing = (org.settings as Record<string, unknown>) ?? {};
    const incoming = body.settings as Record<string, unknown>;
    body.settings = { ...existing, ...incoming } as Prisma.InputJsonValue;
  }

  const result = await updateFirmOrganization(id, accountingFirmId, body);

  if (result.count === 0) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  return Response.json({ success: true });
}
