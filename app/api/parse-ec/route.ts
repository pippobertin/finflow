import { getAuthSession } from "@/lib/helpers/auth-guard";
import { parseBankStatementPdf } from "@/lib/parsers/pdf-parser";

export async function POST(request: Request) {
  const { error } = await getAuthSession();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return Response.json({ error: "Nessun file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseBankStatementPdf(buffer);

    return Response.json({
      rowCount: result.rows.length,
      closingBalance: result.ecMetadata.closingBalance,
      closingDate: result.ecMetadata.closingDate,
      openingBalance: result.ecMetadata.openingBalance,
    });
  } catch (err) {
    console.error("[parse-ec]", err);
    return Response.json({ error: "Errore nel parsing" }, { status: 500 });
  }
}
