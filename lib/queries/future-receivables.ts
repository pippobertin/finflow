import { prisma } from "@/lib/prisma";
import type {
  FutureReceivableCreateInput,
  FutureReceivableUpdateInput,
} from "@/lib/validations/future-receivables";

export async function listFutureReceivables(organizationId: string) {
  return prisma.futureReceivable.findMany({
    where: { organizationId },
    include: {
      costCenter: { select: { id: true, name: true, color: true } },
    },
    orderBy: { expectedInvoiceDate: "asc" },
  });
}

export async function getFutureReceivable(id: string, organizationId: string) {
  return prisma.futureReceivable.findFirst({
    where: { id, organizationId },
    include: {
      costCenter: { select: { id: true, name: true, color: true } },
    },
  });
}

export async function createFutureReceivable(
  organizationId: string,
  data: FutureReceivableCreateInput,
) {
  return prisma.futureReceivable.create({
    data: { ...data, organizationId },
  });
}

export async function updateFutureReceivable(
  id: string,
  organizationId: string,
  data: FutureReceivableUpdateInput,
) {
  const existing = await prisma.futureReceivable.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  return prisma.futureReceivable.update({
    where: { id },
    data,
  });
}

export async function deleteFutureReceivable(id: string, organizationId: string) {
  const existing = await prisma.futureReceivable.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  return prisma.futureReceivable.delete({ where: { id } });
}

export async function bulkDeleteFutureReceivables(ids: string[], organizationId: string) {
  const result = await prisma.futureReceivable.deleteMany({
    where: { id: { in: ids }, organizationId },
  });
  return result.count;
}
