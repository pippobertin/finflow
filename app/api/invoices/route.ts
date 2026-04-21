import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { listInvoices } from "@/lib/queries/invoices";
import type { InvoiceDirection, InvoiceStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;

  const data = await listInvoices({
    organizationId,
    direction: sp.get("direction") as InvoiceDirection | undefined,
    status: sp.get("status") as InvoiceStatus | undefined,
    search: sp.get("search") ?? undefined,
    startDate: sp.get("startDate") ? new Date(sp.get("startDate")!) : undefined,
    endDate: sp.get("endDate") ? new Date(sp.get("endDate")!) : undefined,
    page: sp.get("page") ? parseInt(sp.get("page")!) : 1,
    pageSize: sp.get("pageSize") ? parseInt(sp.get("pageSize")!) : 20,
  });

  return Response.json(data);
}
