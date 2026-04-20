import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { listFirmSnapshots, createFirmSnapshot } from "@/lib/queries/firm";
import { parseTrialBalanceExcel } from "@/lib/parsers/cdg-trial-balance-parser";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const snapshots = await listFirmSnapshots(id, accountingFirmId);

  if (snapshots === null) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  return Response.json(snapshots);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId, session } = await getFirmSession();
  if (error) return error;

  const { id } = await params;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const periodStart = formData.get("periodStart") as string | null;
  const periodEnd = formData.get("periodEnd") as string | null;
  const sheetName = formData.get("sheetName") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!file || !periodStart || !periodEnd) {
    return Response.json(
      { error: "Campi obbligatori: file, periodStart, periodEnd" },
      { status: 400 },
    );
  }

  // Parse the Excel file
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseTrialBalanceExcel(buffer, {
    sheetName: sheetName || undefined,
  });

  if (parsed.errors.length > 0) {
    return Response.json(
      { error: "Errore nel parsing del file", details: parsed.errors },
      { status: 422 },
    );
  }

  // Create snapshot with lines
  const snapshot = await createFirmSnapshot(accountingFirmId, {
    organizationId: id,
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    uploadedById: session.user.id,
    sourceFilename: file.name,
    notes: notes || undefined,
    rows: parsed.rows,
  });

  if (!snapshot) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  return Response.json(
    {
      snapshot,
      totals: parsed.totals,
      warnings: parsed.warnings,
    },
    { status: 201 },
  );
}
