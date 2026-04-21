// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy reconciliation API, behind LEGACY_RECONCILIATION flag. Will be removed in Block D.
import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { FEATURES } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import {
  findMatchesEnhanced,
  confirmMatchesEnhanced,
} from "@/lib/reconciliation/reconciliation-engine";

// GET: Fetch reconciliation data (unreconciled movements, suggestions, unmatched invoices)
export async function GET() {
  if (!FEATURES.LEGACY_RECONCILIATION) return new Response(null, { status: 404 });

  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const [unreconciledMovements, suggestions, rawUnmatchedInvoices] = await Promise.all([
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

  // Filter out invoices that appear in reconciledInvoiceIds (multi-match array)
  let unmatchedInvoices = rawUnmatchedInvoices;
  try {
    const reconciledWithArray = await prisma.bankStatement.findMany({
      where: { organizationId, isReconciled: true, reconciledInvoiceIds: { isEmpty: false } },
      select: { reconciledInvoiceIds: true },
    });
    const usedIds = new Set(reconciledWithArray.flatMap((bs) => bs.reconciledInvoiceIds));
    if (usedIds.size > 0) {
      unmatchedInvoices = rawUnmatchedInvoices.filter((inv) => !usedIds.has(inv.id));
    }
  } catch {
    // reconciledInvoiceIds column may not exist yet
  }

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
  if (!FEATURES.LEGACY_RECONCILIATION) return new Response(null, { status: 404 });

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
      const updateData: Record<string, unknown> = {
        isReconciled: true,
        reconciledInvoiceId: invoiceIds[0],
        reconciledAt: new Date(),
      };
      try {
        await tx.bankStatement.update({
          where: { id: bankStatementId },
          data: { ...updateData, reconciledInvoiceIds: invoiceIds, reconciledType: "INVOICE" },
        });
      } catch {
        // reconciledInvoiceIds / reconciledType columns may not exist yet
        await tx.bankStatement.update({
          where: { id: bankStatementId },
          data: updateData,
        });
      }

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

  if (action === "dismiss") {
    // Persist rejected suggestion so it won't reappear
    const { dismissals } = body as {
      dismissals: Array<{
        bankStatementId: string;
        targetId: string;
        targetType: string; // INVOICE, EXPENSE, EXPECTED_PAYABLE
      }>;
    };
    if (!dismissals?.length) {
      return Response.json({ error: "Nessun rifiuto specificato" }, { status: 400 });
    }

    try {
      await prisma.dismissedMatch.createMany({
        data: dismissals.map((d) => ({
          organizationId,
          bankStatementId: d.bankStatementId,
          targetId: d.targetId,
          targetType: d.targetType,
        })),
        skipDuplicates: true,
      });
    } catch {
      // Table may not exist yet — try to auto-create it
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS public.fin_dismissed_match (
            id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            organization_id   TEXT NOT NULL REFERENCES public.fin_organization(id) ON DELETE CASCADE,
            bank_statement_id TEXT NOT NULL REFERENCES public.fin_bank_statement(id) ON DELETE CASCADE,
            target_id         TEXT NOT NULL,
            target_type       TEXT NOT NULL,
            created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
          );
          CREATE UNIQUE INDEX IF NOT EXISTS uq_dismissed_match
            ON public.fin_dismissed_match(bank_statement_id, target_id, target_type);
          CREATE INDEX IF NOT EXISTS idx_dismissed_match_org_bs
            ON public.fin_dismissed_match(organization_id, bank_statement_id);
        `);
        // Retry the insert
        await prisma.dismissedMatch.createMany({
          data: dismissals.map((d) => ({
            organizationId,
            bankStatementId: d.bankStatementId,
            targetId: d.targetId,
            targetType: d.targetType,
          })),
          skipDuplicates: true,
        });
      } catch (retryErr) {
        console.error("[reconciliation] dismiss: could not create table or insert:", retryErr);
      }
    }
    return Response.json({ dismissed: dismissals.length });
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

  if (action === "unreconcile") {
    // Reset a reconciled bank statement back to unreconciled
    const bs = await prisma.bankStatement.findFirst({
      where: { id: bankStatementId, organizationId, isReconciled: true },
    });
    if (!bs) return Response.json({ error: "Movimento non trovato" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Reset the bank statement
      const resetData: Record<string, unknown> = {
        isReconciled: false,
        reconciledInvoiceId: null,
        reconciledAt: null,
      };
      try {
        await tx.bankStatement.update({
          where: { id: bankStatementId },
          data: {
            ...resetData,
            reconciledInvoiceIds: [],
            reconciledType: null,
            reconciledExpenseId: null,
          },
        });
      } catch {
        await tx.bankStatement.update({
          where: { id: bankStatementId },
          data: resetData,
        });
      }

      // Revert linked invoices back to PENDING
      // Check both the single FK and the array field
      const invoiceIdsToReset: string[] = [];
      if (bs.reconciledInvoiceId) invoiceIdsToReset.push(bs.reconciledInvoiceId);
      try {
        const bsFull = await tx.bankStatement.findUnique({
          where: { id: bankStatementId },
          select: { reconciledInvoiceIds: true },
        });
        if (bsFull?.reconciledInvoiceIds) {
          for (const id of bsFull.reconciledInvoiceIds) {
            if (!invoiceIdsToReset.includes(id)) invoiceIdsToReset.push(id);
          }
        }
      } catch {
        // column may not exist
      }

      if (invoiceIdsToReset.length > 0) {
        await tx.invoice.updateMany({
          where: { id: { in: invoiceIdsToReset }, organizationId },
          data: { status: "PENDING", paidAt: null },
        });
      }
    });

    return Response.json({ success: true });
  }

  return Response.json({ error: "Azione non valida" }, { status: 400 });
}
