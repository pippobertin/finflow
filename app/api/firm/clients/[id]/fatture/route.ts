import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { listInvoices } from "@/lib/queries/invoices";
import type { InvoiceDirection, InvoiceStatus } from "@prisma/client";

/**
 * GET /api/firm/clients/[id]/fatture
 *
 * List invoices for a client organization (firm controller access).
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id: organizationId } = await params;

  // Verify organization belongs to this firm
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const sp = request.nextUrl.searchParams;

  const data = await listInvoices({
    organizationId,
    direction: (sp.get("direction") as InvoiceDirection) ?? undefined,
    status: (sp.get("status") as InvoiceStatus) ?? undefined,
    search: sp.get("search") ?? undefined,
    startDate: sp.get("startDate") ? new Date(sp.get("startDate")!) : undefined,
    endDate: sp.get("endDate") ? new Date(sp.get("endDate")!) : undefined,
    page: sp.get("page") ? parseInt(sp.get("page")!) : 1,
    pageSize: sp.get("pageSize") ? parseInt(sp.get("pageSize")!) : 50,
  });

  return Response.json(data);
}
