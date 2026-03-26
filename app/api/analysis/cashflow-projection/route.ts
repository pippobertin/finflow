import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { buildFullTimeline } from "@/lib/queries/cashflow-projection";

export async function GET(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const costCenterIdsParam = request.nextUrl.searchParams.get("costCenterIds");
  const costCenterIds = costCenterIdsParam
    ? costCenterIdsParam.split(",").filter(Boolean)
    : undefined;

  try {
    const result = await buildFullTimeline(organizationId, costCenterIds);
    return Response.json(result);
  } catch (err) {
    console.error("[cashflow-projection] Error:", err);
    return Response.json(
      { error: "Errore nel calcolo della proiezione cashflow" },
      { status: 500 },
    );
  }
}
