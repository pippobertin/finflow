import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { format, startOfDay } from "date-fns";
import { generateVatPeriods, calculateVatForYear, type VatPeriodicity } from "@/lib/vat/vat-engine";

interface MonthlyRow {
  name: string;
  type:
    | "saldoRiportato"
    | "bankInflow"
    | "bankOutflow"
    | "revenue"
    | "cost"
    | "recurring"
    | "vat"
    | "total"
    | "cumulative"
    | "futureReceivable"
    | "expectedPayable";
  color?: string;
  months: number[];
  total: number;
}

interface CellDetail {
  id: string;
  label: string;
  amount: number;
  type: string;
  date: string;
  status?: string;
  isReconciled?: boolean;
}

export async function GET(request: NextRequest) {
  const { error, session, organizationId } = await getAuthSession();
  if (error) return error;
  if (session.user.userType === "CLIENT_ADMIN_BANK_ONLY") {
    return Response.json({ error: "Accesso riservato al titolare" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const year = parseInt(sp.get("year") ?? String(new Date().getFullYear()));
  const today = startOfDay(new Date());
  const isCurrentYear = today.getFullYear() === year;

  // Fetch all data for the year
  const [
    invoices,
    recurringExpenses,
    oneOffExpenses,
    org,
    bankStatementsForYear,
    futureReceivables,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        organizationId,
        OR: [
          { date: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) } },
          { paidAt: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) } },
          { dueDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) } },
        ],
      },
      select: {
        id: true,
        number: true,
        direction: true,
        grossAmount: true,
        vatAmount: true,
        date: true,
        dueDate: true,
        status: true,
        paidAt: true,
      },
    }),
    prisma.recurringExpense.findMany({
      where: {
        organizationId,
        startDate: { lte: new Date(year, 11, 31) },
        OR: [{ endDate: null }, { endDate: { gte: new Date(year, 0, 1) } }],
      },
      select: {
        id: true,
        name: true,
        amount: true,
        frequency: true,
        startDate: true,
        endDate: true,
        costCenterId: true,
      },
    }),
    prisma.oneOffExpense.findMany({
      where: {
        organizationId,
        date: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      select: { id: true, name: true, amount: true, date: true, isPaid: true, costCenterId: true },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    }),
    prisma.bankStatement.findMany({
      where: {
        organizationId,
        date: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        description: true,
        amount: true,
        balance: true,
        isReconciled: true,
      },
    }),
    prisma.futureReceivable.findMany({
      where: {
        organizationId,
        status: "PENDING",
        includeInForecast: true,
        expectedPaymentDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      select: {
        id: true,
        description: true,
        counterpart: true,
        estimatedAmount: true,
        expectedPaymentDate: true,
      },
    }),
  ]);

  // ── Expected payables (table may not exist) ──
  let expectedPayables: Array<{
    id: string;
    description: string;
    counterpart: string;
    amount: unknown;
    frequency: string;
    dayOfMonth: number | null;
    startDate: Date;
    endDate: Date | null;
    costCenterId: string | null;
  }> = [];
  try {
    expectedPayables = await prisma.expectedPayable.findMany({
      where: {
        organizationId,
        status: "ACTIVE",
        includeInForecast: true,
        startDate: { lte: new Date(year, 11, 31) },
        OR: [{ endDate: null }, { endDate: { gte: new Date(year, 0, 1) } }],
      },
      select: {
        id: true,
        description: true,
        counterpart: true,
        amount: true,
        frequency: true,
        dayOfMonth: true,
        startDate: true,
        endDate: true,
        costCenterId: true,
      },
    });
  } catch {
    // table may not exist yet
  }

  const settings = (org?.settings as Record<string, unknown>) ?? {};
  const manualBalance =
    typeof settings.currentBalance === "number" ? settings.currentBalance : null;

  // ── Determine bank data availability ──
  const hasBankDataForYear = bankStatementsForYear.length > 0;

  // Group bank statements by month
  const bankByMonth: Map<number, typeof bankStatementsForYear> = new Map();
  for (const bs of bankStatementsForYear) {
    const m = new Date(bs.date).getMonth();
    if (!bankByMonth.has(m)) bankByMonth.set(m, []);
    bankByMonth.get(m)!.push(bs);
  }

  // lastActualMonth = last month with at least one bank transaction
  let lastActualMonth = -1;
  if (hasBankDataForYear) {
    for (const [m] of bankByMonth) {
      if (m > lastActualMonth) lastActualMonth = m;
    }
  }

  // monthDataSource: "bank" for actual months, "projection" for forecast
  const monthDataSource: string[] = Array.from({ length: 12 }, (_, m) =>
    m <= lastActualMonth ? "bank" : "projection",
  );

  // ── Calculate year opening balance ──
  let yearOpeningBalance = 0;
  let usedBalanceSnapshot = false;

  try {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { organizationId, isDefault: true },
      select: { id: true },
    });
    if (bankAccount) {
      const prevYearEnd = new Date(year - 1, 11, 31);

      const ecSnapshot = await prisma.balanceSnapshot.findFirst({
        where: {
          bankAccountId: bankAccount.id,
          source: "EC_QUARTERLY",
          date: { lte: prevYearEnd },
        },
        orderBy: { date: "desc" },
        select: { balance: true },
      });
      if (ecSnapshot) {
        yearOpeningBalance = Number(ecSnapshot.balance);
        usedBalanceSnapshot = true;
      } else {
        const anySnapshot = await prisma.balanceSnapshot.findFirst({
          where: {
            bankAccountId: bankAccount.id,
            date: { lte: prevYearEnd },
          },
          orderBy: { date: "desc" },
          select: { balance: true },
        });
        if (anySnapshot) {
          yearOpeningBalance = Number(anySnapshot.balance);
          usedBalanceSnapshot = true;
        }
      }
    }
  } catch {
    // BalanceSnapshot table may not exist
  }

  if (!usedBalanceSnapshot) {
    if (manualBalance !== null) {
      yearOpeningBalance = manualBalance;
    } else if (hasBankDataForYear) {
      const firstTx = bankStatementsForYear[0];
      yearOpeningBalance = Number(firstTx.balance) - Number(firstTx.amount);
    }
  }

  // ── Build per-cell detail map ──
  const detailMap: Record<string, Record<number, CellDetail[]>> = {};
  const rows: MonthlyRow[] = [];

  function pushDetail(rowName: string, month: number, detail: CellDetail) {
    if (!detailMap[rowName]) detailMap[rowName] = {};
    if (!detailMap[rowName][month]) detailMap[rowName][month] = [];
    detailMap[rowName][month].push(detail);
  }

  // Effective cash date for an invoice: paidAt > dueDate > date
  type InvoiceForCashDate = {
    paidAt: Date | null;
    dueDate: Date | null;
    date: Date;
    status: string;
  };

  function getInvoiceCashDate(inv: InvoiceForCashDate): Date {
    if (inv.paidAt) return new Date(inv.paidAt);
    if (inv.dueDate) return new Date(inv.dueDate);
    return new Date(inv.date);
  }

  const isPaidStatus = (s: string) => s === "PAID";
  const firstProjectionMonth = lastActualMonth + 1;

  function getInvoiceCashMonth(inv: InvoiceForCashDate): number | null {
    const cashDate = getInvoiceCashDate(inv);

    if (isPaidStatus(inv.status) && inv.paidAt) {
      if (new Date(inv.paidAt).getFullYear() !== year) return null;
      return new Date(inv.paidAt).getMonth();
    }

    let m = cashDate.getFullYear() === year ? cashDate.getMonth() : null;

    if (m !== null && m <= lastActualMonth) {
      if (firstProjectionMonth > 11) return null;
      m = firstProjectionMonth;
    }

    if (m === null && cashDate.getFullYear() < year && firstProjectionMonth <= 11) {
      m = firstProjectionMonth;
    }

    return m;
  }

  // ── Bank inflows & outflows ──
  const bankInflowName = "Entrate bancarie";
  const bankOutflowName = "Uscite bancarie";
  const bankInflowMonths = Array(12).fill(0);
  const bankOutflowMonths = Array(12).fill(0);

  for (const bs of bankStatementsForYear) {
    const m = new Date(bs.date).getMonth();
    const amt = Number(bs.amount);
    const detail: CellDetail = {
      id: bs.id,
      label: bs.description.length > 60 ? bs.description.slice(0, 57) + "..." : bs.description,
      amount: Math.abs(amt),
      type: "bankTransaction",
      date: format(new Date(bs.date), "yyyy-MM-dd"),
      isReconciled: bs.isReconciled,
      status: bs.isReconciled ? "RECONCILED" : undefined,
    };
    if (amt >= 0) {
      bankInflowMonths[m] += amt;
      pushDetail(bankInflowName, m, detail);
    } else {
      bankOutflowMonths[m] += Math.abs(amt);
      pushDetail(bankOutflowName, m, detail);
    }
  }

  // ── Revenue (ACTIVE invoices) — placed by cash date ──
  const revenueRowName = "Fatture attive";
  const revenueMonths = Array.from({ length: 12 }, (_, m) => {
    const matching = invoices.filter(
      (inv: (typeof invoices)[number]) =>
        inv.direction === "ACTIVE" && getInvoiceCashMonth(inv) === m,
    );
    for (const inv of matching) {
      const cashDate = getInvoiceCashDate(inv);
      pushDetail(revenueRowName, m, {
        id: inv.id,
        label: `Fatt. ${inv.number}`,
        amount: Number(inv.grossAmount),
        type: "activeInvoice",
        date: format(cashDate, "yyyy-MM-dd"),
        status: inv.status,
      });
    }
    return matching.reduce(
      (sum: number, inv: (typeof matching)[number]) => sum + Number(inv.grossAmount),
      0,
    );
  });

  // ── Cost (PASSIVE invoices) ──
  const costInvRowName = "Fatture passive";
  const costInvMonths = Array.from({ length: 12 }, (_, m) => {
    const matching = invoices.filter(
      (inv: (typeof invoices)[number]) =>
        inv.direction === "PASSIVE" && getInvoiceCashMonth(inv) === m,
    );
    for (const inv of matching) {
      const cashDate = getInvoiceCashDate(inv);
      pushDetail(costInvRowName, m, {
        id: inv.id,
        label: `Fatt. ${inv.number}`,
        amount: Number(inv.grossAmount),
        type: "passiveInvoice",
        date: format(cashDate, "yyyy-MM-dd"),
        status: inv.status,
      });
    }
    return matching.reduce(
      (sum: number, inv: (typeof matching)[number]) => sum + Number(inv.grossAmount),
      0,
    );
  });

  // ── Recurring expenses (with cost center grouping) ──
  // Helper: check if a recurring expense applies to month m
  function recurringApplies(
    exp: { frequency: string; startDate: Date | string; endDate: Date | string | null },
    m: number,
  ) {
    const amount_startMonth = new Date(exp.startDate).getMonth();
    const amount_startYear = new Date(exp.startDate).getFullYear();
    const amount_endMonth = exp.endDate ? new Date(exp.endDate).getMonth() : 11;
    const amount_endYear = exp.endDate ? new Date(exp.endDate).getFullYear() : year;
    const inRange =
      (amount_startYear < year || (amount_startYear === year && amount_startMonth <= m)) &&
      (amount_endYear > year || (amount_endYear === year && amount_endMonth >= m));
    if (!inRange) return false;
    if (exp.frequency === "MONTHLY") return true;
    if (exp.frequency === "QUARTERLY" && m % 3 === amount_startMonth % 3) return true;
    if (exp.frequency === "ANNUAL" && m === amount_startMonth) return true;
    return false;
  }

  const recurringRowName = "Spese ricorrenti";
  const recurringMonths = Array.from({ length: 12 }, (_, m) => {
    if (monthDataSource[m] === "bank") return 0;
    let total = 0;
    for (const exp of recurringExpenses) {
      if (!recurringApplies(exp, m)) continue;
      const amount = Number(exp.amount);
      total += amount;
      pushDetail(recurringRowName, m, {
        id: exp.id,
        label: exp.name,
        amount,
        type: "recurringExpense",
        date: format(new Date(year, m, 1), "yyyy-MM-dd"),
      });
    }
    return total;
  });

  // ── One-off expenses ──
  const oneOffRowName = "Spese una tantum";
  const oneOffMonths = Array.from({ length: 12 }, (_, m) => {
    const matching = oneOffExpenses.filter(
      (exp) => new Date(exp.date).getMonth() === m && (monthDataSource[m] !== "bank" || exp.isPaid),
    );
    for (const exp of matching) {
      pushDetail(oneOffRowName, m, {
        id: exp.id,
        label: exp.name,
        amount: Number(exp.amount),
        type: "oneOffExpense",
        date: format(new Date(exp.date), "yyyy-MM-dd"),
        status: exp.isPaid ? "PAID" : "PENDING",
      });
    }
    return matching.reduce(
      (sum: number, exp: (typeof matching)[number]) => sum + Number(exp.amount),
      0,
    );
  });

  // ── Expected payables ──
  const epRowName = "Fatture passive attese";
  const epMonths = Array.from({ length: 12 }, () => 0);
  for (const ep of expectedPayables) {
    const amt = Number(ep.amount);
    if (amt <= 0) continue;

    const startMonth = new Date(ep.startDate).getMonth();
    const startYear = new Date(ep.startDate).getFullYear();
    const endMonth = ep.endDate ? new Date(ep.endDate).getMonth() : 11;
    const endYear = ep.endDate ? new Date(ep.endDate).getFullYear() : year;

    for (let m = 0; m < 12; m++) {
      if (monthDataSource[m] === "bank") continue;

      const inRange =
        (startYear < year || (startYear === year && startMonth <= m)) &&
        (endYear > year || (endYear === year && endMonth >= m));
      if (!inRange) continue;

      let applies = false;
      if (ep.frequency === "MONTHLY") applies = true;
      else if (ep.frequency === "QUARTERLY" && m % 3 === startMonth % 3) applies = true;
      else if (ep.frequency === "ANNUAL" && m === startMonth) applies = true;
      else if (!ep.frequency) applies = true;

      if (applies) {
        epMonths[m] += amt;
        pushDetail(epRowName, m, {
          id: ep.id,
          label: ep.description,
          amount: amt,
          type: "expectedPayable",
          date: format(new Date(year, m, ep.dayOfMonth ?? 1), "yyyy-MM-dd"),
          status: "ACTIVE",
        });
      }
    }
  }

  // ── IVA row ──
  const vatPeriodicity = (settings.vatPeriodicity as VatPeriodicity) ?? "quarterly";
  const vatPeriods = generateVatPeriods(year, vatPeriodicity);
  const vatInvoices = invoices.map((inv: (typeof invoices)[number]) => ({
    direction: inv.direction,
    vatAmount: Number(inv.vatAmount),
    date: new Date(inv.date),
  }));
  const vatCalcs = calculateVatForYear(vatPeriods, vatInvoices);
  const vatRowName = "IVA";
  const vatMonths = Array.from({ length: 12 }, (_, m) => {
    if (monthDataSource[m] === "bank") return 0;
    const matching = vatCalcs.filter(
      (c) =>
        c.amountDue > 0 &&
        c.period.dueDate.getMonth() === m &&
        c.period.dueDate.getFullYear() === year,
    );
    for (const c of matching) {
      pushDetail(vatRowName, m, {
        id: `vat-${format(c.period.periodStart, "yyyy-MM")}`,
        label: c.period.label,
        amount: c.amountDue,
        type: "vatPayment",
        date: format(c.period.dueDate, "yyyy-MM-dd"),
      });
    }
    return matching.reduce((sum: number, c: (typeof matching)[number]) => sum + c.amountDue, 0);
  });

  // ── Compute totals ──
  const totalRevenueMonths = revenueMonths;
  const totalCostMonths = Array.from({ length: 12 }, (_, m) => {
    return costInvMonths[m] + recurringMonths[m] + oneOffMonths[m] + epMonths[m] + vatMonths[m];
  });

  const effectiveInflowMonths = Array.from({ length: 12 }, (_, m) =>
    monthDataSource[m] === "bank" ? bankInflowMonths[m] : totalRevenueMonths[m],
  );
  const effectiveOutflowMonths = Array.from({ length: 12 }, (_, m) =>
    monthDataSource[m] === "bank" ? bankOutflowMonths[m] : totalCostMonths[m],
  );

  // ── Future receivables ──
  const frMonths = Array.from({ length: 12 }, (_, m) => {
    const matching = (futureReceivables ?? []).filter(
      (fr) => fr.expectedPaymentDate && new Date(fr.expectedPaymentDate).getMonth() === m,
    );
    return matching.reduce(
      (sum: number, fr: (typeof matching)[number]) => sum + Number(fr.estimatedAmount),
      0,
    );
  });
  const frEffective = frMonths.map((v, m) => (monthDataSource[m] === "projection" ? v : 0));
  const effectiveInflowWithFr = effectiveInflowMonths.map((v, m) => v + frEffective[m]);

  // ── Build cascading SALDO RIPORTATO ──
  const saldoRiportatoMonths = Array(12).fill(0);
  saldoRiportatoMonths[0] = yearOpeningBalance;
  for (let m = 1; m < 12; m++) {
    saldoRiportatoMonths[m] =
      saldoRiportatoMonths[m - 1] + effectiveInflowWithFr[m - 1] - effectiveOutflowMonths[m - 1];
  }

  const monthlyBalance = Array.from(
    { length: 12 },
    (_, m) => effectiveInflowWithFr[m] - effectiveOutflowMonths[m],
  );
  const cumulativeMonths = Array.from(
    { length: 12 },
    (_, m) => saldoRiportatoMonths[m] + monthlyBalance[m],
  );

  // ── Assemble rows ──

  rows.push({
    name: "SALDO RIPORTATO",
    type: "saldoRiportato",
    months: saldoRiportatoMonths,
    total: saldoRiportatoMonths[0],
  });

  rows.push({
    name: bankInflowName,
    type: "bankInflow",
    months: bankInflowMonths,
    total: bankInflowMonths.reduce((a: number, b: number) => a + b, 0),
  });

  rows.push({
    name: revenueRowName,
    type: "revenue",
    months: revenueMonths,
    total: revenueMonths.reduce((a: number, b: number) => a + b, 0),
  });

  // Future receivables
  const frRowName = "Incassi futuri";
  for (let m = 0; m < 12; m++) {
    const matching = (futureReceivables ?? []).filter(
      (fr) => fr.expectedPaymentDate && new Date(fr.expectedPaymentDate).getMonth() === m,
    );
    for (const fr of matching) {
      pushDetail(frRowName, m, {
        id: fr.id,
        label: fr.description + (fr.counterpart ? ` (${fr.counterpart})` : ""),
        amount: Number(fr.estimatedAmount),
        type: "futureReceivable",
        date: fr.expectedPaymentDate ? format(new Date(fr.expectedPaymentDate), "yyyy-MM-dd") : "",
        status: "PENDING",
      });
    }
  }
  if (frMonths.some((v) => v > 0)) {
    rows.push({
      name: frRowName,
      type: "futureReceivable",
      months: frMonths,
      total: frMonths.reduce((a: number, b: number) => a + b, 0),
    });
  }

  rows.push({
    name: "TOTALE ENTRATE",
    type: "total",
    months: effectiveInflowWithFr,
    total: effectiveInflowWithFr.reduce((a: number, b: number) => a + b, 0),
  });

  rows.push({
    name: bankOutflowName,
    type: "bankOutflow",
    months: bankOutflowMonths,
    total: bankOutflowMonths.reduce((a: number, b: number) => a + b, 0),
  });

  rows.push({
    name: costInvRowName,
    type: "cost",
    months: costInvMonths,
    total: costInvMonths.reduce((a: number, b: number) => a + b, 0),
  });

  rows.push({
    name: recurringRowName,
    type: "recurring",
    months: recurringMonths,
    total: recurringMonths.reduce((a: number, b: number) => a + b, 0),
  });

  if (oneOffMonths.some((v) => v > 0)) {
    rows.push({
      name: oneOffRowName,
      type: "cost",
      months: oneOffMonths,
      total: oneOffMonths.reduce((a: number, b: number) => a + b, 0),
    });
  }

  if (epMonths.some((v) => v > 0)) {
    rows.push({
      name: epRowName,
      type: "expectedPayable",
      months: epMonths,
      total: epMonths.reduce((a: number, b: number) => a + b, 0),
    });
  }

  rows.push({
    name: vatRowName,
    type: "vat",
    months: vatMonths,
    total: vatMonths.reduce((a: number, b: number) => a + b, 0),
  });

  rows.push({
    name: "TOTALE USCITE",
    type: "total",
    months: effectiveOutflowMonths,
    total: effectiveOutflowMonths.reduce((a: number, b: number) => a + b, 0),
  });

  rows.push({
    name: "SALDO MESE",
    type: "total",
    months: monthlyBalance,
    total: monthlyBalance.reduce((a: number, b: number) => a + b, 0),
  });

  rows.push({
    name: "SALDO CUMULATO",
    type: "cumulative",
    months: cumulativeMonths,
    total: cumulativeMonths[11],
  });

  const currentMonth = today.getMonth();

  return Response.json({
    year,
    rows,
    detailMap,
    currentMonth: isCurrentYear ? currentMonth : -1,
    startingBalance: yearOpeningBalance,
    lastActualMonth,
    monthDataSource,
    hasBankDataForYear,
  });
}
