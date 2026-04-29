import { NextRequest } from "next/server";
import { getClientOwnerSession } from "@/lib/helpers/auth-guard";
import { getVatSnapshots } from "@/lib/queries/vat-snapshots";

/**
 * GET /api/client/iva?year=YYYY
 * Returns VAT snapshots for the logged-in client's organization (readonly).
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { error, organizationId } = await getClientOwnerSession();
  if (error) return error;

  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (isNaN(year) || year < 2000 || year > 2100) {
    return Response.json({ error: "Anno non valido" }, { status: 400 });
  }

  const snapshots = await getVatSnapshots(organizationId, year);
  return Response.json({ year, snapshots });
}
