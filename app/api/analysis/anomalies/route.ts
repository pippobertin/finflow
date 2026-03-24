import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { detectAnomalies } from "@/lib/analysis/forecasting-engine";

export async function GET(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const costCenterIdsParam = request.nextUrl.searchParams.get("costCenterIds");
  const costCenterIds = costCenterIdsParam
    ? costCenterIdsParam.split(",").filter(Boolean)
    : undefined;

  const data = await detectAnomalies({ organizationId, costCenterIds });
  return Response.json(data);
}
