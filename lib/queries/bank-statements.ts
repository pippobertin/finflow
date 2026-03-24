import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface BankStatementListParams {
  organizationId: string;
  isReconciled?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  costCenterId?: string;
  page?: number;
  pageSize?: number;
}

export async function listBankStatements(params: BankStatementListParams) {
  const {
    organizationId,
    isReconciled,
    search,
    startDate,
    endDate,
    costCenterId,
    page = 1,
    pageSize = 50,
  } = params;

  const where: Prisma.BankStatementWhereInput = {
    organizationId,
    ...(isReconciled !== undefined && { isReconciled }),
    ...(costCenterId && { costCenterId }),
    ...((startDate || endDate) && {
      date: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
    ...(search && {
      OR: [
        { description: { contains: search, mode: "insensitive" as const } },
        { reference: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.bankStatement.findMany({
      where,
      include: {
        costCenter: { select: { id: true, name: true, color: true } },
        reconciledInvoice: { select: { id: true, number: true, counterpart: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bankStatement.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function reassignBankStatementCostCenter(
  id: string,
  organizationId: string,
  costCenterId: string | null,
) {
  const statement = await prisma.bankStatement.findFirst({
    where: { id, organizationId },
  });
  if (!statement) return null;

  return prisma.bankStatement.update({
    where: { id },
    data: { costCenterId },
  });
}
