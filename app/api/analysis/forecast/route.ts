import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { forecast } from "@/lib/analysis/forecasting-engine";

export async function GET(request: NextRequest) {
  const { error, session, organizationId } = await getAuthSession();
  if (error) return error;
  if (session.user.userType === "CLIENT_ADMIN_BANK_ONLY") {
    return Response.json({ error: "Accesso riservato al titolare" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const months = parseInt(sp.get("months") ?? "3");
  const validMonths = [3, 6, 12].includes(months) ? (months as 3 | 6 | 12) : 3;

  const costCenterIdsParam = sp.get("costCenterIds");
  const costCenterIds = costCenterIdsParam
    ? costCenterIdsParam.split(",").filter(Boolean)
    : undefined;

  try {
    const data = await forecast({ organizationId, costCenterIds }, { months: validMonths });
    return Response.json(data);
  } catch (err) {
    console.error("[forecast] Error:", err);
    return Response.json({ error: "Errore nel calcolo delle previsioni" }, { status: 500 });
  }
}
