/**
 * Query functions for the controller (firm) workspace.
 * All functions require accountingFirmId for multi-tenant scoping.
 *
 * Ref: docs/adr/004-scoped-query-pattern.md
 */
import { prisma } from "@/lib/prisma";
import type { CdgGranularity, CdgCategory } from "@prisma/client";
import type { ParsedTrialBalanceRow } from "@/lib/parsers/cdg-trial-balance-parser";

// ─── Read ────────────────────────────────────────────────────

export async function listFirmOrganizations(accountingFirmId: string) {
  return prisma.organization.findMany({
    where: { accountingFirmId },
    include: {
      _count: {
        select: {
          invoices: true,
          bankStatements: true,
          bankAccounts: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getFirmOrganization(id: string, accountingFirmId: string) {
  return prisma.organization.findFirst({
    where: { id, accountingFirmId },
    include: {
      bankAccounts: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getFirmStats(accountingFirmId: string) {
  const [orgCount, invoiceCount] = await Promise.all([
    prisma.organization.count({ where: { accountingFirmId } }),
    prisma.invoice.count({
      where: { organization: { accountingFirmId } },
    }),
  ]);
  return { orgCount, invoiceCount };
}

// ─── Late Balance Alert ──────────────────────────────────────

export interface LateBalanceClient {
  orgId: string;
  orgName: string;
  lastPeriodEnd: string | null;
  daysLate: number;
  severity: "amber" | "red";
  neverUploaded: boolean;
}

/**
 * Find clients whose latest locked snapshot is stale.
 * - 45 days since periodEnd → amber
 * - 75 days since periodEnd → red
 * - No snapshot + org created >30 days ago → red ("Mai caricato")
 *
 * Returns max 5 clients sorted by severity (red first, then amber).
 */
export async function getLateBalanceClients(
  accountingFirmId: string,
): Promise<LateBalanceClient[]> {
  const orgs = await prisma.organization.findMany({
    where: { accountingFirmId },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });

  if (orgs.length === 0) return [];

  const now = new Date();
  const results: LateBalanceClient[] = [];

  // Fetch latest locked snapshot for each org
  for (const org of orgs) {
    const latest = await prisma.trialBalanceSnapshot.findFirst({
      where: { organizationId: org.id, isLocked: true },
      orderBy: { periodEnd: "desc" },
      select: { periodEnd: true },
    });

    if (!latest) {
      // No snapshot at all — check if org is old enough
      const orgAgeDays = Math.floor(
        (now.getTime() - org.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (orgAgeDays > 30) {
        results.push({
          orgId: org.id,
          orgName: org.name,
          lastPeriodEnd: null,
          daysLate: orgAgeDays,
          severity: "red",
          neverUploaded: true,
        });
      }
      continue;
    }

    const daysSincePeriodEnd = Math.floor(
      (now.getTime() - latest.periodEnd.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSincePeriodEnd >= 75) {
      results.push({
        orgId: org.id,
        orgName: org.name,
        lastPeriodEnd: latest.periodEnd.toISOString().slice(0, 10),
        daysLate: daysSincePeriodEnd,
        severity: "red",
        neverUploaded: false,
      });
    } else if (daysSincePeriodEnd >= 45) {
      results.push({
        orgId: org.id,
        orgName: org.name,
        lastPeriodEnd: latest.periodEnd.toISOString().slice(0, 10),
        daysLate: daysSincePeriodEnd,
        severity: "amber",
        neverUploaded: false,
      });
    }
  }

  // Sort: red first, then amber, then by daysLate desc
  results.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "red" ? -1 : 1;
    return b.daysLate - a.daysLate;
  });

  return results.slice(0, 5);
}

// ─── Write ───────────────────────────────────────────────────

export interface CreateOrganizationInput {
  name: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  cdgGranularity?: CdgGranularity;
}

export async function createFirmOrganization(
  accountingFirmId: string,
  input: CreateOrganizationInput,
) {
  return prisma.organization.create({
    data: {
      ...input,
      accountingFirmId,
      cdgGranularity: input.cdgGranularity ?? "MONTHLY",
    },
  });
}

export interface UpdateOrganizationInput {
  name?: string;
  vatNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  zipCode?: string | null;
  cdgGranularity?: CdgGranularity;
  cashThresholdEur?: number | null;
  settings?: Record<string, unknown>;
}

export async function updateFirmOrganization(
  id: string,
  accountingFirmId: string,
  input: UpdateOrganizationInput,
) {
  // Ownership check via where clause
  return prisma.organization.updateMany({
    where: { id, accountingFirmId },
    data: input,
  });
}

// ─── Trial Balance (Bilancio di Verifica) ────────────────────

export async function listFirmSnapshots(organizationId: string, accountingFirmId: string) {
  // Ownership check: org must belong to this firm
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) return null;

  return prisma.trialBalanceSnapshot.findMany({
    where: { organizationId },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      _count: { select: { lines: true } },
    },
    orderBy: { periodEnd: "desc" },
  });
}

export async function getFirmSnapshot(
  snapshotId: string,
  organizationId: string,
  accountingFirmId: string,
) {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) return null;

  return prisma.trialBalanceSnapshot.findFirst({
    where: { id: snapshotId, organizationId },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      lines: { orderBy: { accountCode: "asc" } },
    },
  });
}

export interface CreateSnapshotInput {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  uploadedById: string;
  sourceFilename: string;
  notes?: string;
  rows: ParsedTrialBalanceRow[];
}

export async function createFirmSnapshot(accountingFirmId: string, input: CreateSnapshotInput) {
  const org = await prisma.organization.findFirst({
    where: { id: input.organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) return null;

  return prisma.trialBalanceSnapshot.create({
    data: {
      organizationId: input.organizationId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      uploadedById: input.uploadedById,
      sourceFilename: input.sourceFilename,
      notes: input.notes,
      lines: {
        create: input.rows.map((r) => ({
          accountCode: r.accountCode,
          accountName: r.accountName,
          debit: r.debit,
          credit: r.credit,
          balance: r.balance,
        })),
      },
    },
    include: {
      _count: { select: { lines: true } },
    },
  });
}

export async function deleteFirmSnapshot(
  snapshotId: string,
  organizationId: string,
  accountingFirmId: string,
) {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) return null;

  // Can't delete locked snapshots
  const snapshot = await prisma.trialBalanceSnapshot.findFirst({
    where: { id: snapshotId, organizationId },
    select: { isLocked: true },
  });
  if (!snapshot) return null;
  if (snapshot.isLocked) return { locked: true as const };

  await prisma.trialBalanceSnapshot.delete({ where: { id: snapshotId } });
  return { deleted: true as const };
}

// ─── Mapping Piano dei Conti ─────────────────────────────────

export async function listFirmMappings(organizationId: string, accountingFirmId: string) {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) return null;

  return prisma.chartOfAccountsMapping.findMany({
    where: { organizationId },
    orderBy: { accountCode: "asc" },
  });
}

export interface UpsertMappingInput {
  accountCode: string;
  accountName: string;
  cdgCategory: CdgCategory;
  isVatable?: boolean;
  vatRate?: number | null;
}

export async function upsertFirmMappings(
  organizationId: string,
  accountingFirmId: string,
  mappings: UpsertMappingInput[],
) {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) return null;

  // Upsert each mapping in a transaction
  return prisma.$transaction(
    mappings.map((m) =>
      prisma.chartOfAccountsMapping.upsert({
        where: {
          organizationId_accountCode: { organizationId, accountCode: m.accountCode },
        },
        create: {
          organizationId,
          accountCode: m.accountCode,
          accountName: m.accountName,
          cdgCategory: m.cdgCategory,
          isVatable: m.isVatable ?? false,
          vatRate: m.vatRate ?? null,
        },
        update: {
          accountName: m.accountName,
          cdgCategory: m.cdgCategory,
          isVatable: m.isVatable ?? false,
          vatRate: m.vatRate ?? null,
        },
      }),
    ),
  );
}
