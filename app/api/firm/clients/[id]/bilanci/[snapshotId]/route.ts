import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { getFirmSnapshot, deleteFirmSnapshot } from "@/lib/queries/firm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, snapshotId } = await params;
  const snapshot = await getFirmSnapshot(snapshotId, id, accountingFirmId);

  if (!snapshot) {
    return Response.json({ error: "Snapshot non trovato" }, { status: 404 });
  }

  return Response.json(snapshot);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, snapshotId } = await params;
  const result = await deleteFirmSnapshot(snapshotId, id, accountingFirmId);

  if (result === null) {
    return Response.json({ error: "Snapshot non trovato" }, { status: 404 });
  }

  if ("locked" in result) {
    return Response.json(
      { error: "Impossibile eliminare uno snapshot confermato (locked)" },
      { status: 423 },
    );
  }

  return Response.json({ success: true });
}
