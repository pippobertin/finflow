import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { detectAnomalies } from "@/lib/analysis/forecasting-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { error, session, organizationId } = await getAuthSession();
  if (error) return error;
  if (session.user.userType === "CLIENT_ADMIN_BANK_ONLY") {
    return Response.json({ error: "Accesso riservato al titolare" }, { status: 403 });
  }

  const costCenterIdsParam = request.nextUrl.searchParams.get("costCenterIds");
  const costCenterIds = costCenterIdsParam
    ? costCenterIdsParam.split(",").filter(Boolean)
    : undefined;

  const data = await detectAnomalies({ organizationId, costCenterIds });
  return Response.json(data);
}
