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

  const [data, total, agg] = await Promise.all([
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
    prisma.invoice.aggregate({
      where,
      _sum: { grossAmount: true },
    }),
  ]);

  return {
    data,
    total,
    totalGrossAmount: Number(agg._sum.grossAmount ?? 0),
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateInvoice(
  invoiceId: string,
  organizationId: string,
  updates: {
    costCenterId?: string | null;
    status?: InvoiceStatus;
    paidAt?: Date | null;
    expectedCollectionDate?: Date | null;
    counterpartCustomDso?: number | null;
    isDiscountedAtBank?: boolean;
    bankDiscountType?: string | null;
    bankLiquidationDate?: Date | null;
    bankDiscountFee?: number | null;
  },
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
    if (updates.status === "PAID") {
      data.paidAt = updates.paidAt ?? new Date();
    } else {
      data.paidAt = null;
    }
  }

  // DSO override fields
  if (updates.expectedCollectionDate !== undefined) {
    data.expectedCollectionDate = updates.expectedCollectionDate;
  }
  if (updates.counterpartCustomDso !== undefined) {
    data.counterpartCustomDso = updates.counterpartCustomDso;
  }

  // Bank operations fields
  if (updates.isDiscountedAtBank !== undefined) {
    data.isDiscountedAtBank = updates.isDiscountedAtBank;
  }
  if (updates.bankDiscountType !== undefined) {
    data.bankDiscountType = updates.bankDiscountType;
  }
  if (updates.bankLiquidationDate !== undefined) {
    data.bankLiquidationDate = updates.bankLiquidationDate;
  }
  if (updates.bankDiscountFee !== undefined) {
    data.bankDiscountFee = updates.bankDiscountFee;
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
  paidAtMap?: Record<string, Date>,
) {
  // When status=PAID with per-invoice dates, do individual updates
  if (status === "PAID" && paidAtMap && Object.keys(paidAtMap).length > 0) {
    const updates = invoiceIds.map((id) =>
      prisma.invoice.updateMany({
        where: { id, organizationId },
        data: { status, paidAt: paidAtMap[id] ?? new Date() },
      }),
    );
    const results = await Promise.all(updates);
    return results.reduce((sum, r) => sum + r.count, 0);
  }

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

export async function deleteInvoice(invoiceId: string, organizationId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
  });
  if (!invoice) return null;

  // Clear reconciliation references from bank statements
  await prisma.bankStatement.updateMany({
    where: { reconciledInvoiceId: invoiceId },
    data: { reconciledInvoiceId: null, isReconciled: false, reconciledAt: null },
  });

  // InvoiceLines cascade-delete automatically
  return prisma.invoice.delete({ where: { id: invoiceId } });
}

export async function bulkDeleteInvoices(invoiceIds: string[], organizationId: string) {
  // Clear reconciliation references
  await prisma.bankStatement.updateMany({
    where: { reconciledInvoiceId: { in: invoiceIds } },
    data: { reconciledInvoiceId: null, isReconciled: false, reconciledAt: null },
  });

  const result = await prisma.invoice.deleteMany({
    where: { id: { in: invoiceIds }, organizationId },
  });
  return result.count;
}

export async function countNeedsTagging(organizationId: string) {
  return prisma.invoice.count({
    where: { organizationId, needsTagging: true },
  });
}
