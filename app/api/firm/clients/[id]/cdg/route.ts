import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { getFirmOrganization } from "@/lib/queries/firm";
import { getIncomeStatement, listSnapshots } from "@/lib/queries/income-statement";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;

  // Verify client belongs to this firm
  const org = await getFirmOrganization(id, accountingFirmId);
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const sp = request.nextUrl.searchParams;

  if (sp.get("list") === "true") {
    const snapshots = await listSnapshots(id);
    return Response.json({ snapshots });
  }

  const snapshotId = sp.get("snapshotId") ?? undefined;
  const result = await getIncomeStatement(id, snapshotId);

  if (!result) {
    return Response.json(
      { error: "Nessun bilancio di verifica trovato. Caricare un BV per procedere." },
      { status: 404 },
    );
  }

  return Response.json(result);
}
