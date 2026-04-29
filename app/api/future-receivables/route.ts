import { NextRequest } from "next/server";
import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import { listFutureReceivables, createFutureReceivable } from "@/lib/queries/future-receivables";
import { futureReceivableCreateSchema } from "@/lib/validations/future-receivables";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const data = await listFutureReceivables(organizationId);
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = futureReceivableCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = await createFutureReceivable(organizationId, parsed.data);
  return Response.json(data, { status: 201 });
}
