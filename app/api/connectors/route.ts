import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import { FEATURES } from "@/lib/feature-flags";
import { listConnectors, createConnector } from "@/lib/queries/connectors";
import { connectorCreateSchema } from "@/lib/validations/connector";

export async function GET() {
  if (!FEATURES.LEGACY_FATTUREINCLOUD) return new Response(null, { status: 404 });

  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const data = await listConnectors(organizationId);
    return Response.json(data);
  } catch (err) {
    console.error("GET /api/connectors error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!FEATURES.LEGACY_FATTUREINCLOUD) return new Response(null, { status: 404 });

  try {
    const { error, organizationId } = await getAdminSession();
    if (error) return error;

    const body = await request.json();
    const parsed = connectorCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Dati non validi", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Require config for FATTURE_IN_CLOUD
    if (parsed.data.type === "FATTURE_IN_CLOUD") {
      if (!parsed.data.config?.accessToken || !parsed.data.config?.companyId) {
        return Response.json(
          { error: "Access Token e Company ID sono obbligatori per Fatture in Cloud" },
          { status: 400 },
        );
      }
    }

    const connector = await createConnector(organizationId, parsed.data);
    return Response.json(connector, { status: 201 });
  } catch (err) {
    console.error("POST /api/connectors error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
