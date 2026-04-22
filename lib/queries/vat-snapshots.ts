import { prisma } from "@/lib/prisma";
import {
  generateVatPeriods,
  calculateVatForYear,
  normalizeV2VatSources,
  type VatPeriodicity,
} from "@/lib/vat/vat-engine";

/**
 * Get VAT snapshots for a given org + year.
 * If none exist yet, calculate from invoices and persist.
 */
export async function getVatSnapshots(organizationId: string, year: number) {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  try {
    const existing = await prisma.vatSnapshot.findMany({
      where: {
        organizationId,
        periodStart: { gte: yearStart },
        periodEnd: { lte: yearEnd },
      },
      orderBy: { periodStart: "asc" },
    });

    if (existing.length > 0) {
      return existing.map(serializeSnapshot);
    }
  } catch {
    // Table may not exist yet — fall through to calculate
  }

  // No snapshots yet — calculate and persist
  return recalculateVatSnapshots(organizationId, year);
}

/**
 * Delete existing snapshots for the year, recalculate from invoices, and persist.
 */
export async function recalculateVatSnapshots(organizationId: string, year: number) {
  // Read organization settings for periodicity
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true },
  });
  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const periodicity = (settings.vatPeriodicity as VatPeriodicity) ?? "quarterly";

  // Get invoices for the year
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      date: { gte: yearStart, lte: yearEnd },
    },
    select: {
      direction: true,
      vatAmount: true,
      date: true,
    },
  });

  const invoiceData = invoices.map((inv) => ({
    direction: inv.direction,
    vatAmount: Number(inv.vatAmount),
    date: inv.date,
  }));

  const vatCarryForward =
    typeof settings.vatCarryForward === "number" ? settings.vatCarryForward : 0;
  const periods = generateVatPeriods(year, periodicity);
  const calculations = calculateVatForYear(periods, invoiceData, vatCarryForward);

  // Delete old snapshots for this year
  try {
    await prisma.vatSnapshot.deleteMany({
      where: {
        organizationId,
        periodStart: { gte: yearStart },
        periodEnd: { lte: yearEnd },
      },
    });
  } catch {
    // Table may not exist yet
  }

  // Persist new snapshots
  const snapshots = [];
  try {
    for (const calc of calculations) {
      const snapshot = await prisma.vatSnapshot.create({
        data: {
          organizationId,
          periodStart: calc.period.periodStart,
          periodEnd: calc.period.periodEnd,
          periodType: calc.period.periodType,
          vatDebit: calc.vatDebit,
          vatCredit: calc.vatCredit,
          vatBalance: calc.vatBalance,
          carryForward: calc.carryForward,
          amountDue: calc.amountDue,
          dueDate: calc.period.dueDate,
          isPaid: false,
          sourceType: "invoice",
          label: calc.period.label,
          surchargeAmount: calc.surchargeAmount,
          creditCarriedOut: calc.creditCarriedOut,
        },
      });
      snapshots.push(serializeSnapshot(snapshot));
    }
  } catch {
    // Table doesn't exist — return calculations as non-persisted data
    return calculations.map((calc) => ({
      id: `calc-${calc.period.label}`,
      organizationId,
      periodStart: calc.period.periodStart.toISOString(),
      periodEnd: calc.period.periodEnd.toISOString(),
      periodType: calc.period.periodType,
      vatDebit: calc.vatDebit,
      vatCredit: calc.vatCredit,
      vatBalance: calc.vatBalance,
      carryForward: calc.carryForward,
      amountDue: calc.amountDue,
      surchargeAmount: calc.surchargeAmount,
      creditCarriedOut: calc.creditCarriedOut,
      dueDate: calc.period.dueDate.toISOString(),
      isPaid: false,
      paidDate: null,
      label: calc.period.label,
      surchargeRate: calc.period.surchargeRate,
    }));
  }

  return snapshots;
}

/**
 * Toggle paid status of a single snapshot.
 */
export async function toggleVatPaid(id: string, isPaid: boolean, paidDate: string | null) {
  const updated = await prisma.vatSnapshot.update({
    where: { id },
    data: {
      isPaid,
      paidDate: paidDate ? new Date(paidDate) : null,
    },
  });
  return serializeSnapshot(updated);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeSnapshot(s: any) {
  return {
    id: s.id,
    organizationId: s.organizationId,
    periodStart: s.periodStart instanceof Date ? s.periodStart.toISOString() : s.periodStart,
    periodEnd: s.periodEnd instanceof Date ? s.periodEnd.toISOString() : s.periodEnd,
    periodType: s.periodType,
    vatDebit: Number(s.vatDebit),
    vatCredit: Number(s.vatCredit),
    vatBalance: Number(s.vatBalance),
    carryForward: Number(s.carryForward),
    amountDue: Number(s.amountDue),
    dueDate: s.dueDate instanceof Date ? s.dueDate.toISOString() : s.dueDate,
    isPaid: s.isPaid,
    paidDate: s.paidDate instanceof Date ? s.paidDate.toISOString() : s.paidDate,
    sourceType: s.sourceType ?? "invoice",
    label: s.label ?? null,
    surchargeAmount: Number(s.surchargeAmount ?? 0),
    creditCarriedOut: Number(s.creditCarriedOut ?? 0),
  };
}

/**
 * V2 recalculate: uses both invoices AND bank statements with vatAmount.
 * Produces "v2" source type snapshots.
 */
export async function recalculateVatSnapshotsV2(organizationId: string, year: number) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true, cdgGranularity: true },
  });
  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const periodicity: VatPeriodicity = org?.cdgGranularity === "QUARTERLY" ? "quarterly" : "monthly";

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  // Fetch invoices
  const invoices = await prisma.invoice.findMany({
    where: { organizationId, date: { gte: yearStart, lte: yearEnd } },
    select: { direction: true, vatAmount: true, date: true },
  });

  // Fetch bank statements with vatAmount
  const bankStatements = await prisma.bankStatement.findMany({
    where: {
      organizationId,
      date: { gte: yearStart, lte: yearEnd },
      vatAmount: { not: null },
    },
    select: { date: true, vatAmount: true, cdgCategory: true },
  });

  // Normalize to unified format
  const normalizedSources = normalizeV2VatSources(
    bankStatements.map((bs) => ({
      date: bs.date,
      vatAmount: Number(bs.vatAmount),
      cdgCategory: bs.cdgCategory,
    })),
    invoices.map((inv) => ({
      direction: inv.direction,
      vatAmount: Number(inv.vatAmount),
      date: inv.date,
    })),
  );

  const vatCarryForward =
    typeof settings.vatCarryForward === "number" ? settings.vatCarryForward : 0;
  const periods = generateVatPeriods(year, periodicity);
  const calculations = calculateVatForYear(periods, normalizedSources, vatCarryForward);

  // Delete old snapshots
  try {
    await prisma.vatSnapshot.deleteMany({
      where: {
        organizationId,
        periodStart: { gte: yearStart },
        periodEnd: { lte: yearEnd },
      },
    });
  } catch {
    // Table may not exist
  }

  // Persist new snapshots
  const snapshots = [];
  try {
    for (const calc of calculations) {
      const snapshot = await prisma.vatSnapshot.create({
        data: {
          organizationId,
          periodStart: calc.period.periodStart,
          periodEnd: calc.period.periodEnd,
          periodType: calc.period.periodType,
          vatDebit: calc.vatDebit,
          vatCredit: calc.vatCredit,
          vatBalance: calc.vatBalance,
          carryForward: calc.carryForward,
          amountDue: calc.amountDue,
          dueDate: calc.period.dueDate,
          isPaid: false,
          sourceType: "v2",
          label: calc.period.label,
          surchargeAmount: calc.surchargeAmount,
          creditCarriedOut: calc.creditCarriedOut,
        },
      });
      snapshots.push(serializeSnapshot(snapshot));
    }
  } catch {
    // Table doesn't exist — return calculations
    return calculations.map((calc) => ({
      id: `calc-${calc.period.label}`,
      organizationId,
      periodStart: calc.period.periodStart.toISOString(),
      periodEnd: calc.period.periodEnd.toISOString(),
      periodType: calc.period.periodType,
      vatDebit: calc.vatDebit,
      vatCredit: calc.vatCredit,
      vatBalance: calc.vatBalance,
      carryForward: calc.carryForward,
      amountDue: calc.amountDue,
      surchargeAmount: calc.surchargeAmount,
      creditCarriedOut: calc.creditCarriedOut,
      dueDate: calc.period.dueDate.toISOString(),
      isPaid: false,
      paidDate: null,
      label: calc.period.label,
      sourceType: "v2",
    }));
  }

  return snapshots;
}
