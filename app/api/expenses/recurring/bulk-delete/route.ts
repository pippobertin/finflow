import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { bulkDeleteRecurringExpenses } from "@/lib/queries/expenses";
import { expenseBulkDeleteSchema } from "@/lib/validations/expenses";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = expenseBulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const deleted = await bulkDeleteRecurringExpenses(parsed.data.ids, organizationId);
  return Response.json({ deleted });
}
