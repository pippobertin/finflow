/**
 * Query functions for the controller (firm) workspace.
 * All functions require accountingFirmId for multi-tenant scoping.
 *
 * Ref: docs/adr/004-scoped-query-pattern.md
 */
import { prisma } from "@/lib/prisma";
import type { CdgGranularity } from "@prisma/client";

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
