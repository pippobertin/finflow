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
    prisma.bankStatement
      .findMany({
        where,
        include: {
          costCenter: { select: { id: true, name: true, color: true } },
          reconciledInvoice: { select: { id: true, number: true, counterpart: true } },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      })
      .then(async (rows) => {
        // Resolve all reconciledInvoiceIds to full invoice data for multi-match display
        try {
          const multiIds = rows
            .filter((r) => r.reconciledInvoiceIds && r.reconciledInvoiceIds.length > 1)
            .flatMap((r) => r.reconciledInvoiceIds);
          if (multiIds.length === 0) return rows;

          const invoices = await prisma.invoice.findMany({
            where: { id: { in: multiIds } },
            select: { id: true, number: true, counterpart: true },
          });
          const invoiceMap = new Map(invoices.map((i) => [i.id, i]));

          return rows.map((r) => {
            if (!r.reconciledInvoiceIds || r.reconciledInvoiceIds.length <= 1) return r;
            return {
              ...r,
              reconciledInvoices: r.reconciledInvoiceIds
                .map((id) => invoiceMap.get(id))
                .filter(Boolean),
            };
          });
        } catch {
          // reconciledInvoiceIds column may not exist — return rows as-is
          return rows;
        }
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

export interface BankStatementUpload {
  sourceFile: string | null;
  count: number;
  periodFrom: string;
  periodTo: string;
  importedAt: string;
}

export async function listBankStatementUploads(
  organizationId: string,
): Promise<BankStatementUpload[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      source_file: string | null;
      count: bigint;
      period_from: Date;
      period_to: Date;
      imported_at: Date;
    }>
  >`
    SELECT
      source_file,
      COUNT(*)::bigint AS count,
      MIN(date) AS period_from,
      MAX(date) AS period_to,
      MIN(created_at) AS imported_at
    FROM public.fin_bank_statement
    WHERE organization_id = ${organizationId}
    GROUP BY source_file
    ORDER BY imported_at DESC
  `;

  return rows.map((r) => ({
    sourceFile: r.source_file,
    count: Number(r.count),
    periodFrom: r.period_from.toISOString(),
    periodTo: r.period_to.toISOString(),
    importedAt: r.imported_at.toISOString(),
  }));
}

export async function deleteBankStatementsBySource(
  organizationId: string,
  sourceFile: string | null,
) {
  const where: Prisma.BankStatementWhereInput = {
    organizationId,
    sourceFile: sourceFile === null ? null : sourceFile,
  };

  const result = await prisma.bankStatement.deleteMany({ where });
  return result.count;
}

export async function bulkDeleteBankStatements(ids: string[], organizationId: string) {
  const result = await prisma.bankStatement.deleteMany({
    where: { id: { in: ids }, organizationId },
  });
  return result.count;
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
