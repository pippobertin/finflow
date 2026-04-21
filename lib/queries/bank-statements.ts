import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface BankStatementListParams {
  organizationId: string;
  isReconciled?: boolean;
  categorized?: boolean; // true = has cdgCategory, false = null, undefined = all
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
    categorized,
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
    ...(categorized !== undefined && {
      cdgCategory: categorized ? { not: null } : null,
    }),
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

/**
 * Categorize a single bank statement: set cdgCategory + compute VAT split.
 */
export async function categorizeBankStatement(
  id: string,
  organizationId: string,
  cdgCategory: string,
  netAmount: number,
  vatAmount: number,
) {
  const statement = await prisma.bankStatement.findFirst({
    where: { id, organizationId },
  });
  if (!statement) return null;

  return prisma.bankStatement.update({
    where: { id },
    data: { cdgCategory, netAmount, vatAmount },
  });
}

/**
 * Bulk categorize bank statements with the same cdgCategory.
 * Returns the count of updated records.
 */
export async function bulkCategorizeBankStatements(
  ids: string[],
  organizationId: string,
  cdgCategory: string,
  computeSplit: (grossAmount: number) => { netAmount: number; vatAmount: number },
) {
  // Fetch all statements to compute per-row VAT split
  const statements = await prisma.bankStatement.findMany({
    where: { id: { in: ids }, organizationId },
    select: { id: true, amount: true },
  });

  if (statements.length === 0) return 0;

  // Update each with its computed split
  const updates = statements.map((s) => {
    const gross = Number(s.amount);
    const { netAmount, vatAmount } = computeSplit(gross);
    return prisma.bankStatement.update({
      where: { id: s.id },
      data: { cdgCategory, netAmount, vatAmount },
    });
  });

  await prisma.$transaction(updates);
  return statements.length;
}
