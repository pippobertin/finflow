import { getAuthSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { listPdfBankProfiles } from "@/lib/queries/pdf-bank-profiles";

/**
 * GET /api/client/bank-profiles
 *
 * List available PDF bank profiles for the client's organization.
 * Returns firm-specific profiles + system defaults (deduped by bankName).
 */
export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  // Find the accountingFirmId for this organization
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { accountingFirmId: true },
  });

  if (!org?.accountingFirmId) {
    // No accounting firm — return only system defaults
    const defaults = await prisma.pdfBankProfile.findMany({
      where: { accountingFirmId: null },
      orderBy: { bankName: "asc" },
    });
    return Response.json({
      profiles: defaults.map((p) => ({
        bankName: p.bankName,
        isSystemDefault: true,
      })),
    });
  }

  const profiles = await listPdfBankProfiles(org.accountingFirmId);

  return Response.json({
    profiles: profiles.map((p) => ({
      bankName: p.bankName,
      isSystemDefault: p.accountingFirmId === null,
    })),
  });
}
