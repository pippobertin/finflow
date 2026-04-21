import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { suggestCategory } from "@/lib/queries/category-suggestion";

/**
 * GET /api/bank-statements/suggest-category?description=...
 * Returns a category suggestion based on previously categorized movements.
 */
export async function GET(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const description = request.nextUrl.searchParams.get("description");
  if (!description || description.trim().length < 3) {
    return Response.json({ suggestion: null });
  }

  const suggestion = await suggestCategory(organizationId, description.trim());
  return Response.json({ suggestion });
}
