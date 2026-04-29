import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { bulkUpdateInvoiceStatus } from "@/lib/queries/invoices";
import { invoiceBulkStatusSchema } from "@/lib/validations/invoices";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = invoiceBulkStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await bulkUpdateInvoiceStatus(
    parsed.data.invoiceIds,
    organizationId,
    parsed.data.status,
    parsed.data.paidAtMap,
  );

  return Response.json({ updated });
}
