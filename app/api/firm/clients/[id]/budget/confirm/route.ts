import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { upsertFirmBudget } from "@/lib/queries/budget";
import type { CdgCategory } from "@prisma/client";

/**
 * POST /api/firm/clients/[id]/budget/confirm
 * Confirm and persist budget rows from a parsed preview.
 *
 * Body: { year: number, rows: Array<{ cdgCategory: string, month: number, amount: number }> }
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;

  const body = await request.json();
  const { year, rows } = body as {
    year: number;
    rows: Array<{ cdgCategory: string; month: number; amount: number; notes?: string }>;
  };

  if (!year || !rows || !Array.isArray(rows) || rows.length === 0) {
    return Response.json({ error: "year e rows sono obbligatori" }, { status: 400 });
  }

  if (year < 2000 || year > 2100) {
    return Response.json({ error: "Anno non valido" }, { status: 400 });
  }

  // Validate rows
  for (const row of rows) {
    if (!row.cdgCategory || row.month < 1 || row.month > 12 || typeof row.amount !== "number") {
      return Response.json(
        { error: "Ogni riga deve avere cdgCategory, month (1-12), amount (number)" },
        { status: 400 },
      );
    }
  }

  const count = await upsertFirmBudget(
    id,
    accountingFirmId,
    year,
    rows.map((r) => ({
      cdgCategory: r.cdgCategory as CdgCategory,
      month: r.month,
      amount: r.amount,
      notes: r.notes,
    })),
  );

  if (count === null) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  return Response.json({ upserted: count, year }, { status: 201 });
}
