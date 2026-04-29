import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { detectUncategorizedGroups } from "@/lib/analysis/recurring-detector";

/**
 * GET /api/firm/clients/[id]/movimenti/suggestions
 * Get uncategorized movements grouped by similar description,
 * with suggested CDG category and confidence.
 */
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const suggestions = await detectUncategorizedGroups(organizationId);

    return Response.json({
      suggestions: suggestions.map((s) => ({
        description: s.description,
        normalizedDescription: s.normalizedDescription,
        avgAmount: s.avgAmount,
        occurrences: s.occurrences,
        firstSeen: s.firstSeen,
        lastSeen: s.lastSeen,
        sampleIds: s.sampleIds,
        suggestedCdgCategory: s.suggestedCdgCategory,
        suggestedVatRate: s.suggestedVatRate,
        confidence: s.confidence,
      })),
      total: suggestions.length,
    });
  } catch (err) {
    console.error("[movimenti/suggestions] Error:", err);
    return Response.json({ error: "Errore nel calcolo dei suggerimenti" }, { status: 500 });
  }
}
