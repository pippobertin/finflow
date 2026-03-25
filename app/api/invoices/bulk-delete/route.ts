import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { bulkDeleteInvoices } from "@/lib/queries/invoices";
import { invoiceBulkDeleteSchema } from "@/lib/validations/invoices";

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = invoiceBulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const deleted = await bulkDeleteInvoices(parsed.data.invoiceIds, organizationId);
  return Response.json({ deleted });
}
