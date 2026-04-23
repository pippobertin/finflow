import { getAuthSession } from "@/lib/helpers/auth-guard";
import { parseBankStatementPdf } from "@/lib/parsers/pdf-parser";

export async function POST(request: Request) {
  const { error } = await getAuthSession();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "File PDF mancante" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "Il file deve essere un PDF" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await parseBankStatementPdf(buffer);

    if (result.rows.length === 0) {
      return Response.json(
        {
          error:
            "Nessuna transazione trovata nel PDF. Verifica che sia un estratto conto digitale (non scansionato).",
        },
        { status: 422 },
      );
    }

    return Response.json(result);
  } catch (err) {
    console.error("[parse-pdf] Error:", err);
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Errore durante l'analisi del PDF",
      },
      { status: 500 },
    );
  }
}
