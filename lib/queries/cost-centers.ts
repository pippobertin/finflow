import { prisma } from "@/lib/prisma";
import type { CostCenterType } from "@prisma/client";
import type { CostCenterCreateInput, CostCenterUpdateInput } from "@/lib/validations/cost-center";

export async function listCostCenters(organizationId: string, type?: CostCenterType) {
  return prisma.costCenter.findMany({
    where: { organizationId, ...(type && { type }) },
    include: {
      _count: {
        select: {
          invoices: true,
          recurringExpenses: true,
          oneOffExpenses: true,
          bankStatements: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCostCenterById(id: string, organizationId: string) {
  return prisma.costCenter.findFirst({
    where: { id, organizationId },
    include: {
      _count: {
        select: {
          invoices: true,
          recurringExpenses: true,
          oneOffExpenses: true,
          bankStatements: true,
        },
      },
    },
  });
}

export async function createCostCenter(organizationId: string, data: CostCenterCreateInput) {
  return prisma.costCenter.create({
    data: { ...data, organizationId },
  });
}

export async function updateCostCenter(
  id: string,
  organizationId: string,
  data: CostCenterUpdateInput,
) {
  // Verify ownership before update
  const existing = await prisma.costCenter.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  return prisma.costCenter.update({
    where: { id },
    data,
  });
}

export async function deleteCostCenter(id: string, organizationId: string) {
  // Verify ownership before delete
  const cc = await prisma.costCenter.findFirst({
    where: { id, organizationId },
  });
  if (!cc) return null;

  return prisma.costCenter.delete({ where: { id } });
}
