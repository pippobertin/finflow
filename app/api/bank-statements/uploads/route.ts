import { getAuthSession } from "@/lib/helpers/auth-guard";
import { listBankStatementUploads } from "@/lib/queries/bank-statements";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const uploads = await listBankStatementUploads(organizationId);
  return Response.json(uploads);
}
