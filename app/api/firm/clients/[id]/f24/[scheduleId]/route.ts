import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/firm/clients/[id]/f24/[scheduleId]
 * Update an F24 schedule entry.
 * Body: { amount?, isPaid?, paidDate?, notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, scheduleId } = await params;
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });

  const existing = await prisma.f24Schedule.findFirst({
    where: { id: scheduleId, organizationId: id },
  });
  if (!existing) return Response.json({ error: "F24 non trovato" }, { status: 404 });

  const body = await request.json();
  const { amount, isPaid, paidDate, notes } = body;

  const updated = await prisma.f24Schedule.update({
    where: { id: scheduleId },
    data: {
      ...(amount !== undefined && { amount }),
      ...(isPaid !== undefined && { isPaid }),
      ...(paidDate !== undefined && { paidDate: paidDate ? new Date(paidDate) : null }),
      ...(notes !== undefined && { notes }),
    },
  });

  return Response.json({
    id: updated.id,
    periodLabel: updated.periodLabel,
    codiceTributo: updated.codiceTributo,
    amount: Number(updated.amount),
    dueDate: updated.dueDate.toISOString().slice(0, 10),
    isPaid: updated.isPaid,
    paidDate: updated.paidDate?.toISOString().slice(0, 10) ?? null,
    notes: updated.notes,
  });
}

/**
 * DELETE /api/firm/clients/[id]/f24/[scheduleId]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, scheduleId } = await params;
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });

  const existing = await prisma.f24Schedule.findFirst({
    where: { id: scheduleId, organizationId: id },
  });
  if (!existing) return Response.json({ error: "F24 non trovato" }, { status: 404 });

  await prisma.f24Schedule.delete({ where: { id: scheduleId } });
  return Response.json({ deleted: true });
}
