import { z } from "zod";

export const customerCollectionOverrideSchema = z.object({
  customerName: z.string().min(1, "Nome cliente obbligatorio"),
  days: z.number().int().min(1).max(365),
});

export const costCenterAlertSchema = z.object({
  costCenterId: z.string().min(1),
  minBalance: z.number(),
});

export const organizationSettingsSchema = z.object({
  defaultCollectionDays: z.number().int().min(1).max(365).default(60),
  customerCollectionOverrides: z.array(customerCollectionOverrideSchema).default([]),
  globalMinBalance: z.number().default(0),
  costCenterAlerts: z.array(costCenterAlertSchema).default([]),
  defaultForecastHorizonMonths: z.number().int().min(1).max(24).default(6),
  currentBalance: z.number().nullable().default(null),
  currentBalanceUpdatedAt: z.string().nullable().default(null),
  vatPeriodicity: z.enum(["monthly", "quarterly"]).default("quarterly"),
});

export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;
export type CustomerCollectionOverride = z.infer<typeof customerCollectionOverrideSchema>;
export type CostCenterAlert = z.infer<typeof costCenterAlertSchema>;
