import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/firm/clients/[id]/loans
 * List loan schedules for an organization.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });

  const loans = await prisma.loanSchedule.findMany({
    where: { organizationId: id },
    orderBy: { startDate: "asc" },
  });

  return Response.json({
    loans: loans.map((l) => ({
      id: l.id,
      loanName: l.loanName,
      bankName: l.bankName,
      totalAmount: Number(l.totalAmount),
      installment: Number(l.installment),
      principal: l.principal ? Number(l.principal) : null,
      interest: l.interest ? Number(l.interest) : null,
      frequency: l.frequency,
      startDate: l.startDate.toISOString().slice(0, 10),
      endDate: l.endDate?.toISOString().slice(0, 10) ?? null,
      dayOfMonth: l.dayOfMonth,
      notes: l.notes,
    })),
  });
}

/**
 * POST /api/firm/clients/[id]/loans
 * Create a new loan schedule.
 * Body: { loanName, bankName?, totalAmount, installment, principal?, interest?,
 *         frequency?, startDate, endDate?, dayOfMonth?, notes? }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });

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

  if (
    !loanName ||
    typeof totalAmount !== "number" ||
    typeof installment !== "number" ||
    !startDate
  ) {
    return Response.json(
      { error: "loanName, totalAmount, installment e startDate obbligatori" },
      { status: 400 },
    );
  }

  const created = await prisma.loanSchedule.create({
    data: {
      organizationId: id,
      loanName,
      bankName: bankName ?? null,
      totalAmount,
      installment,
      principal: principal ?? null,
      interest: interest ?? null,
      frequency: frequency ?? "MONTHLY",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      dayOfMonth: dayOfMonth ?? null,
      notes: notes ?? null,
    },
  });

  return Response.json(
    {
      id: created.id,
      loanName: created.loanName,
      bankName: created.bankName,
      totalAmount: Number(created.totalAmount),
      installment: Number(created.installment),
      frequency: created.frequency,
      startDate: created.startDate.toISOString().slice(0, 10),
      endDate: created.endDate?.toISOString().slice(0, 10) ?? null,
      dayOfMonth: created.dayOfMonth,
      notes: created.notes,
    },
    { status: 201 },
  );
}
