import { getAuthSession } from "@/lib/helpers/auth-guard";
import { buildFullTimeline } from "@/lib/queries/cashflow-projection";

export async function GET() {
  const { error, session, organizationId } = await getAuthSession();
  if (error) return error;
  if (session.user.userType === "CLIENT_ADMIN_BANK_ONLY") {
    return Response.json({ error: "Accesso riservato al titolare" }, { status: 403 });
  }

  try {
    const result = await buildFullTimeline(organizationId);
    return Response.json(result);
  } catch (err) {
    console.error("[cashflow-projection] Error:", err);
    return Response.json(
      { error: "Errore nel calcolo della proiezione cashflow" },
      { status: 500 },
    );
  }
}
