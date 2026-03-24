import { NextRequest } from "next/server";
import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import { listRecurringExpenses, createRecurringExpense } from "@/lib/queries/expenses";
import { recurringExpenseCreateSchema } from "@/lib/validations/expenses";

export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const data = await listRecurringExpenses(organizationId);
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = recurringExpenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = await createRecurringExpense(organizationId, parsed.data);
  return Response.json(data, { status: 201 });
}
