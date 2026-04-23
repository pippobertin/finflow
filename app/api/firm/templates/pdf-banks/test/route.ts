import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { parseBankStatementPdf } from "@/lib/parsers/pdf-parser";
import { adaptV1ToDisplay } from "@/lib/parsers/pdf-parser-v1-adapter";

/**
 * POST /api/firm/templates/pdf-banks/test
 *
 * Upload a test PDF file. Always uses the robust V1 parser (pdf-parser.ts).
 * The profileId param is accepted for UI compatibility but the profile's
 * layout patterns are NOT used — V1 handles all Italian banks automatically.
 */
export async function POST(request: NextRequest) {
  const { error } = await getFirmSession();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return Response.json({ error: "File PDF obbligatorio" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "Solo file PDF accettati" }, { status: 400 });
  }

  // Parse PDF with V1 robust parser
  const buffer = Buffer.from(await file.arrayBuffer());
  const v1Result = await parseBankStatementPdf(buffer);
  const adapted = adaptV1ToDisplay(v1Result);

  return Response.json({
    rows: adapted.rows.slice(0, 50), // Limit preview to 50 rows
    totalRows: adapted.totalRows,
    warnings: adapted.warnings,
    rawTextPreview: "",
    stats: {
      totalLines: v1Result.rows.length,
      matchedLines: adapted.rows.length,
      skippedLines: adapted.warnings.length,
    },
    ecMetadata: adapted.ecMetadata,
  });
}
