import { getAuthSession } from "@/lib/helpers/auth-guard";
import { analyzeDataFreshness } from "@/lib/analysis/data-freshness";

export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  try {
    const gaps = await analyzeDataFreshness(organizationId);
    return Response.json({ gaps });
  } catch (err) {
    console.error("[data-freshness]", err);
    return Response.json({ gaps: [] });
  }
}
