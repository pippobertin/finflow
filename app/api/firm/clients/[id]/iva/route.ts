import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { getVatSnapshots, recalculateVatSnapshotsV2 } from "@/lib/queries/vat-snapshots";

/**
 * GET /api/firm/clients/[id]/iva?year=YYYY
 * Returns VAT snapshots for the given year.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;

  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (isNaN(year) || year < 2000 || year > 2100) {
    return Response.json({ error: "Anno non valido" }, { status: 400 });
  }

  const snapshots = await getVatSnapshots(id, year);
  return Response.json({ year, snapshots });
}

/**
 * POST /api/firm/clients/[id]/iva?year=YYYY
 * Recalculate VAT snapshots using V2 engine (invoices + bank statements).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;

  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (isNaN(year) || year < 2000 || year > 2100) {
    return Response.json({ error: "Anno non valido" }, { status: 400 });
  }

  const snapshots = await recalculateVatSnapshotsV2(id, year);
  return Response.json({ year, snapshots, recalculated: true });
}
