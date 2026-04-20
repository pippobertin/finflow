import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * POST: freeze (confirm) a period — sets is_frozen=true on all records in range.
 * DELETE: unfreeze (unlock) a period — sets is_frozen=false on all records in range.
 *
 * Ref: docs/adr/005-data-freezing-strategy.md
 */

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, snapshotId } = await params;

  // Verify org ownership
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  // Get snapshot period
  const snapshot = await prisma.trialBalanceSnapshot.findFirst({
    where: { id: snapshotId, organizationId: id },
    select: { id: true, periodStart: true, periodEnd: true, isLocked: true },
  });
  if (!snapshot) {
    return Response.json({ error: "Snapshot non trovato" }, { status: 404 });
  }
  if (snapshot.isLocked) {
    return Response.json({ error: "Periodo gia' confermato" }, { status: 409 });
  }

  // Freeze all records in the period + lock snapshot
  const counts = await freezePeriod(id, snapshot.periodStart, snapshot.periodEnd, snapshotId, true);

  return Response.json({
    success: true,
    frozen: counts,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, snapshotId } = await params;

  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: { id: true },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const snapshot = await prisma.trialBalanceSnapshot.findFirst({
    where: { id: snapshotId, organizationId: id },
    select: { id: true, periodStart: true, periodEnd: true, isLocked: true },
  });
  if (!snapshot) {
    return Response.json({ error: "Snapshot non trovato" }, { status: 404 });
  }
  if (!snapshot.isLocked) {
    return Response.json({ error: "Periodo non e' confermato" }, { status: 409 });
  }

  // Unfreeze all records in the period + unlock snapshot
  const counts = await freezePeriod(
    id,
    snapshot.periodStart,
    snapshot.periodEnd,
    snapshotId,
    false,
  );

  return Response.json({
    success: true,
    unfrozen: counts,
  });
}

async function freezePeriod(
  organizationId: string,
  periodStart: Date,
  periodEnd: Date,
  snapshotId: string,
  freeze: boolean,
) {
  const dateRange = { gte: periodStart, lte: periodEnd };
  const isFrozen = freeze;

  const [invoices, bankStatements, recurringExpenses, oneOffExpenses] = await prisma.$transaction([
    prisma.invoice.updateMany({
      where: { organizationId, date: dateRange },
      data: { isFrozen },
    }),
    prisma.bankStatement.updateMany({
      where: { organizationId, date: dateRange },
      data: { isFrozen },
    }),
    prisma.recurringExpense.updateMany({
      where: {
        organizationId,
        startDate: { lte: periodEnd },
        OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
      },
      data: { isFrozen },
    }),
    prisma.oneOffExpense.updateMany({
      where: { organizationId, date: dateRange },
      data: { isFrozen },
    }),
    prisma.trialBalanceSnapshot.update({
      where: { id: snapshotId },
      data: { isLocked: freeze },
    }),
  ]);

  return {
    invoices: invoices.count,
    bankStatements: bankStatements.count,
    recurringExpenses: recurringExpenses.count,
    oneOffExpenses: oneOffExpenses.count,
  };
}
