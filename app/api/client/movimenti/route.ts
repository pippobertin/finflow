import { NextRequest } from "next/server";
import { getClientSession } from "@/lib/helpers/auth-guard";
import { listBankStatements } from "@/lib/queries/bank-statements";

/**
 * GET /api/client/movimenti
 *
 * List bank statement movements for the client organization.
 * Read-only view with CDG category info.
 *
 * Query params:
 *   search, startDate, endDate, page, pageSize, categorized
 */
export async function GET(request: NextRequest) {
  const { error, organizationId } = await getClientSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;

  try {
    const data = await listBankStatements({
      organizationId,
      search: sp.get("search") ?? undefined,
      startDate: sp.get("startDate") ? new Date(sp.get("startDate")!) : undefined,
      endDate: sp.get("endDate") ? new Date(sp.get("endDate")!) : undefined,
      categorized:
        sp.get("categorized") === "true"
          ? true
          : sp.get("categorized") === "false"
            ? false
            : undefined,
      page: sp.get("page") ? parseInt(sp.get("page")!) : 1,
      pageSize: sp.get("pageSize") ? parseInt(sp.get("pageSize")!) : 30,
    });

    return Response.json(data);
  } catch (err) {
    console.error("[client/movimenti] Error:", err);
    return Response.json({ error: "Errore nel caricamento dei movimenti" }, { status: 500 });
  }
}
