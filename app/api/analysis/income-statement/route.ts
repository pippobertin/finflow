import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { getIncomeStatement, listSnapshots } from "@/lib/queries/income-statement";

/**
 * GET /api/analysis/income-statement
 *
 * Query params:
 *   snapshotId? — specific snapshot (defaults to most recent locked)
 *   list=true   — return available snapshots instead
 */
export async function GET(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;

  // List mode
  if (sp.get("list") === "true") {
    const snapshots = await listSnapshots(organizationId);
    return Response.json({ snapshots });
  }

  // CE mode
  const snapshotId = sp.get("snapshotId") ?? undefined;
  const result = await getIncomeStatement(organizationId, snapshotId);

  if (!result) {
    return Response.json(
      { error: "Nessun bilancio di verifica trovato. Caricare un BV per procedere." },
      { status: 404 },
    );
  }

  return Response.json(result);
}
