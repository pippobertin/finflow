import { NextRequest } from "next/server";
import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import { listExpectedPayables, createExpectedPayable } from "@/lib/queries/expected-payables";
import { expectedPayableCreateSchema } from "@/lib/validations/expected-payables";

export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  try {
    const data = await listExpectedPayables(organizationId);
    return Response.json(data);
  } catch (e) {
    // Table may not exist yet (migration not run)
    console.error("[expected-payables] GET error:", e);
    return Response.json([]);
  }
}

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = expectedPayableCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const data = await createExpectedPayable(organizationId, parsed.data);
    return Response.json(data, { status: 201 });
  } catch (e) {
    console.error("[expected-payables] POST error:", e);
    return Response.json(
      { error: "Tabella non trovata. Esegui la migrazione SQL in Supabase." },
      { status: 500 },
    );
  }
}
