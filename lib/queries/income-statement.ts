/**
 * income-statement query — fetches TrialBalanceSnapshot data and
 * runs it through the CE riclassificato engine.
 *
 * ADR-006: Uses only TrialBalanceLine from frozen/locked snapshots.
 */

import { prisma } from "@/lib/prisma";
import {
  computeIncomeStatement,
  type IncomeStatementResult,
  type CEInputLine,
} from "@/lib/analysis/income-statement";
import { computeFinancialRatios, type FinancialRatios } from "@/lib/analysis/financial-ratios";

export interface IncomeStatementQueryResult {
  snapshotId: string;
  periodStart: string;
  periodEnd: string;
  sourceFilename: string;
  isLocked: boolean;
  incomeStatement: IncomeStatementResult;
  ratios: FinancialRatios;
}

/**
 * Fetch the most recent locked TrialBalanceSnapshot for an organization
 * and compute the CE riclassificato.
 *
 * @param organizationId - Organization ID
 * @param snapshotId - Optional specific snapshot ID (defaults to most recent locked)
 */
export async function getIncomeStatement(
  organizationId: string,
  snapshotId?: string,
): Promise<IncomeStatementQueryResult | null> {
  const snapshot = snapshotId
    ? await prisma.trialBalanceSnapshot.findFirst({
        where: { id: snapshotId, organizationId },
        include: { lines: true },
      })
    : await prisma.trialBalanceSnapshot.findFirst({
        where: { organizationId, isLocked: true },
        orderBy: { periodEnd: "desc" },
        include: { lines: true },
      });

  if (!snapshot) return null;

  // Convert Prisma lines to CEInputLine
  const ceLines: CEInputLine[] = snapshot.lines
    .filter((l) => l.cdgCategory != null)
    .map((l) => ({
      cdgCategory: l.cdgCategory!,
      balance: Number(l.balance),
      accountCode: l.accountCode,
      accountName: l.accountName,
    }));

  const incomeStatement = computeIncomeStatement(ceLines);
  const ratios = computeFinancialRatios(incomeStatement);

  return {
    snapshotId: snapshot.id,
    periodStart: snapshot.periodStart.toISOString().slice(0, 10),
    periodEnd: snapshot.periodEnd.toISOString().slice(0, 10),
    sourceFilename: snapshot.sourceFilename,
    isLocked: snapshot.isLocked,
    incomeStatement,
    ratios,
  };
}

/**
 * List available snapshots for an organization.
 */
export async function listSnapshots(organizationId: string) {
  return prisma.trialBalanceSnapshot.findMany({
    where: { organizationId },
    orderBy: { periodEnd: "desc" },
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      sourceFilename: true,
      isLocked: true,
      uploadedAt: true,
      notes: true,
      _count: { select: { lines: true } },
    },
  });
}
