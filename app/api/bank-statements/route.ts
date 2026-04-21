import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { listBankStatements } from "@/lib/queries/bank-statements";

export async function GET(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;

  const data = await listBankStatements({
    organizationId,
    isReconciled: sp.has("isReconciled") ? sp.get("isReconciled") === "true" : undefined,
    categorized: sp.has("categorized") ? sp.get("categorized") === "true" : undefined,
    search: sp.get("search") ?? undefined,
    costCenterId: sp.get("costCenterId") ?? undefined,
    startDate: sp.get("startDate") ? new Date(sp.get("startDate")!) : undefined,
    endDate: sp.get("endDate") ? new Date(sp.get("endDate")!) : undefined,
    page: sp.get("page") ? parseInt(sp.get("page")!) : 1,
    pageSize: sp.get("pageSize") ? parseInt(sp.get("pageSize")!) : 50,
  });

  return Response.json(data);
}
