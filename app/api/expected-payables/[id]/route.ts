import { NextRequest } from "next/server";
import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import {
  getExpectedPayable,
  updateExpectedPayable,
  deleteExpectedPayable,
} from "@/lib/queries/expected-payables";
import { expectedPayableUpdateSchema } from "@/lib/validations/expected-payables";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  try {
    const { id } = await params;
    const data = await getExpectedPayable(id, organizationId);
    if (!data) {
      return Response.json({ error: "Fattura passiva attesa non trovata" }, { status: 404 });
    }
    return Response.json(data);
  } catch (e) {
    console.error("[expected-payables] GET [id] error:", e);
    return Response.json({ error: "Tabella non disponibile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = expectedPayableUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const data = await updateExpectedPayable(id, organizationId, parsed.data);
    if (!data) {
      return Response.json({ error: "Fattura passiva attesa non trovata" }, { status: 404 });
    }
    return Response.json(data);
  } catch (e) {
    console.error("[expected-payables] PUT error:", e);
    return Response.json({ error: "Tabella non disponibile" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  try {
    const { id } = await params;
    const data = await deleteExpectedPayable(id, organizationId);
    if (!data) {
      return Response.json({ error: "Fattura passiva attesa non trovata" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (e) {
    console.error("[expected-payables] DELETE error:", e);
    return Response.json({ error: "Tabella non disponibile" }, { status: 500 });
  }
}
