import { getAuthSession } from "@/lib/helpers/auth-guard";
import { FEATURES } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!FEATURES.LEGACY_RECONCILIATION) return new Response(null, { status: 404 });

  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const count = await prisma.bankStatement.count({
    where: { organizationId, isReconciled: false },
  });

  return Response.json({ count });
}
