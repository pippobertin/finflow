import { z } from "zod";

export const bankStatementReassignSchema = z.object({
  costCenterId: z.string().cuid().nullable(),
});

export type BankStatementReassignInput = z.infer<typeof bankStatementReassignSchema>;
