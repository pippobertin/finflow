import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { checkFrozen } from "@/lib/helpers/frozen-guard";
import { updateInvoice, deleteInvoice } from "@/lib/queries/invoices";
import { invoiceUpdateSchema } from "@/lib/validations/invoices";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const { id } = await params;

  const frozen = await checkFrozen("invoice", id, organizationId);
  if (frozen) return frozen;

  const body = await request.json();
  const parsed = invoiceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = await updateInvoice(id, organizationId, parsed.data);
  if (!data) {
    return Response.json({ error: "Fattura non trovata" }, { status: 404 });
  }
  return Response.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const { id } = await params;

  const frozen = await checkFrozen("invoice", id, organizationId);
  if (frozen) return frozen;

  const deleted = await deleteInvoice(id, organizationId);
  if (!deleted) {
    return Response.json({ error: "Fattura non trovata" }, { status: 404 });
  }
  return Response.json({ success: true });
}
