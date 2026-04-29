import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { checkBulkFrozen } from "@/lib/helpers/frozen-guard";
import { bulkCategorizeBankStatements } from "@/lib/queries/bank-statements";
import { bankStatementBulkCategorizeSchema } from "@/lib/validations/bank-statements";
import { computeVatSplit } from "@/lib/vat/vat-split";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/bank-statements/bulk-categorize
 * Assign the same CDG category to multiple bank statements.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = bankStatementBulkCategorizeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check frozen guard
  const frozen = await checkBulkFrozen("bankStatement", parsed.data.ids, organizationId);
  if (frozen) return frozen;

  // Look up the ChartOfAccountsMapping for the VAT rate
  const mapping = await prisma.chartOfAccountsMapping.findFirst({
    where: {
      organizationId,
      cdgCategory: parsed.data.cdgCategory,
      isActive: true,
    },
    select: { isVatable: true, vatRate: true },
  });

  const vatMapping = mapping
    ? { isVatable: mapping.isVatable, vatRate: mapping.vatRate ? Number(mapping.vatRate) : null }
    : null;

  const count = await bulkCategorizeBankStatements(
    parsed.data.ids,
    organizationId,
    parsed.data.cdgCategory,
    (grossAmount) => computeVatSplit(grossAmount, vatMapping),
  );

  return Response.json({ categorized: count });
}
