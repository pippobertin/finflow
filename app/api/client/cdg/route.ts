import { NextRequest } from "next/server";
import { getClientSession } from "@/lib/helpers/auth-guard";
import { getIncomeStatement, listSnapshots } from "@/lib/queries/income-statement";
import {
  computeBreakEven,
  computeHealthIndicators,
  generateNarrative,
} from "@/lib/analysis/client-indicators";

/**
 * GET /api/client/cdg
 *
 * Returns CE riclassificato + ratios + indicators + BEP + narrative
 * for the authenticated client's organization.
 *
 * Query params:
 *   list=true — returns available snapshots only
 *   snapshotId=xxx — use specific snapshot (defaults to most recent locked)
 */
export async function GET(request: NextRequest) {
  const { error, organizationId } = await getClientSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;

  if (sp.get("list") === "true") {
    const snapshots = await listSnapshots(organizationId, { trustedOnly: true });
    return Response.json({ snapshots });
  }

  // ADR-008: client workspace only sees trusted (validated) snapshots
  const snapshotId = sp.get("snapshotId") ?? undefined;
  const result = await getIncomeStatement(organizationId, snapshotId, { trustedOnly: true });

  if (!result) {
    return Response.json(
      {
        error: "Il commercialista sta preparando i dati della tua azienda. Torna a breve.",
      },
      { status: 404 },
    );
  }

  // Compute client-specific data
  const bep = computeBreakEven(result.incomeStatement);
  const indicators = computeHealthIndicators(result.incomeStatement, result.ratios, bep);
  const periodLabel = `${result.periodStart} – ${result.periodEnd}`;
  const narrative = generateNarrative(result.incomeStatement, result.ratios, bep, periodLabel);

  return Response.json({
    ...result,
    bep,
    indicators,
    narrative,
  });
}
