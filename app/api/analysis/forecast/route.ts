import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { forecast } from "@/lib/analysis/forecasting-engine";

export async function GET(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;
  const months = parseInt(sp.get("months") ?? "3");
  const validMonths = [3, 6, 12].includes(months) ? (months as 3 | 6 | 12) : 3;

  const costCenterIdsParam = sp.get("costCenterIds");
  const costCenterIds = costCenterIdsParam
    ? costCenterIdsParam.split(",").filter(Boolean)
    : undefined;

  const data = await forecast({ organizationId, costCenterIds }, { months: validMonths });
  return Response.json(data);
}
