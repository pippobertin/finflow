import { prisma } from "@/lib/prisma";
import { organizationSettingsSchema, type OrganizationSettings } from "@/lib/validations/settings";

/**
 * Get organization settings, parsed with Zod defaults applied.
 */
export async function getSettings(organizationId: string): Promise<OrganizationSettings> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true },
  });

  // Parse with Zod to apply defaults for missing keys
  const raw = (org?.settings as Record<string, unknown>) ?? {};
  return organizationSettingsSchema.parse(raw);
}

/**
 * Update organization settings (merge into JSONB).
 */
export async function updateSettings(organizationId: string, data: OrganizationSettings) {
  return prisma.organization.update({
    where: { id: organizationId },
    data: { settings: JSON.parse(JSON.stringify(data)) },
    select: { settings: true },
  });
}
