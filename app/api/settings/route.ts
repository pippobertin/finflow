import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import { getSettings, updateSettings } from "@/lib/queries/settings";
import { organizationSettingsSchema } from "@/lib/validations/settings";

export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const settings = await getSettings(organizationId);
  return Response.json(settings);
}

export async function PUT(request: Request) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = organizationSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await updateSettings(organizationId, parsed.data);
  return Response.json(updated);
}
