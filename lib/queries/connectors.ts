import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import type { ConnectorCreateInput, ConnectorUpdateInput } from "@/lib/validations/connector";

function extractPublicConfig(encryptedConfig: string | null): {
  syncFromDate: string | null;
  syncToDate: string | null;
  companyId: string | null;
} {
  if (!encryptedConfig) return { syncFromDate: null, syncToDate: null, companyId: null };
  try {
    const config = JSON.parse(decrypt(encryptedConfig)) as Record<string, string>;
    return {
      syncFromDate: config.syncFromDate ?? null,
      syncToDate: config.syncToDate ?? null,
      companyId: config.companyId ?? null,
    };
  } catch {
    return { syncFromDate: null, syncToDate: null, companyId: null };
  }
}

export async function listConnectors(organizationId: string) {
  const connectors = await prisma.connector.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
      lastSyncAt: true,
      encryptedConfig: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return connectors.map(({ encryptedConfig, ...rest }) => ({
    ...rest,
    ...extractPublicConfig(encryptedConfig),
  }));
}

export async function getConnectorById(id: string, organizationId: string) {
  return prisma.connector.findFirst({
    where: { id, organizationId },
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
      lastSyncAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createConnector(organizationId: string, data: ConnectorCreateInput) {
  const encryptedConfig = data.config ? encrypt(JSON.stringify(data.config)) : null;

  return prisma.connector.create({
    data: {
      organizationId,
      name: data.name,
      type: data.type,
      encryptedConfig,
    },
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
      lastSyncAt: true,
      createdAt: true,
    },
  });
}

export async function updateConnector(
  id: string,
  organizationId: string,
  data: ConnectorUpdateInput,
) {
  const existing = await prisma.connector.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (data.config) {
    // Merge new config fields with existing
    let currentConfig: Record<string, string> = {};
    if (existing.encryptedConfig) {
      try {
        currentConfig = JSON.parse(decrypt(existing.encryptedConfig));
      } catch {
        currentConfig = {};
      }
    }
    const merged = { ...currentConfig };
    for (const [key, value] of Object.entries(data.config)) {
      if (value !== undefined && value !== "") {
        merged[key] = value;
      }
    }
    updateData.encryptedConfig = encrypt(JSON.stringify(merged));
  }

  return prisma.connector.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
      lastSyncAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteConnector(id: string, organizationId: string) {
  const existing = await prisma.connector.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  return prisma.connector.delete({ where: { id } });
}

export async function getDecryptedConfig(id: string, organizationId: string) {
  const connector = await prisma.connector.findFirst({
    where: { id, organizationId },
    select: { encryptedConfig: true, type: true },
  });
  if (!connector?.encryptedConfig) return null;

  try {
    return JSON.parse(decrypt(connector.encryptedConfig)) as Record<string, string>;
  } catch {
    return null;
  }
}
