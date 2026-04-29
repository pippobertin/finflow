import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/firm/clients/[id]/f24
 * List F24 schedules for an organization, optionally filtered by year.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });

  const yearParam = request.nextUrl.searchParams.get("year");
  const where: Record<string, unknown> = { organizationId: id };

  if (yearParam) {
    const year = parseInt(yearParam, 10);
    where.dueDate = {
      gte: new Date(`${year}-01-01`),
      lte: new Date(`${year}-12-31`),
    };
  }

  const schedules = await prisma.f24Schedule.findMany({
    where,
    orderBy: { dueDate: "asc" },
  });

  return Response.json({
    schedules: schedules.map((s) => ({
      id: s.id,
      periodLabel: s.periodLabel,
      codiceTributo: s.codiceTributo,
      amount: Number(s.amount),
      dueDate: s.dueDate.toISOString().slice(0, 10),
      isPaid: s.isPaid,
      paidDate: s.paidDate?.toISOString().slice(0, 10) ?? null,
      notes: s.notes,
    })),
  });
}

/**
 * POST /api/firm/clients/[id]/f24
 * Create a new F24 schedule entry.
 * Body: { periodLabel, codiceTributo?, amount, dueDate, notes? }
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
  const { periodLabel, codiceTributo, amount, dueDate, notes } = body;

  if (!periodLabel || typeof amount !== "number" || !dueDate) {
    return Response.json({ error: "periodLabel, amount e dueDate obbligatori" }, { status: 400 });
  }

  const created = await prisma.f24Schedule.create({
    data: {
      organizationId: id,
      periodLabel,
      codiceTributo: codiceTributo ?? null,
      amount,
      dueDate: new Date(dueDate),
      notes: notes ?? null,
    },
  });

  return Response.json(
    {
      id: created.id,
      periodLabel: created.periodLabel,
      codiceTributo: created.codiceTributo,
      amount: Number(created.amount),
      dueDate: created.dueDate.toISOString().slice(0, 10),
      isPaid: created.isPaid,
      notes: created.notes,
    },
    { status: 201 },
  );
}
