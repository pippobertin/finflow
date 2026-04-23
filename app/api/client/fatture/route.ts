import { NextRequest } from "next/server";
import { getClientSession } from "@/lib/helpers/auth-guard";
import { listInvoices, updateInvoice } from "@/lib/queries/invoices";
import { prisma } from "@/lib/prisma";
import type { InvoiceDirection, InvoiceStatus } from "@prisma/client";

/**
 * GET /api/client/fatture
 *
 * List invoices for the client organization.
 * Supports filtering by direction, status, search, date range, pagination.
 */
export async function GET(request: NextRequest) {
  const { error, organizationId } = await getClientSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;

  const data = await listInvoices({
    organizationId,
    direction: (sp.get("direction") as InvoiceDirection) ?? undefined,
    status: (sp.get("status") as InvoiceStatus) ?? undefined,
    search: sp.get("search") ?? undefined,
    startDate: sp.get("startDate") ? new Date(sp.get("startDate")!) : undefined,
    endDate: sp.get("endDate") ? new Date(sp.get("endDate")!) : undefined,
    page: sp.get("page") ? parseInt(sp.get("page")!) : 1,
    pageSize: sp.get("pageSize") ? parseInt(sp.get("pageSize")!) : 20,
  });

  return Response.json(data);
}

/**
 * POST /api/client/fatture
 *
 * Create a new invoice with the 5-field light form:
 * - date (data fattura)
 * - dueDate (scadenza)
 * - netAmount (imponibile)
 * - vatAmount (IVA)
 * - direction (ACTIVE | PASSIVE)
 */
export async function POST(request: NextRequest) {
  const { error, session, organizationId } = await getClientSession();
  if (error) return error;
  if (session.user.userType === "CLIENT_ADMIN_BANK_ONLY") {
    return Response.json({ error: "Accesso riservato al titolare" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { date, dueDate, netAmount, vatAmount, direction, number: invoiceNumber, notes } = body;

    // Validation
    if (!date || !netAmount || !direction) {
      return Response.json(
        { error: "Campi obbligatori: data, imponibile, direzione" },
        { status: 400 },
      );
    }

    if (direction !== "ACTIVE" && direction !== "PASSIVE") {
      return Response.json({ error: "Direzione deve essere ACTIVE o PASSIVE" }, { status: 400 });
    }

    const net = parseFloat(netAmount);
    const vat = parseFloat(vatAmount ?? "0");
    if (isNaN(net) || net < 0) {
      return Response.json({ error: "Imponibile non valido" }, { status: 400 });
    }

    const gross = net + vat;

    // Auto-generate invoice number if not provided
    const num = invoiceNumber?.trim() || (await generateInvoiceNumber(organizationId, direction));

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        direction: direction as InvoiceDirection,
        number: num,
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        netAmount: net,
        vatAmount: vat,
        grossAmount: gross,
        notes: notes ?? null,
        status: "PENDING",
      },
    });

    return Response.json(invoice, { status: 201 });
  } catch (err) {
    console.error("[client/fatture] POST error:", err);
    return Response.json({ error: "Errore nella creazione della fattura" }, { status: 500 });
  }
}

/**
 * PATCH /api/client/fatture
 *
 * Mark an invoice as paid.
 * Body: { invoiceId, paidAt? }
 */
export async function PATCH(request: NextRequest) {
  const { error, session, organizationId } = await getClientSession();
  if (error) return error;
  if (session.user.userType === "CLIENT_ADMIN_BANK_ONLY") {
    return Response.json({ error: "Accesso riservato al titolare" }, { status: 403 });
  }

  try {
    const { invoiceId, paidAt } = await request.json();

    if (!invoiceId) {
      return Response.json({ error: "invoiceId obbligatorio" }, { status: 400 });
    }

    const result = await updateInvoice(invoiceId, organizationId, {
      status: "PAID" as InvoiceStatus,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
    });

    if (!result) {
      return Response.json({ error: "Fattura non trovata" }, { status: 404 });
    }

    return Response.json(result);
  } catch (err) {
    console.error("[client/fatture] PATCH error:", err);
    return Response.json({ error: "Errore nell'aggiornamento della fattura" }, { status: 500 });
  }
}

async function generateInvoiceNumber(organizationId: string, direction: string): Promise<string> {
  const count = await prisma.invoice.count({
    where: { organizationId, direction: direction as InvoiceDirection },
  });
  const prefix = direction === "ACTIVE" ? "FA" : "FP";
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}
