import { NextRequest } from "next/server";
import { getClientSession } from "@/lib/helpers/auth-guard";
import { getPreconsuntivo } from "@/lib/queries/budget-variance";

/**
 * GET /api/client/preconsuntivo?year=YYYY
 * Returns preconsuntivo for the logged-in client's organization.
 * Uses trustedOnly=true so only validated data is shown.
 */
export async function GET(request: NextRequest) {
  const { error, organizationId } = await getClientSession();
  if (error) return error;

  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (isNaN(year) || year < 2000 || year > 2100) {
    return Response.json({ error: "Anno non valido" }, { status: 400 });
  }

  const result = await getPreconsuntivo(organizationId, year, { trustedOnly: true });
  if (!result) {
    return Response.json({ error: "Dati di previsione non ancora disponibili" }, { status: 404 });
  }

  return Response.json(result);
}
