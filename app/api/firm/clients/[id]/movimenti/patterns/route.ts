import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { listMovementPatterns, createMovementPattern } from "@/lib/queries/movement-patterns";

/**
 * GET /api/firm/clients/[id]/movimenti/patterns
 * List movement patterns for a client organization.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id: organizationId } = await params;

  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const url = new URL(request.url);
  const isActive = url.searchParams.get("isActive");

  const patterns = await listMovementPatterns(organizationId, {
    isActive: isActive != null ? isActive === "true" : undefined,
  });

  return Response.json({
    patterns: patterns.map((p) => ({
      id: p.id,
      descriptionRegex: p.descriptionRegex,
      cdgCategory: p.cdgCategory,
      vatRate: p.vatRate != null ? Number(p.vatRate) : null,
      priority: p.priority,
      isActive: p.isActive,
      matchCount: p.matchCount,
      createdAt: p.createdAt,
    })),
  });
}

/**
 * POST /api/firm/clients/[id]/movimenti/patterns
 * Create a new movement pattern.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id: organizationId } = await params;

  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const body = await request.json();
  const { descriptionRegex, cdgCategory, vatRate, priority } = body;

  if (!descriptionRegex || !cdgCategory) {
    return Response.json(
      { error: "descriptionRegex e cdgCategory sono obbligatori" },
      { status: 400 },
    );
  }

  try {
    const pattern = await createMovementPattern(organizationId, {
      descriptionRegex,
      cdgCategory,
      vatRate: vatRate ?? null,
      priority: priority ?? 100,
    });

    return Response.json({
      id: pattern.id,
      descriptionRegex: pattern.descriptionRegex,
      cdgCategory: pattern.cdgCategory,
      vatRate: pattern.vatRate != null ? Number(pattern.vatRate) : null,
      priority: pattern.priority,
      isActive: pattern.isActive,
      matchCount: pattern.matchCount,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Errore nella creazione" },
      { status: 400 },
    );
  }
}
