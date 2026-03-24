import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import { getOrganization, updateOrganization } from "@/lib/queries/organization";
import { organizationUpdateSchema } from "@/lib/validations/organization";

export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const org = await getOrganization(organizationId);
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  return Response.json(org);
}

export async function PUT(request: Request) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = organizationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await updateOrganization(organizationId, parsed.data);
  return Response.json(updated);
}
