import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { parseBudgetExcel } from "@/lib/parsers/cdg-budget-parser";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/firm/clients/[id]/budget/upload
 * Upload a budget Excel file. Returns parsed preview (not yet saved).
 *
 * FormData:
 * - file: Excel file
 * - year: (optional) override year
 * - sheetName: (optional) override sheet name
 * - budgetColumnIndex: (optional) override budget column index for CDG model format
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;

  // Ownership check
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const yearParam = formData.get("year") as string | null;
  const sheetName = formData.get("sheetName") as string | null;
  const budgetColParam = formData.get("budgetColumnIndex") as string | null;

  if (!file) {
    return Response.json({ error: "File obbligatorio" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const parsed = parseBudgetExcel(buffer, {
    year: yearParam ? parseInt(yearParam, 10) : undefined,
    sheetName: sheetName || undefined,
    budgetColumnIndex: budgetColParam ? parseInt(budgetColParam, 10) : undefined,
  });

  if (parsed.errors.length > 0) {
    return Response.json(
      {
        error: "Errore nel parsing del file budget",
        details: parsed.errors,
        warnings: parsed.warnings,
      },
      { status: 422 },
    );
  }

  // Aggregate rows by category for a summary view
  const summary: Record<string, number> = {};
  for (const row of parsed.rows) {
    summary[row.cdgCategory] = (summary[row.cdgCategory] || 0) + row.amount;
  }

  return Response.json({
    rows: parsed.rows,
    year: parsed.year,
    sheetName: parsed.sheetName,
    matchedCategories: parsed.matchedCategories,
    summary,
    warnings: parsed.warnings,
    totalRows: parsed.rows.length,
  });
}
