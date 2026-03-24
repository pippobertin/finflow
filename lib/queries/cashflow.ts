import { prisma } from "@/lib/prisma";

export async function getCashflowSnapshots(
  organizationId: string,
  startDate?: Date,
  endDate?: Date,
) {
  return prisma.cashflowSnapshot.findMany({
    where: {
      organizationId,
      ...((startDate || endDate) && {
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    },
    orderBy: { date: "asc" },
  });
}

export async function getBankStatements(
  organizationId: string,
  options?: {
    costCenterIds?: string[];
    startDate?: Date;
    endDate?: Date;
  },
) {
  return prisma.bankStatement.findMany({
    where: {
      organizationId,
      ...(options?.costCenterIds?.length && {
        costCenterId: { in: options.costCenterIds },
      }),
      ...((options?.startDate || options?.endDate) && {
        date: {
          ...(options.startDate && { gte: options.startDate }),
          ...(options.endDate && { lte: options.endDate }),
        },
      }),
    },
    include: {
      costCenter: { select: { id: true, name: true, color: true } },
    },
    orderBy: { date: "desc" },
  });
}
