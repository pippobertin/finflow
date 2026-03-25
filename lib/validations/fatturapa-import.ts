import { z } from "zod";

export const fatturapaImportSchema = z.object({
  direction: z.enum(["ACTIVE", "PASSIVE"]),
  action: z.enum(["parse", "import"]),
});

export type FatturapaImportInput = z.infer<typeof fatturapaImportSchema>;
