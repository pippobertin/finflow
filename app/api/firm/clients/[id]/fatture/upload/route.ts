import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { parseInvoiceExcel } from "@/lib/parsers/invoice-excel-parser";
import type { ParsedInvoiceRow } from "@/lib/parsers/invoice-excel-parser";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id: organizationId } = await params;

  // Verify organization belongs to this firm
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  // Parse multipart form
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "Campo 'file' obbligatorio" }, { status: 400 });
  }

  // Parse the Excel file
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseInvoiceExcel(buffer);

  if (parsed.errors.length > 0 && parsed.rows.length === 0) {
    return Response.json(
      {
        error: "Errore nel parsing del file",
        totalRows: 0,
        importedRows: 0,
        skippedDuplicates: 0,
        errors: parsed.errors.map((e) => ({ row: e.row, message: e.message })),
      },
      { status: 422 },
    );
  }

  // Dedup: check existing invoices with matching (organizationId, number, date, direction)
  const toInsert: ParsedInvoiceRow[] = [];
  let skippedDuplicates = 0;

  // Batch-fetch existing invoices for dedup
  const existingInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      number: { in: parsed.rows.map((r) => r.number) },
    },
    select: { number: true, date: true, direction: true },
  });

  const existingSet = new Set(
    existingInvoices.map(
      (inv) => `${inv.number}|${inv.date.toISOString().slice(0, 10)}|${inv.direction}`,
    ),
  );

  for (const row of parsed.rows) {
    const key = `${row.number}|${row.date.toISOString().slice(0, 10)}|${row.direction}`;
    if (existingSet.has(key)) {
      skippedDuplicates++;
    } else {
      toInsert.push(row);
      // Add to set to handle duplicates within the same file
      existingSet.add(key);
    }
  }

  // Bulk insert
  let importedRows = 0;
  if (toInsert.length > 0) {
    const result = await prisma.invoice.createMany({
      data: toInsert.map((row) => ({
        organizationId,
        number: row.number,
        date: row.date,
        dueDate: row.dueDate,
        direction: row.direction,
        netAmount: row.netAmount,
        vatAmount: row.vatAmount,
        grossAmount: row.grossAmount,
        notes: row.notes,
        status: row.status,
      })),
      skipDuplicates: true,
    });
    importedRows = result.count;
  }

  return Response.json({
    totalRows: parsed.rows.length + parsed.errors.length,
    importedRows,
    skippedDuplicates,
    errors: parsed.errors.map((e) => ({ row: e.row, message: e.message })),
    warnings: parsed.warnings.map((w) => ({ row: w.row, message: w.message })),
  });
}
