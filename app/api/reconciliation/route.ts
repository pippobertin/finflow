import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  findMatchesEnhanced,
  confirmMatchesEnhanced,
} from "@/lib/reconciliation/reconciliation-engine";

// GET: Fetch reconciliation data (unreconciled movements, suggestions, unmatched invoices)
export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const [unreconciledMovements, suggestions, unmatchedInvoices] = await Promise.all([
    prisma.bankStatement.findMany({
      where: { organizationId, isReconciled: false },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        description: true,
        amount: true,
        balance: true,
        sourceFile: true,
      },
    }),
    findMatchesEnhanced(organizationId),
    prisma.invoice.findMany({
      where: {
        organizationId,
        OR: [
          { status: "PENDING" },
          // PAID invoices not yet linked to any reconciled bank movement
          { status: "PAID", bankStatements: { none: { isReconciled: true } } },
        ],
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        number: true,
        counterpart: true,
        grossAmount: true,
        direction: true,
        date: true,
        dueDate: true,
        status: true,
      },
    }),
  ]);

  return Response.json({
    unreconciledMovements: unreconciledMovements.map((m) => ({
      ...m,
      amount: Number(m.amount),
      balance: Number(m.balance),
    })),
    suggestions,
    unmatchedInvoices: unmatchedInvoices.map((i) => ({
      ...i,
      grossAmount: Number(i.grossAmount),
    })),
  });
}

// POST: Confirm or reject matches
export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const { action, matches, bankStatementId, invoiceIds } = body;

  if (action === "confirm") {
    try {
      const result = await confirmMatchesEnhanced(organizationId, matches);
      return Response.json(result);
    } catch (e) {
      console.error("[reconciliation] confirm error:", e);
      return Response.json(
        { error: e instanceof Error ? e.message : "Errore nella conferma" },
        { status: 500 },
      );
    }
  }

  if (action === "manual-match") {
    // Manual match: one bank statement to one or more invoices
    const bs = await prisma.bankStatement.findFirst({
      where: { id: bankStatementId, organizationId, isReconciled: false },
    });
    if (!bs) return Response.json({ error: "Movimento non trovato" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.bankStatement.update({
        where: { id: bankStatementId },
        data: {
          isReconciled: true,
          reconciledInvoiceId: invoiceIds[0],
          reconciledAt: new Date(),
        },
      });

      for (const invoiceId of invoiceIds) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID", paidAt: bs.date },
        });
      }
    });

    return Response.json({
      reconciled: 1,
      invoicesUpdated: invoiceIds.length,
    });
  }

  if (action === "ignore") {
    // Mark as reconciled without linking to invoice (non-invoice movement)
    const ignoreData: Record<string, unknown> = {
      isReconciled: true,
      reconciledAt: new Date(),
    };
    try {
      await prisma.bankStatement.update({
        where: { id: bankStatementId },
        data: { ...ignoreData, reconciledType: "IGNORED" },
      });
    } catch {
      // reconciledType column may not exist yet
      await prisma.bankStatement.update({
        where: { id: bankStatementId },
        data: ignoreData,
      });
    }
    return Response.json({ success: true });
  }

  return Response.json({ error: "Azione non valida" }, { status: 400 });
}
