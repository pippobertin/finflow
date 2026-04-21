import { z } from "zod";

const invoiceStatusEnum = z.enum(["PAID", "PENDING"]);

export const invoiceUpdateSchema = z.object({
  status: invoiceStatusEnum.optional(),
  paidAt: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  bankAccountId: z.string().cuid().nullable().optional(),
});

export const invoiceBulkStatusSchema = z.object({
  invoiceIds: z.array(z.string().cuid()).min(1),
  status: invoiceStatusEnum,
  paidAtMap: z.record(z.string(), z.coerce.date()).optional(),
});

export const invoiceBulkDeleteSchema = z.object({
  invoiceIds: z.array(z.string().cuid()).min(1),
});

export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;
export type InvoiceBulkStatusInput = z.infer<typeof invoiceBulkStatusSchema>;
