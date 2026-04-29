import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { getFirmBudget, deleteFirmBudgetYear, getBudgetYears } from "@/lib/queries/budget";

/**
 * GET /api/firm/clients/[id]/budget?year=YYYY
 * Returns budget rows for the given year, or list of years with budget data.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const yearParam = request.nextUrl.searchParams.get("year");

  if (!yearParam) {
    // Return available years
    const years = await getBudgetYears(id);
    return Response.json({ years });
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return Response.json({ error: "Anno non valido" }, { status: 400 });
  }

  const rows = await getFirmBudget(id, accountingFirmId, year);
  if (rows === null) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  return Response.json({ year, rows });
}

/**
 * DELETE /api/firm/clients/[id]/budget?year=YYYY
 * Deletes all budget records for the given year.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const yearParam = request.nextUrl.searchParams.get("year");

  if (!yearParam) {
    return Response.json({ error: "Parametro year obbligatorio" }, { status: 400 });
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year)) {
    return Response.json({ error: "Anno non valido" }, { status: 400 });
  }

  const count = await deleteFirmBudgetYear(id, accountingFirmId, year);
  if (count === null) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  return Response.json({ deleted: count });
}
