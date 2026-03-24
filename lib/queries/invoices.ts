import { prisma } from "@/lib/prisma";
import type { InvoiceDirection, InvoiceStatus, Prisma } from "@prisma/client";

export interface InvoiceListParams {
  organizationId: string;
  direction?: InvoiceDirection;
  status?: InvoiceStatus;
  costCenterId?: string;
  needsTagging?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export async function listInvoices(params: InvoiceListParams) {
  const {
    organizationId,
    direction,
    status,
    costCenterId,
    needsTagging,
    search,
    startDate,
    endDate,
    page = 1,
    pageSize = 20,
  } = params;

  const where: Prisma.InvoiceWhereInput = {
    organizationId,
    ...(direction && { direction }),
    ...(status && { status }),
    ...(costCenterId && { costCenterId }),
    ...(needsTagging !== undefined && { needsTagging }),
    ...((startDate || endDate) && {
      date: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
    ...(search && {
      OR: [
        { counterpart: { contains: search, mode: "insensitive" as const } },
        { number: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        costCenter: { select: { id: true, name: true, color: true, type: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateInvoice(
  invoiceId: string,
  organizationId: string,
  updates: { costCenterId?: string | null; status?: InvoiceStatus },
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
  });
  if (!invoice) return null;

  const data: Prisma.InvoiceUncheckedUpdateInput = {};

  if (updates.costCenterId !== undefined) {
    data.costCenterId = updates.costCenterId;
    data.needsTagging = updates.costCenterId === null;
  }

  if (updates.status !== undefined) {
    data.status = updates.status;
    data.paidAt = updates.status === "PAID" ? new Date() : null;
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data,
  });
}

/** @deprecated Use updateInvoice */
export async function reassignCostCenter(
  invoiceId: string,
  organizationId: string,
  costCenterId: string | null,
) {
  return updateInvoice(invoiceId, organizationId, { costCenterId });
}

export async function bulkUpdateInvoiceStatus(
  invoiceIds: string[],
  organizationId: string,
  status: InvoiceStatus,
) {
  const result = await prisma.invoice.updateMany({
    where: {
      id: { in: invoiceIds },
      organizationId,
    },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
    },
  });

  return result.count;
}

export async function countNeedsTagging(organizationId: string) {
  return prisma.invoice.count({
    where: { organizationId, needsTagging: true },
  });
}
