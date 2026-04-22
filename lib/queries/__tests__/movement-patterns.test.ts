import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    movementPattern: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    bankStatement: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/vat/vat-split", () => ({
  computeVatSplit: vi.fn((amount: number, mapping: { vatRate: number }) => {
    const net = amount / (1 + mapping.vatRate / 100);
    const vat = amount - net;
    return { netAmount: Math.round(net * 100) / 100, vatAmount: Math.round(vat * 100) / 100 };
  }),
}));

import { prisma } from "@/lib/prisma";
import {
  matchMovementAgainstPatterns,
  applyPatternsToUncategorized,
  createMovementPattern,
} from "../movement-patterns";

describe("createMovementPattern", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid regex", async () => {
    await expect(
      createMovementPattern("org-1", {
        descriptionRegex: "(?<invalid_unclosed",
        cdgCategory: "REVENUE",
      }),
    ).rejects.toThrow("Regex non valida");
  });

  it("creates pattern with valid regex", async () => {
    vi.mocked(prisma.movementPattern.create).mockResolvedValue({
      id: "pat-1",
      organizationId: "org-1",
      descriptionRegex: "BONIFICO.*ROSSI",
      cdgCategory: "REVENUE",
      vatRate: null,
      priority: 100,
      isActive: true,
      matchCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createMovementPattern("org-1", {
      descriptionRegex: "BONIFICO.*ROSSI",
      cdgCategory: "REVENUE",
    });

    expect(result.descriptionRegex).toBe("BONIFICO.*ROSSI");
    expect(result.cdgCategory).toBe("REVENUE");
  });
});

describe("matchMovementAgainstPatterns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no patterns exist", async () => {
    vi.mocked(prisma.movementPattern.findMany).mockResolvedValue([]);

    const result = await matchMovementAgainstPatterns("org-1", "BONIFICO DA ROSSI");

    expect(result).toBeNull();
  });

  it("matches first pattern by priority", async () => {
    vi.mocked(prisma.movementPattern.findMany).mockResolvedValue([
      {
        id: "pat-1",
        organizationId: "org-1",
        descriptionRegex: "BONIFICO",
        cdgCategory: "REVENUE",
        vatRate: null,
        priority: 50,
        isActive: true,
        matchCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "pat-2",
        organizationId: "org-1",
        descriptionRegex: "BONIFICO.*ROSSI",
        cdgCategory: "FINANCIAL_INCOME",
        vatRate: null,
        priority: 100,
        isActive: true,
        matchCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await matchMovementAgainstPatterns("org-1", "BONIFICO DA ROSSI SRL");

    // pat-1 has higher priority (lower number) and matches first
    expect(result).not.toBeNull();
    expect(result!.patternId).toBe("pat-1");
    expect(result!.cdgCategory).toBe("REVENUE");
  });

  it("skips invalid regex patterns gracefully", async () => {
    vi.mocked(prisma.movementPattern.findMany).mockResolvedValue([
      {
        id: "pat-bad",
        organizationId: "org-1",
        descriptionRegex: "(?<broken",
        cdgCategory: "REVENUE",
        vatRate: null,
        priority: 10,
        isActive: true,
        matchCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "pat-good",
        organizationId: "org-1",
        descriptionRegex: "PAGAMENTO",
        cdgCategory: "VAR_COST_SERVICES",
        vatRate: null,
        priority: 100,
        isActive: true,
        matchCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await matchMovementAgainstPatterns("org-1", "PAGAMENTO FORNITORE");

    expect(result).not.toBeNull();
    expect(result!.patternId).toBe("pat-good");
  });

  it("returns null when no pattern matches", async () => {
    vi.mocked(prisma.movementPattern.findMany).mockResolvedValue([
      {
        id: "pat-1",
        organizationId: "org-1",
        descriptionRegex: "STIPENDIO",
        cdgCategory: "VAR_COST_DIRECT_LABOR",
        vatRate: null,
        priority: 100,
        isActive: true,
        matchCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await matchMovementAgainstPatterns("org-1", "BONIFICO DA ROSSI");

    expect(result).toBeNull();
  });

  it("returns vatRate when pattern has it", async () => {
    vi.mocked(prisma.movementPattern.findMany).mockResolvedValue([
      {
        id: "pat-1",
        organizationId: "org-1",
        descriptionRegex: "FATTURA",
        cdgCategory: "VAR_COST_MATERIALS",
        vatRate: 22 as never,
        priority: 100,
        isActive: true,
        matchCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await matchMovementAgainstPatterns("org-1", "FATTURA 123/2024");

    expect(result).not.toBeNull();
    expect(result!.vatRate).toBe(22);
  });
});

describe("applyPatternsToUncategorized", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 when no patterns exist", async () => {
    vi.mocked(prisma.movementPattern.findMany).mockResolvedValue([]);

    const result = await applyPatternsToUncategorized("org-1");

    expect(result.categorized).toBe(0);
  });

  it("categorizes matching statements", async () => {
    vi.mocked(prisma.movementPattern.findMany).mockResolvedValue([
      {
        id: "pat-1",
        organizationId: "org-1",
        descriptionRegex: "ENEL",
        cdgCategory: "FIXED_COST_UTILITIES",
        vatRate: null,
        priority: 100,
        isActive: true,
        matchCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.mocked(prisma.bankStatement.findMany).mockResolvedValue([
      { id: "bs-1", description: "PAGAMENTO ENEL SERVIZIO ELETTRICO", amount: -150 as never },
      { id: "bs-2", description: "CANONE TELECOM ITALIA", amount: -50 as never },
    ] as never);

    vi.mocked(prisma.bankStatement.update).mockResolvedValue({} as never);
    vi.mocked(prisma.movementPattern.update).mockResolvedValue({} as never);

    const result = await applyPatternsToUncategorized("org-1");

    // Only bs-1 matches "ENEL"
    expect(result.categorized).toBe(1);
    expect(prisma.bankStatement.update).toHaveBeenCalledTimes(1);
    expect(prisma.movementPattern.update).toHaveBeenCalledTimes(1);
  });
});
