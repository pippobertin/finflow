/**
 * Query functions for budget CRUD.
 * Follows the scoped-query pattern from lib/queries/firm.ts (ADR-004).
 */
import { prisma } from "@/lib/prisma";
import type { CdgCategory } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────────

export interface BudgetRow {
  id: string;
  cdgCategory: string;
  month: number;
  amount: number;
  notes: string | null;
}

export interface UpsertBudgetInput {
  cdgCategory: CdgCategory;
  month: number;
  amount: number;
  notes?: string;
}

// ─── Read ───────────────────────────────────────────────────

export async function getBudget(organizationId: string, year: number): Promise<BudgetRow[]> {
  const rows = await prisma.monthlyBudget.findMany({
    where: { organizationId, year },
    orderBy: [{ cdgCategory: "asc" }, { month: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    cdgCategory: r.cdgCategory,
    month: r.month,
    amount: Number(r.amount),
    notes: r.notes,
  }));
}

/** Firm-scoped: verify org ownership before reading */
export async function getFirmBudget(
  organizationId: string,
  accountingFirmId: string,
  year: number,
): Promise<BudgetRow[] | null> {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) return null;

  return getBudget(organizationId, year);
}

// ─── Write ──────────────────────────────────────────────────

export async function upsertBudget(
  organizationId: string,
  year: number,
  rows: UpsertBudgetInput[],
): Promise<number> {
  const ops = rows.map((r) =>
    prisma.monthlyBudget.upsert({
      where: {
        organizationId_year_month_cdgCategory: {
          organizationId,
          year,
          month: r.month,
          cdgCategory: r.cdgCategory,
        },
      },
      create: {
        organizationId,
        year,
        month: r.month,
        cdgCategory: r.cdgCategory,
        amount: r.amount,
        notes: r.notes ?? null,
      },
      update: {
        amount: r.amount,
        notes: r.notes ?? undefined,
      },
    }),
  );

  const results = await prisma.$transaction(ops);
  return results.length;
}

/** Firm-scoped: verify org ownership before upserting */
export async function upsertFirmBudget(
  organizationId: string,
  accountingFirmId: string,
  year: number,
  rows: UpsertBudgetInput[],
): Promise<number | null> {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) return null;

  return upsertBudget(organizationId, year, rows);
}

export async function updateBudgetRecord(
  id: string,
  organizationId: string,
  data: { amount?: number; notes?: string | null },
): Promise<BudgetRow | null> {
  const existing = await prisma.monthlyBudget.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  const updated = await prisma.monthlyBudget.update({
    where: { id },
    data: {
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  return {
    id: updated.id,
    cdgCategory: updated.cdgCategory,
    month: updated.month,
    amount: Number(updated.amount),
    notes: updated.notes,
  };
}

export async function deleteBudgetYear(organizationId: string, year: number): Promise<number> {
  const result = await prisma.monthlyBudget.deleteMany({
    where: { organizationId, year },
  });
  return result.count;
}

/** Firm-scoped delete with ownership check */
export async function deleteFirmBudgetYear(
  organizationId: string,
  accountingFirmId: string,
  year: number,
): Promise<number | null> {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) return null;

  return deleteBudgetYear(organizationId, year);
}

/** List years that have budget data for an org */
export async function getBudgetYears(organizationId: string): Promise<number[]> {
  const results = await prisma.monthlyBudget.findMany({
    where: { organizationId },
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });
  return results.map((r) => r.year);
}
