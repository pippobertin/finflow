import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/firm/clients/[id]/loans/[loanId]
 * Update a loan schedule.
 */
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; loanId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, loanId } = await params;
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });

  const existing = await prisma.loanSchedule.findFirst({
    where: { id: loanId, organizationId: id },
  });
  if (!existing) return Response.json({ error: "Prestito non trovato" }, { status: 404 });

  const body = await request.json();
  const {
    loanName,
    bankName,
    totalAmount,
    installment,
    principal,
    interest,
    frequency,
    startDate,
    endDate,
    dayOfMonth,
    notes,
  } = body;

  const updated = await prisma.loanSchedule.update({
    where: { id: loanId },
    data: {
      ...(loanName !== undefined && { loanName }),
      ...(bankName !== undefined && { bankName }),
      ...(totalAmount !== undefined && { totalAmount }),
      ...(installment !== undefined && { installment }),
      ...(principal !== undefined && { principal }),
      ...(interest !== undefined && { interest }),
      ...(frequency !== undefined && { frequency }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(dayOfMonth !== undefined && { dayOfMonth }),
      ...(notes !== undefined && { notes }),
    },
  });

  return Response.json({
    id: updated.id,
    loanName: updated.loanName,
    bankName: updated.bankName,
    totalAmount: Number(updated.totalAmount),
    installment: Number(updated.installment),
    principal: updated.principal ? Number(updated.principal) : null,
    interest: updated.interest ? Number(updated.interest) : null,
    frequency: updated.frequency,
    startDate: updated.startDate.toISOString().slice(0, 10),
    endDate: updated.endDate?.toISOString().slice(0, 10) ?? null,
    dayOfMonth: updated.dayOfMonth,
    notes: updated.notes,
  });
}

/**
 * DELETE /api/firm/clients/[id]/loans/[loanId]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; loanId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, loanId } = await params;
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });

  const existing = await prisma.loanSchedule.findFirst({
    where: { id: loanId, organizationId: id },
  });
  if (!existing) return Response.json({ error: "Prestito non trovato" }, { status: 404 });

  await prisma.loanSchedule.delete({ where: { id: loanId } });
  return Response.json({ deleted: true });
}
