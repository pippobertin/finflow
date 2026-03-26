import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { getVatSnapshots, recalculateVatSnapshots } from "@/lib/queries/vat-snapshots";

export async function GET(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;
  const year = Number(sp.get("year") || new Date().getFullYear());

  if (isNaN(year) || year < 2020 || year > 2100) {
    return Response.json({ error: "Anno non valido" }, { status: 400 });
  }

  const snapshots = await getVatSnapshots(organizationId, year);
  return Response.json(snapshots);
}

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const year = Number(body.year || new Date().getFullYear());

  if (isNaN(year) || year < 2020 || year > 2100) {
    return Response.json({ error: "Anno non valido" }, { status: 400 });
  }

  const snapshots = await recalculateVatSnapshots(organizationId, year);
  return Response.json(snapshots);
}
