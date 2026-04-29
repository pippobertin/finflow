import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { checkFrozen } from "@/lib/helpers/frozen-guard";
import { categorizeBankStatement } from "@/lib/queries/bank-statements";
import { bankStatementCategorizeSchema } from "@/lib/validations/bank-statements";
import { computeVatSplit } from "@/lib/vat/vat-split";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/bank-statements/[id]/categorize
 * Assign a CDG category to a bank statement and compute the VAT split.
 */
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const { id } = await params;

  const frozen = await checkFrozen("bankStatement", id, organizationId);
  if (frozen) return frozen;

  const body = await request.json();
  const parsed = bankStatementCategorizeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Fetch the statement to get the gross amount
  const statement = await prisma.bankStatement.findFirst({
    where: { id, organizationId },
    select: { amount: true },
  });
  if (!statement) {
    return Response.json({ error: "Movimento non trovato" }, { status: 404 });
  }

  // Look up the ChartOfAccountsMapping for the VAT rate
  const mapping = await prisma.chartOfAccountsMapping.findFirst({
    where: {
      organizationId,
      cdgCategory: parsed.data.cdgCategory,
      isActive: true,
    },
    select: { isVatable: true, vatRate: true },
  });

  const grossAmount = Number(statement.amount);
  const split = computeVatSplit(
    grossAmount,
    mapping
      ? {
          isVatable: mapping.isVatable,
          vatRate: mapping.vatRate ? Number(mapping.vatRate) : null,
        }
      : null,
  );

  const result = await categorizeBankStatement(
    id,
    organizationId,
    parsed.data.cdgCategory,
    split.netAmount,
    split.vatAmount,
  );

  if (!result) {
    return Response.json({ error: "Movimento non trovato" }, { status: 404 });
  }

  return Response.json(result);
}
