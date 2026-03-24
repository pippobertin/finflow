import { NextRequest } from "next/server";
import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import { getConnectorById, updateConnector, deleteConnector } from "@/lib/queries/connectors";
import { connectorUpdateSchema } from "@/lib/validations/connector";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const connector = await getConnectorById(id, organizationId);
    if (!connector) {
      return Response.json({ error: "Connettore non trovato" }, { status: 404 });
    }

    return Response.json(connector);
  } catch (err) {
    console.error("GET /api/connectors/[id] error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAdminSession();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = connectorUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Dati non validi", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updated = await updateConnector(id, organizationId, parsed.data);
    if (!updated) {
      return Response.json({ error: "Connettore non trovato" }, { status: 404 });
    }

    return Response.json(updated);
  } catch (err) {
    console.error("PUT /api/connectors/[id] error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error, organizationId } = await getAdminSession();
    if (error) return error;

    const { id } = await params;
    const deleted = await deleteConnector(id, organizationId);
    if (!deleted) {
      return Response.json({ error: "Connettore non trovato" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/connectors/[id] error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
