import { getAuthSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const count = await prisma.bankStatement.count({
    where: { organizationId, isReconciled: false },
  });

  return Response.json({ count });
}
