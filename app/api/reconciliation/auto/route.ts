import { getAuthSession } from "@/lib/helpers/auth-guard";
import { FEATURES } from "@/lib/feature-flags";
import { findMatches, confirmMatches } from "@/lib/reconciliation/reconciliation-engine";
import { prisma } from "@/lib/prisma";

export async function POST() {
  if (!FEATURES.LEGACY_RECONCILIATION) return new Response(null, { status: 404 });

  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  // Count total unreconciled
  const totalUnreconciled = await prisma.bankStatement.count({
    where: { organizationId, isReconciled: false },
  });

  // Find matches
  const matches = await findMatches(organizationId);

  // Auto-confirm all matches (onboarding context)
  if (matches.length > 0) {
    await confirmMatches(
      organizationId,
      matches.map((m) => ({
        bankStatementId: m.bankStatementId,
        invoiceId: m.invoiceId,
        accepted: true,
      })),
    );
  }

  return Response.json({
    total: totalUnreconciled,
    reconciled: matches.length,
    pending: totalUnreconciled - matches.length,
  });
}
