import { NextRequest } from "next/server";
import { getClientOwnerSession } from "@/lib/helpers/auth-guard";
import { fetchScadenze } from "@/lib/queries/scadenze";

/**
 * GET /api/client/scadenze
 *
 * Returns a unified payment schedule for the client.
 * Query params: days=N (default 90, max 365)
 */
export async function GET(request: NextRequest) {
  const { error, organizationId } = await getClientOwnerSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;
  const daysAhead = Math.min(parseInt(sp.get("days") ?? "90") || 90, 365);

  try {
    const result = await fetchScadenze(organizationId, daysAhead);
    return Response.json({ ...result, horizon: daysAhead });
  } catch (err) {
    console.error("[client/scadenze] Error:", err);
    return Response.json({ error: "Errore nel calcolo delle scadenze" }, { status: 500 });
  }
}
