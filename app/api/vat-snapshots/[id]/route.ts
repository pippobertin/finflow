import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { toggleVatPaid } from "@/lib/queries/vat-snapshots";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const isPaid = Boolean(body.isPaid);
  const paidDate = isPaid ? (body.paidDate ?? new Date().toISOString().split("T")[0]) : null;

  try {
    const updated = await toggleVatPaid(id, isPaid, paidDate);
    return Response.json(updated);
  } catch {
    return Response.json({ error: "Snapshot IVA non trovato" }, { status: 404 });
  }
}
