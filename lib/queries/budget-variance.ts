/**
 * Query layer for budget variance + preconsuntivo.
 * Fetches budget + latest locked snapshot, then delegates to pure analysis functions.
 */

import { prisma } from "@/lib/prisma";
import type { CEInputLine } from "@/lib/analysis/income-statement";
import {
  computeBudgetVariance,
  computePreconsuntivo,
  type BudgetLine,
  type VarianceResult,
  type PreconsuntivoResult,
} from "@/lib/analysis/budget-variance";

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Fetch CE lines from the most recent locked snapshot for a year range.
 * A snapshot "covers" a year if its periodEnd falls within that year.
 */
async function getActualCELines(
  organizationId: string,
  year: number,
  options?: { trustedOnly?: boolean },
): Promise<{ lines: CEInputLine[]; periodEnd: Date } | null> {
  const snapshot = await prisma.trialBalanceSnapshot.findFirst({
    where: {
      organizationId,
      isLocked: true,
      ...(options?.trustedOnly && { isTrusted: true }),
      periodEnd: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    orderBy: { periodEnd: "desc" },
    include: { lines: true },
  });

  if (!snapshot) return null;

  const lines: CEInputLine[] = snapshot.lines
    .filter((l) => l.cdgCategory != null)
    .map((l) => ({
      cdgCategory: l.cdgCategory!,
      balance: Number(l.balance),
    }));

  return { lines, periodEnd: snapshot.periodEnd };
}

/**
 * Fetch budget lines for a year.
 */
async function getBudgetLines(organizationId: string, year: number): Promise<BudgetLine[]> {
  const rows = await prisma.monthlyBudget.findMany({
    where: { organizationId, year },
  });
  return rows.map((r) => ({
    cdgCategory: r.cdgCategory,
    month: r.month,
    amount: Number(r.amount),
  }));
}

// ─── Public queries ─────────────────────────────────────────────

export interface VarianceQueryResult extends VarianceResult {
  year: number;
  snapshotPeriodEnd: string;
}

/**
 * Compute budget vs actual variance for a given year + upToMonth.
 * If upToMonth is not provided, it's derived from the latest snapshot's periodEnd.
 */
export async function getVariance(
  organizationId: string,
  year: number,
  upToMonth?: number,
  options?: { trustedOnly?: boolean },
): Promise<VarianceQueryResult | null> {
  const [actualData, budgetLines] = await Promise.all([
    getActualCELines(organizationId, year, options),
    getBudgetLines(organizationId, year),
  ]);

  if (!actualData || budgetLines.length === 0) return null;

  const month = upToMonth ?? actualData.periodEnd.getMonth() + 1;
  const variance = computeBudgetVariance(budgetLines, actualData.lines, month);

  return {
    ...variance,
    year,
    snapshotPeriodEnd: actualData.periodEnd.toISOString().slice(0, 10),
  };
}

export interface PreconsuntivoQueryResult extends PreconsuntivoResult {
  year: number;
  snapshotPeriodEnd: string;
}

/**
 * Compute preconsuntivo (full-year projection) for a year.
 * Boundary month is derived from the latest locked snapshot's periodEnd.
 */
export async function getPreconsuntivo(
  organizationId: string,
  year: number,
  options?: { trustedOnly?: boolean },
): Promise<PreconsuntivoQueryResult | null> {
  const [actualData, budgetLines] = await Promise.all([
    getActualCELines(organizationId, year, options),
    getBudgetLines(organizationId, year),
  ]);

  if (!actualData || budgetLines.length === 0) return null;

  const boundaryMonth = actualData.periodEnd.getMonth() + 1;
  const result = computePreconsuntivo(budgetLines, actualData.lines, boundaryMonth);

  return {
    ...result,
    year,
    snapshotPeriodEnd: actualData.periodEnd.toISOString().slice(0, 10),
  };
}

// ─── Firm-scoped wrappers ───────────────────────────────────────

export async function getFirmVariance(
  organizationId: string,
  accountingFirmId: string,
  year: number,
  upToMonth?: number,
): Promise<VarianceQueryResult | null> {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) return null;
  return getVariance(organizationId, year, upToMonth);
}

export async function getFirmPreconsuntivo(
  organizationId: string,
  accountingFirmId: string,
  year: number,
): Promise<PreconsuntivoQueryResult | null> {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) return null;
  return getPreconsuntivo(organizationId, year);
}
