import { z } from "zod";

export const organizationUpdateSchema = z.object({
  name: z.string().min(1, "La ragione sociale è obbligatoria").max(200),
  vatNumber: z
    .string()
    .regex(/^IT\d{11}$/, "Formato P.IVA non valido (IT + 11 cifre)")
    .nullable()
    .optional(),
  address: z.string().max(300).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  province: z.string().length(2, "La provincia deve essere di 2 caratteri").nullable().optional(),
  zipCode: z
    .string()
    .regex(/^\d{5}$/, "Il CAP deve essere di 5 cifre")
    .nullable()
    .optional(),
  email: z.string().email("Email non valida").nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  currentBalance: z.number().nullable().optional(),
  vatPeriodicity: z.enum(["monthly", "quarterly"]).default("quarterly").optional(),
});

export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;
