import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { FEATURES } from "@/lib/feature-flags";
import { getDecryptedConfig } from "@/lib/queries/connectors";
import { testConnection } from "@/lib/connectors/fattureincloud";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!FEATURES.LEGACY_FATTUREINCLOUD) return new Response(null, { status: 404 });

  try {
    const { error, organizationId } = await getAdminSession();
    if (error) return error;

    const { id } = await params;
    const config = await getDecryptedConfig(id, organizationId);
    if (!config) {
      return Response.json(
        { error: "Connettore non trovato o configurazione mancante" },
        { status: 404 },
      );
    }

    const result = await testConnection({
      accessToken: config.accessToken ?? "",
      companyId: config.companyId ?? "",
    });

    return Response.json(result);
  } catch (err) {
    console.error("POST /api/connectors/[id]/test error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
