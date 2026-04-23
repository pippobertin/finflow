import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { importBankStatements } from "@/lib/connectors/bank-statement-import";
import { bankStatementImportSchema } from "@/lib/validations/bank-statement-import";

/**
 * POST /api/firm/clients/[id]/movimenti/upload
 *
 * Upload bank statement file (CSV or PDF) for a client organization.
 * PDF parsing always uses the robust V1 parser (pdf-parser.ts) via
 * importBankStatements. The bankName param is accepted for future use
 * but currently ignored — V1 handles all Italian banks automatically.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id: organizationId } = await params;

  // Ownership check
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const configStr = formData.get("config") as string | null;
  // bankName accepted for future use but currently ignored (V1 auto-detects)
  // const bankName = formData.get("bankName") as string | null;

  if (!file) {
    return Response.json({ error: "File mancante" }, { status: 400 });
  }
  if (!configStr) {
    return Response.json({ error: "Configurazione mancante" }, { status: 400 });
  }

  let config: unknown;
  try {
    config = JSON.parse(configStr);
  } catch {
    return Response.json({ error: "Configurazione non valida" }, { status: 400 });
  }

  const parsed = bankStatementImportSchema.safeParse(config);
  if (!parsed.success) {
    return Response.json(
      { error: "Configurazione non valida", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const isPdf = file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      // All PDFs use the robust V1 parser via importBankStatements
      const pdfBuffer = Buffer.from(await file.arrayBuffer());
      const result = await importBankStatements({
        organizationId,
        pdfBuffer,
        mapping: parsed.data.mapping,
        dateFormat: parsed.data.dateFormat,
        decimalSeparator: parsed.data.decimalSeparator,
        sourceFile: file.name,
      });
      return Response.json(result);
    }

    const csvContent = await file.text();
    const result = await importBankStatements({
      organizationId,
      csvContent,
      mapping: parsed.data.mapping,
      dateFormat: parsed.data.dateFormat,
      decimalSeparator: parsed.data.decimalSeparator,
      skipRows: parsed.data.skipRows,
      sourceFile: file.name,
    });
    return Response.json(result);
  } catch (err) {
    console.error("[firm/movimenti/upload] Error:", err);
    return Response.json({ error: "Errore nell'importazione del file" }, { status: 500 });
  }
}
