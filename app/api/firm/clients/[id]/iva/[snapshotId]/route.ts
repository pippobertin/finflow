import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { toggleVatPaid } from "@/lib/queries/vat-snapshots";

/**
 * PATCH /api/firm/clients/[id]/iva/[snapshotId]
 * Mark a VAT snapshot as paid or unpaid.
 *
 * Body: { isPaid: boolean, paidDate?: string | null }
 */
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, snapshotId } = await params;

  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const body = await request.json();
  const { isPaid, paidDate } = body as { isPaid: boolean; paidDate?: string | null };

  if (typeof isPaid !== "boolean") {
    return Response.json({ error: "isPaid obbligatorio (boolean)" }, { status: 400 });
  }

  try {
    const updated = await toggleVatPaid(snapshotId, isPaid, paidDate ?? null);
    return Response.json(updated);
  } catch {
    return Response.json({ error: "Snapshot non trovato" }, { status: 404 });
  }
}
