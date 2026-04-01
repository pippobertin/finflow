import { prisma } from "@/lib/prisma";
import type {
  ExpectedPayableCreateInput,
  ExpectedPayableUpdateInput,
} from "@/lib/validations/expected-payables";

export async function listExpectedPayables(organizationId: string) {
  return prisma.expectedPayable.findMany({
    where: { organizationId },
    include: {
      costCenter: { select: { id: true, name: true, color: true } },
    },
    orderBy: { startDate: "asc" },
  });
}

export async function getExpectedPayable(id: string, organizationId: string) {
  return prisma.expectedPayable.findFirst({
    where: { id, organizationId },
    include: {
      costCenter: { select: { id: true, name: true, color: true } },
    },
  });
}

export async function createExpectedPayable(
  organizationId: string,
  data: ExpectedPayableCreateInput,
) {
  return prisma.expectedPayable.create({
    data: {
      ...data,
      organizationId,
    },
  });
}

export async function updateExpectedPayable(
  id: string,
  organizationId: string,
  data: ExpectedPayableUpdateInput,
) {
  const existing = await prisma.expectedPayable.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  return prisma.expectedPayable.update({
    where: { id },
    data,
  });
}

export async function deleteExpectedPayable(id: string, organizationId: string) {
  const existing = await prisma.expectedPayable.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  return prisma.expectedPayable.delete({ where: { id } });
}

export async function bulkDeleteExpectedPayables(ids: string[], organizationId: string) {
  const result = await prisma.expectedPayable.deleteMany({
    where: { id: { in: ids }, organizationId },
  });
  return result.count;
}
