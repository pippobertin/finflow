import { prisma } from "@/lib/prisma";
import type { OrganizationUpdateInput } from "@/lib/validations/organization";

export async function getOrganization(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      vatNumber: true,
      address: true,
      city: true,
      province: true,
      zipCode: true,
      country: true,
      email: true,
      phone: true,
      settings: true,
    },
  });

  if (!org) return null;

  const settings = (org.settings as Record<string, unknown>) ?? {};
  return {
    ...org,
    currentBalance: (settings.currentBalance as number) ?? null,
    vatPeriodicity: (settings.vatPeriodicity as string) ?? "quarterly",
  };
}

export async function updateOrganization(organizationId: string, data: OrganizationUpdateInput) {
  const { currentBalance, vatPeriodicity, ...orgData } = data;

  // Merge settings fields into the JSONB if provided
  const hasSettingsUpdate = currentBalance !== undefined || vatPeriodicity !== undefined;

  if (hasSettingsUpdate) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });
    const settings = (org?.settings as Record<string, unknown>) ?? {};

    if (currentBalance !== undefined) {
      settings.currentBalance = currentBalance;
      settings.currentBalanceUpdatedAt = new Date().toISOString();
    }
    if (vatPeriodicity !== undefined) {
      settings.vatPeriodicity = vatPeriodicity;
    }

    return prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...orgData,
        settings: JSON.parse(JSON.stringify(settings)),
      },
    });
  }

  return prisma.organization.update({
    where: { id: organizationId },
    data: orgData,
  });
}
