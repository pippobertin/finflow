import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { getOverviewData } from "@/lib/queries/overview";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { error, session, organizationId } = await getAuthSession();
  if (error) return error;
  if (session.user.userType === "CLIENT_ADMIN_BANK_ONLY") {
    return Response.json({ error: "Accesso riservato al titolare" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;

  const costCenterIdsParam = sp.get("costCenterIds");
  const costCenterIds = costCenterIdsParam
    ? costCenterIdsParam.split(",").filter(Boolean)
    : undefined;

  const dateFrom = sp.get("dateFrom") ? new Date(sp.get("dateFrom")!) : undefined;
  const dateTo = sp.get("dateTo") ? new Date(sp.get("dateTo")!) : undefined;

  const data = await getOverviewData(organizationId, costCenterIds, dateFrom, dateTo);
  return Response.json(data);
}
