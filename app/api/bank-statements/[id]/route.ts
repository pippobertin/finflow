import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { checkFrozen } from "@/lib/helpers/frozen-guard";
import { reassignBankStatementCostCenter } from "@/lib/queries/bank-statements";
import { bankStatementReassignSchema } from "@/lib/validations/bank-statements";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const { id } = await params;

  const frozen = await checkFrozen("bankStatement", id, organizationId);
  if (frozen) return frozen;

  const body = await request.json();
  const parsed = bankStatementReassignSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = await reassignBankStatementCostCenter(id, organizationId, parsed.data.costCenterId);
  if (!data) {
    return Response.json({ error: "Movimento non trovato" }, { status: 404 });
  }
  return Response.json(data);
}
