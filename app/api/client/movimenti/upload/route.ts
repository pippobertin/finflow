import { getClientSession } from "@/lib/helpers/auth-guard";
import { importBankStatements } from "@/lib/connectors/bank-statement-import";
import { bankStatementImportSchema } from "@/lib/validations/bank-statement-import";

/**
 * POST /api/client/movimenti/upload
 *
 * Upload bank statement file (CSV or PDF) for the client organization.
 * Same logic as /api/import/bank-statement but scoped to client auth.
 */
export async function POST(request: Request) {
  const { error, organizationId } = await getClientSession();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const configStr = formData.get("config") as string | null;

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

    let result;
    if (isPdf) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);
      result = await importBankStatements({
        organizationId,
        pdfBuffer,
        mapping: parsed.data.mapping,
        dateFormat: parsed.data.dateFormat,
        decimalSeparator: parsed.data.decimalSeparator,
        sourceFile: file.name,
      });
    } else {
      const csvContent = await file.text();
      result = await importBankStatements({
        organizationId,
        csvContent,
        mapping: parsed.data.mapping,
        dateFormat: parsed.data.dateFormat,
        decimalSeparator: parsed.data.decimalSeparator,
        skipRows: parsed.data.skipRows,
        sourceFile: file.name,
      });
    }

    return Response.json(result);
  } catch (err) {
    console.error("[client/movimenti/upload] Error:", err);
    return Response.json({ error: "Errore nell'importazione del file" }, { status: 500 });
  }
}
