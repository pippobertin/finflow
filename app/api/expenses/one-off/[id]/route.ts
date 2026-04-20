import { NextRequest } from "next/server";
import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import { checkFrozen } from "@/lib/helpers/frozen-guard";
import { getOneOffExpense, updateOneOffExpense, deleteOneOffExpense } from "@/lib/queries/expenses";
import { oneOffExpenseUpdateSchema } from "@/lib/validations/expenses";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const { id } = await params;
  const data = await getOneOffExpense(id, organizationId);
  if (!data) {
    return Response.json({ error: "Spesa non trovata" }, { status: 404 });
  }
  return Response.json(data);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const { id } = await params;

  const frozen = await checkFrozen("oneOffExpense", id, organizationId);
  if (frozen) return frozen;

  const body = await request.json();
  const parsed = oneOffExpenseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = await updateOneOffExpense(id, organizationId, parsed.data);
  if (!data) {
    return Response.json({ error: "Spesa non trovata" }, { status: 404 });
  }
  return Response.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const { id } = await params;

  const frozen = await checkFrozen("oneOffExpense", id, organizationId);
  if (frozen) return frozen;

  const data = await deleteOneOffExpense(id, organizationId);
  if (!data) {
    return Response.json({ error: "Spesa non trovata" }, { status: 404 });
  }
  return Response.json({ success: true });
}
