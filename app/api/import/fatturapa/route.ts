import { getAdminSession } from "@/lib/helpers/auth-guard";
import { FEATURES } from "@/lib/feature-flags";
import { parseFatturaPA } from "@/lib/parsers/fatturapa-parser";
import { importFatturaPA } from "@/lib/connectors/fatturapa-import";
import { fatturapaImportSchema } from "@/lib/validations/fatturapa-import";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  if (!FEATURES.LEGACY_FATTURAPA_IMPORT) return new Response(null, { status: 404 });

  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const configStr = formData.get("config") as string | null;

  if (!file) {
    return Response.json({ error: "File mancante" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File troppo grande (max 10MB)" }, { status: 400 });
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

  const parsed = fatturapaImportSchema.safeParse(config);
  if (!parsed.success) {
    return Response.json(
      { error: "Configurazione non valida", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Read organization VAT number for direction detection
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { vatNumber: true },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const parseResult = parseFatturaPA(buffer, file.name, org?.vatNumber ?? undefined);

  if (parsed.data.action === "parse") {
    return Response.json(parseResult);
  }

  // action === "import"
  if (parseResult.invoices.length === 0) {
    return Response.json(
      { error: "Nessuna fattura valida trovata nel file", details: parseResult.errors },
      { status: 400 },
    );
  }

  const result = await importFatturaPA({
    organizationId,
    parsedInvoices: parseResult.invoices,
    direction: parsed.data.direction,
  });

  // Merge parse warnings into import result
  result.warnings = [...parseResult.warnings, ...result.warnings];

  return Response.json(result);
}
