import { NextRequest } from "next/server";
import { z } from "zod";
import { getClientSession } from "@/lib/helpers/auth-guard";
import { listInvoices, updateInvoice, deleteInvoice } from "@/lib/queries/invoices";
import { prisma } from "@/lib/prisma";
import type { InvoiceDirection, InvoiceStatus } from "@prisma/client";

const patchSchema = z.object({
  invoiceId: z.string().min(1),
  // Mark-as-paid flow (legacy)
  markPaid: z.literal(true).optional(),
  paidAt: z.string().optional(),
  // General field updates
  direction: z.enum(["ACTIVE", "PASSIVE"]).optional(),
  date: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  netAmount: z.number().optional(),
  vatAmount: z.number().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * GET /api/client/fatture
 *
 * List invoices for the client organization.
 * Supports filtering by direction, status, search, date range, pagination.
 */
export const dynamic = "force-dynamic";

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
 * Two modes:
 * 1. Mark as paid: { invoiceId, markPaid: true, paidAt? }
 * 2. General update: { invoiceId, direction?, date?, dueDate?, netAmount?, vatAmount?, notes? }
 *    If netAmount or vatAmount are provided, grossAmount is recalculated.
 */
export async function PATCH(request: NextRequest) {
  const { error, session, organizationId } = await getClientSession();
  if (error) return error;
  if (session.user.userType === "CLIENT_ADMIN_BANK_ONLY") {
    return Response.json({ error: "Accesso riservato al titolare" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Dati non validi", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { invoiceId, markPaid, paidAt, ...fields } = parsed.data;

    // Mode 1: mark as paid (legacy flow)
    if (markPaid) {
      const result = await updateInvoice(invoiceId, organizationId, {
        status: "PAID" as InvoiceStatus,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      });
      if (!result) {
        return Response.json({ error: "Fattura non trovata" }, { status: 404 });
      }
      return Response.json(result);
    }

    // Mode 2: general field update
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
    });
    if (!invoice) {
      return Response.json({ error: "Fattura non trovata" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (fields.direction !== undefined) updateData.direction = fields.direction;
    if (fields.date !== undefined) updateData.date = new Date(fields.date);
    if (fields.dueDate !== undefined)
      updateData.dueDate = fields.dueDate ? new Date(fields.dueDate) : null;
    if (fields.notes !== undefined) updateData.notes = fields.notes;

    // Recalculate gross if net or vat changed
    if (fields.netAmount !== undefined || fields.vatAmount !== undefined) {
      const net = fields.netAmount ?? Number(invoice.netAmount);
      const vat = fields.vatAmount ?? Number(invoice.vatAmount);
      updateData.netAmount = net;
      updateData.vatAmount = vat;
      updateData.grossAmount = net + vat;
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json(invoice);
    }

    const result = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });

    return Response.json(result);
  } catch (err) {
    console.error("[client/fatture] PATCH error:", err);
    return Response.json({ error: "Errore nell'aggiornamento della fattura" }, { status: 500 });
  }
}

/**
 * DELETE /api/client/fatture
 *
 * Delete an invoice. Body: { invoiceId }
 */
export async function DELETE(request: NextRequest) {
  const { error, session, organizationId } = await getClientSession();
  if (error) return error;
  if (session.user.userType === "CLIENT_ADMIN_BANK_ONLY") {
    return Response.json({ error: "Accesso riservato al titolare" }, { status: 403 });
  }

  try {
    const { invoiceId } = await request.json();
    if (!invoiceId || typeof invoiceId !== "string") {
      return Response.json({ error: "invoiceId obbligatorio" }, { status: 400 });
    }

    const result = await deleteInvoice(invoiceId, organizationId);
    if (!result) {
      return Response.json({ error: "Fattura non trovata" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("[client/fatture] DELETE error:", err);
    return Response.json({ error: "Errore nell'eliminazione della fattura" }, { status: 500 });
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
