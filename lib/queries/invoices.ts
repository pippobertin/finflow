import { prisma } from "@/lib/prisma";
import type { InvoiceDirection, InvoiceStatus, Prisma } from "@prisma/client";

export interface InvoiceListParams {
  organizationId: string;
  direction?: InvoiceDirection;
  status?: InvoiceStatus;
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
    ...((startDate || endDate) && {
      date: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
    ...(search && {
      OR: [
        { number: { contains: search, mode: "insensitive" as const } },
        { notes: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [data, total, agg, pendingReceivableAgg, forecastReceivableAgg] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where,
      _sum: { grossAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { organizationId, direction: "ACTIVE", status: "PENDING", date: { lte: today } },
      _sum: { grossAmount: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { organizationId, direction: "ACTIVE", status: "PENDING", date: { gt: today } },
      _sum: { grossAmount: true },
      _count: true,
    }),
  ]);

  return {
    data,
    total,
    totalGrossAmount: Number(agg._sum.grossAmount ?? 0),
    pendingReceivable: {
      total: Number(pendingReceivableAgg._sum.grossAmount ?? 0),
      count: pendingReceivableAgg._count,
    },
    forecastReceivable: {
      total: Number(forecastReceivableAgg._sum.grossAmount ?? 0),
      count: forecastReceivableAgg._count,
    },
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateInvoice(
  invoiceId: string,
  organizationId: string,
  updates: {
    status?: InvoiceStatus;
    paidAt?: Date | null;
    notes?: string | null;
    bankAccountId?: string | null;
  },
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
  });
  if (!invoice) return null;

  const data: Prisma.InvoiceUncheckedUpdateInput = {};

  if (updates.status !== undefined) {
    data.status = updates.status;
    if (updates.status === "PAID") {
      data.paidAt = updates.paidAt ?? new Date();
    } else {
      data.paidAt = null;
    }
  }

  if (updates.notes !== undefined) {
    data.notes = updates.notes;
  }

  if (updates.bankAccountId !== undefined) {
    data.bankAccountId = updates.bankAccountId;
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data,
  });
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

  return prisma.invoice.delete({ where: { id: invoiceId } });
}

export async function bulkDeleteInvoices(invoiceIds: string[], organizationId: string) {
  const result = await prisma.invoice.deleteMany({
    where: { id: { in: invoiceIds }, organizationId },
  });
  return result.count;
}
