/**
 * Unit tests for lib/queries/cashflow-projection.ts (V2 rewrite)
 *
 * Pure helper tests (expandRecurring, expandPayable) run without mocks.
 * Integration tests (buildDailyProjection, getOpeningBalance) mock prisma.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { format, startOfDay, addDays } from "date-fns";

// ─── Mock prisma BEFORE any imports that use it ─────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    bankAccount: { findFirst: vi.fn() },
    balanceSnapshot: { findFirst: vi.fn() },
    bankStatement: { findMany: vi.fn(), findFirst: vi.fn() },
    organization: { findUnique: vi.fn() },
    invoice: { findMany: vi.fn() },
    recurringExpense: { findMany: vi.fn() },
    oneOffExpense: { findMany: vi.fn() },
    futureReceivable: { findMany: vi.fn() },
    expectedPayable: { findMany: vi.fn() },
    vatSnapshot: { findMany: vi.fn() },
  },
}));

// Import the module under test (prisma is already mocked)
import {
  expandRecurring,
  expandPayable,
  getOpeningBalance,
  buildDailyProjection,
} from "../cashflow-projection";
import { prisma } from "@/lib/prisma";

// Cast for mock access
const mockPrisma = vi.mocked(prisma, true);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function fmt(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function fmtAll(dates: Date[]): string[] {
  return dates.map(fmt);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Group 1: expandRecurring — pure function tests
// ═══════════════════════════════════════════════════════════════════════════════
describe("expandRecurring", () => {
  it("MONTHLY: generates monthly occurrences within range", () => {
    const dates = expandRecurring(
      d(2026, 1, 15),
      null,
      "MONTHLY",
      null,
      d(2026, 1, 1),
      d(2026, 4, 30),
    );
    expect(fmtAll(dates)).toEqual(["2026-01-15", "2026-02-15", "2026-03-15", "2026-04-15"]);
  });

  it("QUARTERLY: generates quarterly occurrences", () => {
    const dates = expandRecurring(
      d(2026, 1, 10),
      null,
      "QUARTERLY",
      null,
      d(2026, 1, 1),
      d(2026, 12, 31),
    );
    expect(fmtAll(dates)).toEqual(["2026-01-10", "2026-04-10", "2026-07-10", "2026-10-10"]);
  });

  it("ANNUAL: generates one occurrence per year", () => {
    const dates = expandRecurring(
      d(2025, 6, 1),
      null,
      "ANNUAL",
      null,
      d(2025, 1, 1),
      d(2027, 12, 31),
    );
    expect(fmtAll(dates)).toEqual(["2025-06-01", "2026-06-01", "2027-06-01"]);
  });

  it("CUSTOM: uses customDays interval", () => {
    const dates = expandRecurring(d(2026, 3, 1), null, "CUSTOM", 14, d(2026, 3, 1), d(2026, 4, 15));
    expect(fmtAll(dates)).toEqual(["2026-03-01", "2026-03-15", "2026-03-29", "2026-04-12"]);
  });

  it("respects endDate (stops at endDate)", () => {
    const dates = expandRecurring(
      d(2026, 1, 1),
      d(2026, 3, 1),
      "MONTHLY",
      null,
      d(2026, 1, 1),
      d(2026, 12, 31),
    );
    expect(fmtAll(dates)).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"]);
  });

  it("skips occurrences before rangeStart", () => {
    const dates = expandRecurring(
      d(2025, 6, 15),
      null,
      "MONTHLY",
      null,
      d(2026, 2, 1),
      d(2026, 5, 31),
    );
    expect(fmtAll(dates)).toEqual(["2026-02-15", "2026-03-15", "2026-04-15", "2026-05-15"]);
  });

  it("handles month-end clamping (Jan 31 → Feb 28)", () => {
    const dates = expandRecurring(
      d(2026, 1, 31),
      null,
      "MONTHLY",
      null,
      d(2026, 1, 1),
      d(2026, 4, 30),
    );
    expect(fmtAll(dates)).toEqual([
      "2026-01-31",
      "2026-02-28", // Feb has 28 days in 2026
      "2026-03-31", // back to 31 (targetDay preserved)
      "2026-04-30", // April has 30 days
    ]);
  });

  it("returns empty when startDate is after rangeEnd", () => {
    const dates = expandRecurring(
      d(2027, 1, 1),
      null,
      "MONTHLY",
      null,
      d(2026, 1, 1),
      d(2026, 12, 31),
    );
    expect(dates).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Group 2: expandPayable — pure function tests
// ═══════════════════════════════════════════════════════════════════════════════
describe("expandPayable", () => {
  it("QUARTERLY frequency", () => {
    const dates = expandPayable(
      d(2026, 1, 15),
      null,
      "QUARTERLY",
      null,
      d(2026, 1, 1),
      d(2026, 12, 31),
    );
    expect(fmtAll(dates)).toEqual(["2026-01-15", "2026-04-15", "2026-07-15", "2026-10-15"]);
  });

  it("ANNUAL frequency with endDate", () => {
    const dates = expandPayable(
      d(2026, 3, 1),
      d(2028, 12, 31),
      "ANNUAL",
      null,
      d(2026, 1, 1),
      d(2028, 12, 31),
    );
    expect(fmtAll(dates)).toEqual(["2026-03-01", "2027-03-01", "2028-03-01"]);
  });

  it("respects endDate cutoff", () => {
    const dates = expandPayable(
      d(2026, 1, 10),
      d(2026, 4, 1),
      "MONTHLY",
      null,
      d(2026, 1, 1),
      d(2026, 12, 31),
    );
    expect(fmtAll(dates)).toEqual(["2026-01-10", "2026-02-10", "2026-03-10"]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Group 3: getOpeningBalance — mocked prisma
// ═══════════════════════════════════════════════════════════════════════════════
describe("getOpeningBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses EC_QUARTERLY snapshot + movements when available", async () => {
    const snapshotDate = d(2025, 12, 31);
    mockPrisma.bankAccount.findFirst.mockResolvedValue({ id: "ba1" } as never);
    mockPrisma.balanceSnapshot.findFirst.mockResolvedValue({
      balance: 50000,
      date: snapshotDate,
      sourceFile: "ec-q4.csv",
    } as never);
    mockPrisma.bankStatement.findMany.mockResolvedValue([
      { amount: 1000 },
      { amount: -500 },
    ] as never);

    const balance = await getOpeningBalance("org1", d(2026, 3, 15));
    expect(balance).toBe(50500);
  });

  it("falls back to manual balance when no snapshots", async () => {
    mockPrisma.bankAccount.findFirst.mockResolvedValue({ id: "ba1" } as never);
    mockPrisma.balanceSnapshot.findFirst.mockResolvedValue(null);
    mockPrisma.organization.findUnique.mockResolvedValue({
      settings: { currentBalance: 25000 },
    } as never);

    const balance = await getOpeningBalance("org1", d(2026, 3, 15));
    expect(balance).toBe(25000);
  });

  it("falls back to last bank statement balance", async () => {
    mockPrisma.bankAccount.findFirst.mockResolvedValue(null);
    mockPrisma.organization.findUnique.mockResolvedValue({ settings: {} } as never);
    mockPrisma.bankStatement.findFirst.mockResolvedValue({ balance: 12345 } as never);

    const balance = await getOpeningBalance("org1", d(2026, 3, 15));
    expect(balance).toBe(12345);
  });

  it("returns 0 when nothing is available", async () => {
    mockPrisma.bankAccount.findFirst.mockResolvedValue(null);
    mockPrisma.organization.findUnique.mockResolvedValue({ settings: {} } as never);
    mockPrisma.bankStatement.findFirst.mockResolvedValue(null);

    const balance = await getOpeningBalance("org1", d(2026, 3, 15));
    expect(balance).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Group 4: buildDailyProjection — integration with mocked prisma
// ═══════════════════════════════════════════════════════════════════════════════
describe("buildDailyProjection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default empty returns
    mockPrisma.bankAccount.findFirst.mockResolvedValue(null);
    mockPrisma.balanceSnapshot.findFirst.mockResolvedValue(null);
    mockPrisma.bankStatement.findMany.mockResolvedValue([]);
    mockPrisma.bankStatement.findFirst.mockResolvedValue(null);
    mockPrisma.organization.findUnique.mockResolvedValue({ settings: {} } as never);
    mockPrisma.invoice.findMany.mockResolvedValue([]);
    mockPrisma.recurringExpense.findMany.mockResolvedValue([]);
    mockPrisma.oneOffExpense.findMany.mockResolvedValue([]);
    mockPrisma.futureReceivable.findMany.mockResolvedValue([]);
    mockPrisma.expectedPayable.findMany.mockResolvedValue([]);
    mockPrisma.vatSnapshot.findMany.mockResolvedValue([]);
  });

  it("returns 365 days of projection", async () => {
    const result = await buildDailyProjection("org1");
    expect(result.projection.length).toBe(365);
    expect(result.asOfDate).toBe(format(startOfDay(new Date()), "yyyy-MM-dd"));
  });

  it("places active invoices at dueDate as inflows", async () => {
    const today = startOfDay(new Date());
    const dueDate = addDays(today, 30);

    // findMany is called multiple times: active, passive, vatInvoices
    mockPrisma.invoice.findMany
      .mockResolvedValueOnce([
        {
          id: "inv1",
          number: "FA-001",
          grossAmount: 5000,
          dueDate,
          date: today,
        },
      ])
      .mockResolvedValueOnce([]) // passive
      .mockResolvedValueOnce([]); // VAT invoices

    const result = await buildDailyProjection("org1");
    const dueDateKey = format(dueDate, "yyyy-MM-dd");
    const point = result.projection.find((p) => p.date === dueDateKey);

    expect(point).toBeDefined();
    expect(point!.activeInvoices).toBe(5000);
    expect(result.totalPendingActiveGross).toBe(5000);
  });

  it("places passive invoices at dueDate as outflows", async () => {
    const today = startOfDay(new Date());
    const dueDate = addDays(today, 15);

    mockPrisma.invoice.findMany
      .mockResolvedValueOnce([]) // active
      .mockResolvedValueOnce([
        {
          id: "inv2",
          number: "FP-001",
          grossAmount: 3000,
          dueDate,
          date: today,
        },
      ])
      .mockResolvedValueOnce([]); // VAT

    const result = await buildDailyProjection("org1");
    const dueDateKey = format(dueDate, "yyyy-MM-dd");
    const point = result.projection.find((p) => p.date === dueDateKey);

    expect(point).toBeDefined();
    expect(point!.passiveInvoices).toBe(3000);
    expect(point!.netFlow).toBe(-3000);
  });

  it("overdue invoices are placed at today", async () => {
    const today = startOfDay(new Date());
    const pastDueDate = addDays(today, -10);

    mockPrisma.invoice.findMany
      .mockResolvedValueOnce([
        {
          id: "inv1",
          number: "FA-001",
          grossAmount: 2000,
          dueDate: pastDueDate,
          date: addDays(today, -40),
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await buildDailyProjection("org1");
    const todayKey = format(today, "yyyy-MM-dd");
    const todayPoint = result.projection.find((p) => p.date === todayKey);

    expect(todayPoint!.activeInvoices).toBe(2000);
  });

  it("running balance accumulates correctly", async () => {
    const today = startOfDay(new Date());

    mockPrisma.invoice.findMany
      .mockResolvedValueOnce([
        {
          id: "inv1",
          number: "FA-001",
          grossAmount: 10000,
          dueDate: addDays(today, 10),
          date: today,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "inv2",
          number: "FP-001",
          grossAmount: 4000,
          dueDate: addDays(today, 20),
          date: today,
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await buildDailyProjection("org1");

    // At day 10: balance = 0 + 10000 = 10000
    expect(result.projection[10].balance).toBe(10000);
    // At day 20: balance = 10000 - 4000 = 6000
    expect(result.projection[20].balance).toBe(6000);
  });

  it("avgDso is 0 in V2", async () => {
    const result = await buildDailyProjection("org1");
    expect(result.avgDso).toBe(0);
  });
});
