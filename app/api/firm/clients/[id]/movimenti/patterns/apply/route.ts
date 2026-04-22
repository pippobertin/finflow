import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { applyPatternsToUncategorized } from "@/lib/queries/movement-patterns";

/**
 * POST /api/firm/clients/[id]/movimenti/patterns/apply
 * Apply all active patterns to uncategorized movements.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  try {
    const { categorized, patternMatches } = await applyPatternsToUncategorized(organizationId);

    return Response.json({
      categorized,
      patternDetails: Array.from(patternMatches.entries()).map(([patternId, count]) => ({
        patternId,
        matchCount: count,
      })),
    });
  } catch (err) {
    console.error("[patterns/apply] Error:", err);
    return Response.json({ error: "Errore nell'applicazione dei pattern" }, { status: 500 });
  }
}
