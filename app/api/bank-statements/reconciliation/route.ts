import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { findMatches, confirmMatches } from "@/lib/reconciliation/reconciliation-engine";
import { reconciliationConfirmSchema } from "@/lib/validations/bank-statement-import";

export async function GET(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const bsIdsParam = request.nextUrl.searchParams.get("bankStatementIds");
  const bsIds = bsIdsParam ? bsIdsParam.split(",").filter(Boolean) : undefined;

  const matches = await findMatches(organizationId, bsIds);
  return Response.json(matches);
}

export async function POST(request: Request) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = reconciliationConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await confirmMatches(organizationId, parsed.data.matches);
  return Response.json(result);
}
