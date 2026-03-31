import { z } from "zod";

const invoiceStatusEnum = z.enum(["PAID", "PENDING"]);

export const invoiceUpdateSchema = z.object({
  costCenterId: z.string().cuid().nullable().optional(),
  status: invoiceStatusEnum.optional(),
  paidAt: z.coerce.date().nullable().optional(),
  // DSO override fields
  expectedCollectionDate: z.coerce.date().nullable().optional(),
  counterpartCustomDso: z.number().int().min(0).nullable().optional(),
  // Bank operations fields
  isDiscountedAtBank: z.boolean().optional(),
  bankDiscountType: z.string().nullable().optional(),
  bankLiquidationDate: z.coerce.date().nullable().optional(),
  bankDiscountFee: z.number().min(0).nullable().optional(),
});

/** @deprecated Use invoiceUpdateSchema */
export const invoiceReassignSchema = invoiceUpdateSchema;

export const invoiceBulkStatusSchema = z.object({
  invoiceIds: z.array(z.string().cuid()).min(1),
  status: invoiceStatusEnum,
  paidAtMap: z.record(z.string(), z.coerce.date()).optional(),
});

export const invoiceBulkDeleteSchema = z.object({
  invoiceIds: z.array(z.string().cuid()).min(1),
});

export const autoTagSchema = z.object({
  invoiceIds: z.array(z.string().cuid()).optional(),
});

export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;
export type InvoiceReassignInput = InvoiceUpdateInput;
export type InvoiceBulkStatusInput = z.infer<typeof invoiceBulkStatusSchema>;
export type AutoTagInput = z.infer<typeof autoTagSchema>;
