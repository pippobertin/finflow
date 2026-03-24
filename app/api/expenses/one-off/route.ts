import { NextRequest } from "next/server";
import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import { listOneOffExpenses, createOneOffExpense } from "@/lib/queries/expenses";
import { oneOffExpenseCreateSchema } from "@/lib/validations/expenses";

export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const data = await listOneOffExpenses(organizationId);
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = oneOffExpenseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = await createOneOffExpense(organizationId, parsed.data);
  return Response.json(data, { status: 201 });
}
