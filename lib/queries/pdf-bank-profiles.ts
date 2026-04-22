/**
 * Query functions for PdfBankProfile management.
 *
 * Profiles have nullable accountingFirmId:
 * - NULL = system-default (read-only, shared across all firms)
 * - set  = firm-specific override
 *
 * When resolving a profile by bankName, firm-specific takes priority.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface PdfBankProfileInput {
  bankName: string;
  layoutPatterns: Record<string, unknown>;
  notes?: string | null;
}

/**
 * List profiles visible to a firm: firm-specific + system defaults.
 * Firm-specific profiles override system defaults with the same bankName.
 */
export async function listPdfBankProfiles(accountingFirmId: string) {
  const profiles = await prisma.pdfBankProfile.findMany({
    where: {
      OR: [{ accountingFirmId }, { accountingFirmId: null }],
    },
    orderBy: [{ bankName: "asc" }],
  });

  // Deduplicate: firm-specific overrides system default
  const byName = new Map<string, (typeof profiles)[number]>();
  // First add system defaults
  for (const p of profiles) {
    if (p.accountingFirmId === null) {
      byName.set(p.bankName, p);
    }
  }
  // Then override with firm-specific
  for (const p of profiles) {
    if (p.accountingFirmId !== null) {
      byName.set(p.bankName, p);
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.bankName.localeCompare(b.bankName, "it"));
}

/**
 * Get a specific profile by bankName, preferring firm-specific.
 */
export async function getPdfBankProfileByName(accountingFirmId: string, bankName: string) {
  // Try firm-specific first
  const firmProfile = await prisma.pdfBankProfile.findUnique({
    where: {
      accountingFirmId_bankName: {
        accountingFirmId,
        bankName,
      },
    },
  });
  if (firmProfile) return firmProfile;

  // Fall back to system default
  return prisma.pdfBankProfile.findFirst({
    where: {
      accountingFirmId: null,
      bankName,
    },
  });
}

/**
 * Create a new firm-specific profile.
 */
export async function createPdfBankProfile(accountingFirmId: string, input: PdfBankProfileInput) {
  return prisma.pdfBankProfile.create({
    data: {
      accountingFirmId,
      bankName: input.bankName,
      layoutPatterns: input.layoutPatterns as Prisma.InputJsonValue,
      notes: input.notes ?? null,
    },
  });
}

/**
 * Update a firm-specific profile. Cannot update system defaults.
 */
export async function updatePdfBankProfile(
  id: string,
  accountingFirmId: string,
  input: Partial<PdfBankProfileInput>,
) {
  return prisma.pdfBankProfile.updateMany({
    where: { id, accountingFirmId },
    data: {
      ...(input.bankName !== undefined ? { bankName: input.bankName } : {}),
      ...(input.layoutPatterns !== undefined
        ? { layoutPatterns: input.layoutPatterns as Prisma.InputJsonValue }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}

/**
 * Delete a firm-specific profile. Cannot delete system defaults.
 */
export async function deletePdfBankProfile(id: string, accountingFirmId: string) {
  return prisma.pdfBankProfile.deleteMany({
    where: { id, accountingFirmId },
  });
}

/**
 * List just the bank names available for a firm (for dropdowns).
 */
export async function listAvailableBankNames(accountingFirmId: string) {
  const profiles = await listPdfBankProfiles(accountingFirmId);
  return profiles.map((p) => ({
    bankName: p.bankName,
    isSystemDefault: p.accountingFirmId === null,
  }));
}
