import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { getFirmVariance } from "@/lib/queries/budget-variance";

/**
 * GET /api/firm/clients/[id]/budget/varianze?year=YYYY&upToMonth=M
 * Returns budget vs actual variance for the given year.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const yearParam = request.nextUrl.searchParams.get("year");
  const monthParam = request.nextUrl.searchParams.get("upToMonth");

  if (!yearParam) {
    return Response.json({ error: "Parametro year obbligatorio" }, { status: 400 });
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return Response.json({ error: "Anno non valido" }, { status: 400 });
  }

  const upToMonth = monthParam ? parseInt(monthParam, 10) : undefined;
  if (upToMonth !== undefined && (isNaN(upToMonth) || upToMonth < 1 || upToMonth > 12)) {
    return Response.json({ error: "Mese non valido (1-12)" }, { status: 400 });
  }

  const result = await getFirmVariance(id, accountingFirmId, year, upToMonth);
  if (!result) {
    return Response.json(
      { error: "Dati budget o consuntivo non disponibili per questo anno" },
      { status: 404 },
    );
  }

  return Response.json(result);
}
