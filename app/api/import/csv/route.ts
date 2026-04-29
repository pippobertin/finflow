import { getAuthSession } from "@/lib/helpers/auth-guard";
import { importCsv } from "@/lib/connectors/csv-import";
import { csvImportSchema } from "@/lib/validations/import";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { error, session, organizationId } = await getAuthSession();
  if (error) return error;
  if (session.user.userType === "CLIENT_ADMIN_BANK_ONLY") {
    return Response.json({ error: "Accesso riservato al titolare" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const configStr = formData.get("config") as string | null;

  if (!file) {
    return Response.json({ error: "File CSV mancante" }, { status: 400 });
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

  const parsed = csvImportSchema.safeParse(config);
  if (!parsed.success) {
    return Response.json(
      { error: "Configurazione non valida", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const csvContent = await file.text();
  const result = await importCsv({
    organizationId,
    csvContent,
    direction: parsed.data.direction,
    mapping: parsed.data.mapping,
    dateFormat: parsed.data.dateFormat,
    decimalSeparator: parsed.data.decimalSeparator,
    skipRows: parsed.data.skipRows,
  });

  return Response.json(result);
}
