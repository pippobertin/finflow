import { z } from "zod";

export const costCenterCreateSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(100),
  type: z.enum(["COST", "REVENUE"]),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Colore hex non valido")
    .default("#6B7280"),
  keywords: z.array(z.string().min(1)).default([]),
  description: z.string().max(500).optional(),
});

export const costCenterUpdateSchema = costCenterCreateSchema.partial();

export type CostCenterCreateInput = z.infer<typeof costCenterCreateSchema>;
export type CostCenterUpdateInput = z.infer<typeof costCenterUpdateSchema>;
