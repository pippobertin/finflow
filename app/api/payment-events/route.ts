import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;
  const invoiceId = sp.get("invoiceId");
  const oneOffExpenseId = sp.get("oneOffExpenseId");

  const where: Record<string, unknown> = { organizationId };
  if (invoiceId) where.invoiceId = invoiceId;
  if (oneOffExpenseId) where.oneOffExpenseId = oneOffExpenseId;

  const events = await prisma.paymentEvent.findMany({
    where,
    orderBy: { eventDate: "asc" },
  });

  return Response.json(
    events.map((e) => ({
      ...e,
      amount: Number(e.amount),
    })),
  );
}

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const { invoiceId, oneOffExpenseId, amount, eventDate, isActual, notes } = body;

  if (!invoiceId && !oneOffExpenseId) {
    return Response.json({ error: "invoiceId or oneOffExpenseId is required" }, { status: 400 });
  }

  const event = await prisma.paymentEvent.create({
    data: {
      organizationId,
      invoiceId: invoiceId || null,
      oneOffExpenseId: oneOffExpenseId || null,
      amount,
      eventDate: new Date(eventDate),
      isActual: isActual ?? false,
      notes: notes || null,
    },
  });

  // Auto-update invoice status based on total paid
  if (invoiceId && isActual) {
    await updateInvoiceStatus(invoiceId);
  }

  return Response.json({ ...event, amount: Number(event.amount) }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const sp = request.nextUrl.searchParams;
  const id = sp.get("id");
  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const event = await prisma.paymentEvent.findFirst({
    where: { id, organizationId },
  });
  if (!event) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.paymentEvent.delete({ where: { id } });

  // Re-evaluate invoice status
  if (event.invoiceId && event.isActual) {
    await updateInvoiceStatus(event.invoiceId);
  }

  return Response.json({ success: true });
}

/**
 * Auto-update invoice status based on sum of actual payment events.
 */
async function updateInvoiceStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { grossAmount: true },
  });
  if (!invoice) return;

  const events = await prisma.paymentEvent.findMany({
    where: { invoiceId, isActual: true },
    select: { amount: true },
  });

  const totalPaid = events.reduce((sum, e) => sum + Number(e.amount), 0);
  const grossAmount = Number(invoice.grossAmount);

  const newStatus: "PAID" | "PENDING" = totalPaid >= grossAmount ? "PAID" : "PENDING";

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: newStatus,
      paidAt: newStatus === "PAID" ? new Date() : null,
    },
  });
}
