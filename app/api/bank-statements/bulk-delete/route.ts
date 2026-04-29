import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import {
  deleteBankStatementsBySource,
  bulkDeleteBankStatements,
} from "@/lib/queries/bank-statements";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();

  // Delete by source file name
  if ("sourceFile" in body) {
    const deleted = await deleteBankStatementsBySource(organizationId, body.sourceFile ?? null);
    return Response.json({ deleted });
  }

  // Delete by IDs
  if (body.ids && Array.isArray(body.ids)) {
    const deleted = await bulkDeleteBankStatements(body.ids, organizationId);
    return Response.json({ deleted });
  }

  return Response.json({ error: "Parametri non validi" }, { status: 400 });
}
