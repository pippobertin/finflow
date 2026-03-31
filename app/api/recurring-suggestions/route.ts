import { getAuthSession } from "@/lib/helpers/auth-guard";
import { detectRecurringExpenses } from "@/lib/analysis/recurring-detector";

export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  try {
    const suggestions = await detectRecurringExpenses(organizationId);
    return Response.json({ suggestions });
  } catch (err) {
    console.error("[recurring-suggestions]", err);
    return Response.json({ suggestions: [] });
  }
}
