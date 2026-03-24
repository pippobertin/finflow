import { getAdminSession } from "@/lib/helpers/auth-guard";
import { fetchCompanies } from "@/lib/connectors/fattureincloud";

export async function POST(request: Request) {
  const { error } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const accessToken = body.accessToken as string | undefined;

  if (!accessToken) {
    return Response.json({ error: "Access Token mancante" }, { status: 400 });
  }

  try {
    const companies = await fetchCompanies(accessToken);
    return Response.json({ companies });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Errore sconosciuto";
    return Response.json({ error: msg }, { status: 502 });
  }
}
