import { z } from "zod";

export const connectorConfigSchema = z.object({
  accessToken: z.string().min(1, "Access Token obbligatorio"),
  companyId: z.string().min(1, "Company ID obbligatorio"),
  syncFromDate: z.string().optional(),
  syncToDate: z.string().optional(),
});

export const connectorCreateSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(100),
  type: z.enum(["FATTURE_IN_CLOUD", "CSV_IMPORT", "MANUAL"]),
  config: connectorConfigSchema.optional(),
});

export const connectorUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  config: connectorConfigSchema.partial().optional(),
});

export type ConnectorCreateInput = z.infer<typeof connectorCreateSchema>;
export type ConnectorUpdateInput = z.infer<typeof connectorUpdateSchema>;
export type ConnectorConfig = z.infer<typeof connectorConfigSchema>;
