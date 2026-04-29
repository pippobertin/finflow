import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/firm/clients/[id]/movimenti
 *
 * List bank statements for a client organization.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id: organizationId } = await params;

  // Ownership check
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? undefined;
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(10, parseInt(url.searchParams.get("pageSize") ?? "50", 10)),
  );

  const where: Record<string, unknown> = { organizationId };

  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { reference: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.bankStatement.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { costCenter: { select: { id: true, name: true, color: true } } },
    }),
    prisma.bankStatement.count({ where }),
  ]);

  return Response.json({
    data: data.map((s) => ({
      id: s.id,
      date: s.date,
      description: s.description,
      amount: Number(s.amount),
      balance: Number(s.balance),
      cdgCategory: s.cdgCategory,
      costCenter: s.costCenter,
      reference: s.reference,
      sourceFile: s.sourceFile,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
