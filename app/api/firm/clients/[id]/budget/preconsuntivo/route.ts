import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { getFirmPreconsuntivo } from "@/lib/queries/budget-variance";

/**
 * GET /api/firm/clients/[id]/budget/preconsuntivo?year=YYYY
 * Returns preconsuntivo (full-year projection) for the given year.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const yearParam = request.nextUrl.searchParams.get("year");

  if (!yearParam) {
    return Response.json({ error: "Parametro year obbligatorio" }, { status: 400 });
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return Response.json({ error: "Anno non valido" }, { status: 400 });
  }

  const result = await getFirmPreconsuntivo(id, accountingFirmId, year);
  if (!result) {
    return Response.json(
      { error: "Dati budget o consuntivo non disponibili per questo anno" },
      { status: 404 },
    );
  }

  return Response.json(result);
}
