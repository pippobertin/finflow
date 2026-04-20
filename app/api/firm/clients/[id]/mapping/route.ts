import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { listFirmMappings, upsertFirmMappings, type UpsertMappingInput } from "@/lib/queries/firm";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const mappings = await listFirmMappings(id, accountingFirmId);

  if (mappings === null) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  return Response.json(mappings);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const body = (await request.json()) as { mappings: UpsertMappingInput[] };

  if (!body.mappings || !Array.isArray(body.mappings) || body.mappings.length === 0) {
    return Response.json({ error: "mappings è obbligatorio" }, { status: 400 });
  }

  const result = await upsertFirmMappings(id, accountingFirmId, body.mappings);

  if (result === null) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  return Response.json({ count: result.length });
}
