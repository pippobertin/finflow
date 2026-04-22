import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { importBankStatements } from "@/lib/connectors/bank-statement-import";
import { bankStatementImportSchema } from "@/lib/validations/bank-statement-import";
import { parsePdfWithProfile } from "@/lib/parsers/pdf-bank-statement-parser";
import { getPdfBankProfileByName } from "@/lib/queries/pdf-bank-profiles";
import { bankLayoutPatternsSchema } from "@/lib/validations/pdf-bank-profile";

/**
 * POST /api/firm/clients/[id]/movimenti/upload
 *
 * Upload bank statement file (CSV or PDF) for a client organization.
 * When uploading PDF with bankName, uses profile-based parser.
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
  const bankName = formData.get("bankName") as string | null;

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

    // If PDF + bankName → use profile-based parser
    if (isPdf && bankName) {
      const profile = await getPdfBankProfileByName(accountingFirmId, bankName);
      if (!profile) {
        return Response.json(
          {
            error: `Profilo banca "${bankName}" non configurato. Configuralo da Templates > PDF Banche.`,
          },
          { status: 400 },
        );
      }

      const patterns = bankLayoutPatternsSchema.safeParse(profile.layoutPatterns);
      if (!patterns.success) {
        return Response.json({ error: "Pattern del profilo non validi" }, { status: 500 });
      }

      const pdfBuffer = Buffer.from(await file.arrayBuffer());
      const pdfResult = await parsePdfWithProfile(pdfBuffer, patterns.data);

      if (pdfResult.rows.length === 0) {
        return Response.json({
          imported: 0,
          duplicates: 0,
          totalParsed: 0,
          errors: [],
          bankStatementIds: [],
          warnings: pdfResult.warnings,
        });
      }

      // Convert parsed rows to Record<string,string> format for import connector
      const mappedRows = pdfResult.rows.map((r) => ({
        Data: r.date,
        Descrizione: r.description,
        Importo: String(r.amount),
        ...(r.balance != null ? { Saldo: String(r.balance) } : {}),
      }));

      const result = await importBankStatements({
        organizationId,
        parsedRows: mappedRows,
        mapping: {
          date: "Data",
          description: "Descrizione",
          amount: "Importo",
          ...(pdfResult.rows.some((r) => r.balance != null) ? { balance: "Saldo" } : {}),
        },
        dateFormat: patterns.data.dateFormat,
        decimalSeparator: ".", // parsePdfWithProfile returns numeric strings
        sourceFile: file.name,
      });

      return Response.json({
        ...result,
        warnings: pdfResult.warnings,
      });
    }

    // Standard flow: PDF (generic parser) or CSV
    if (isPdf) {
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
