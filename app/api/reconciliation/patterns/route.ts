import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { FEATURES } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface PatternEntry {
  label: string;
  regex: string;
  flags?: string;
  sample: string;
  recurringExpenseId?: string;
}

interface DescriptionPatterns {
  counterpartPatterns?: PatternEntry[];
  invoiceRefPatterns?: PatternEntry[];
  [key: string]: PatternEntry[] | undefined;
}

// GET: Load all patterns for the org
export async function GET() {
  if (!FEATURES.LEGACY_RECONCILIATION) return new Response(null, { status: 404 });

  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  try {
    const profiles = await prisma.bankProfile.findMany({
      where: {
        bankAccount: { organizationId },
        descriptionPatterns: { not: Prisma.JsonNull },
      },
      select: {
        id: true,
        bankName: true,
        bankAccountId: true,
        descriptionPatterns: true,
      },
    });

    return Response.json({ profiles });
  } catch {
    return Response.json({ profiles: [] });
  }
}

// POST: Add a pattern to a bank profile (auto-selects first bank account)
export async function POST(request: NextRequest) {
  if (!FEATURES.LEGACY_RECONCILIATION) return new Response(null, { status: 404 });

  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const { bankAccountId, type, regex, flags, label, sample, recurringExpenseId } = body;

  if (!type || !regex || !label) {
    return Response.json({ error: "Campi obbligatori: type, regex, label" }, { status: 400 });
  }

  if (type !== "counterpartPatterns" && type !== "invoiceRefPatterns") {
    return Response.json(
      { error: "type deve essere counterpartPatterns o invoiceRefPatterns" },
      { status: 400 },
    );
  }

  // Validate regex
  try {
    new RegExp(regex, flags ?? "i");
  } catch {
    return Response.json({ error: "Regex non valida" }, { status: 400 });
  }

  // Find or determine the bank profile to update
  let profile;
  if (bankAccountId) {
    profile = await prisma.bankProfile.findUnique({
      where: { bankAccountId },
      include: { bankAccount: { select: { organizationId: true } } },
    });
    if (!profile || profile.bankAccount.organizationId !== organizationId) {
      return Response.json({ error: "Profilo bancario non trovato" }, { status: 404 });
    }
  } else {
    // Use the first bank profile for this org
    profile = await prisma.bankProfile.findFirst({
      where: { bankAccount: { organizationId } },
    });
    if (!profile) {
      // No profile yet — auto-create from the first bank account
      const bankAccount = await prisma.bankAccount.findFirst({
        where: { organizationId },
      });
      if (!bankAccount) {
        return Response.json(
          { error: "Nessun conto bancario trovato. Importa prima un estratto conto." },
          { status: 404 },
        );
      }
      profile = await prisma.bankProfile.create({
        data: {
          bankAccountId: bankAccount.id,
          bankName: bankAccount.bankName,
          columnMapping: {},
          dateFormat: "dd/MM/yyyy",
          delimiter: ",",
          decimalSeparator: ",",
          skipRows: 0,
        },
      });
    }
  }

  // Update patterns
  const existing = (profile.descriptionPatterns as DescriptionPatterns | null) ?? {};
  const patterns = existing[type] ?? [];

  const entry: PatternEntry = {
    label,
    regex,
    flags: flags ?? (type === "invoiceRefPatterns" ? "gi" : "i"),
    sample,
  };
  if (recurringExpenseId) entry.recurringExpenseId = recurringExpenseId;
  patterns.push(entry);
  existing[type] = patterns;

  await prisma.bankProfile.update({
    where: { id: profile.id },
    data: { descriptionPatterns: existing as unknown as Prisma.InputJsonValue },
  });

  return Response.json({ success: true, patternCount: patterns.length });
}

// PATCH: Update a pattern (e.g. link recurringExpenseId after expense creation)
export async function PATCH(request: NextRequest) {
  if (!FEATURES.LEGACY_RECONCILIATION) return new Response(null, { status: 404 });

  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const { bankAccountId, type, index, recurringExpenseId } = body;

  if (!type || index === undefined || !recurringExpenseId) {
    return Response.json(
      { error: "Campi obbligatori: type, index, recurringExpenseId" },
      { status: 400 },
    );
  }

  let profile;
  if (bankAccountId) {
    profile = await prisma.bankProfile.findUnique({
      where: { bankAccountId },
      include: { bankAccount: { select: { organizationId: true } } },
    });
    if (!profile || profile.bankAccount.organizationId !== organizationId) {
      return Response.json({ error: "Profilo non trovato" }, { status: 404 });
    }
  } else {
    profile = await prisma.bankProfile.findFirst({
      where: { bankAccount: { organizationId } },
    });
    if (!profile) {
      return Response.json({ error: "Nessun pattern salvato" }, { status: 404 });
    }
  }

  const existing = (profile.descriptionPatterns as DescriptionPatterns | null) ?? {};
  const patterns = existing[type as keyof DescriptionPatterns] ?? [];

  if (index < 0 || index >= patterns.length) {
    return Response.json({ error: "Indice non valido" }, { status: 400 });
  }

  patterns[index] = { ...patterns[index], recurringExpenseId };
  existing[type as keyof DescriptionPatterns] = patterns;

  await prisma.bankProfile.update({
    where: { id: profile.id },
    data: { descriptionPatterns: existing as unknown as Prisma.InputJsonValue },
  });

  return Response.json({ success: true });
}

// DELETE: Remove a pattern by index
export async function DELETE(request: NextRequest) {
  if (!FEATURES.LEGACY_RECONCILIATION) return new Response(null, { status: 404 });

  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const { bankAccountId, type, index } = body;

  if (!type || index === undefined) {
    return Response.json({ error: "Campi obbligatori: type, index" }, { status: 400 });
  }

  let profile;
  if (bankAccountId) {
    profile = await prisma.bankProfile.findUnique({
      where: { bankAccountId },
      include: { bankAccount: { select: { organizationId: true } } },
    });
    if (!profile || profile.bankAccount.organizationId !== organizationId) {
      return Response.json({ error: "Profilo non trovato" }, { status: 404 });
    }
  } else {
    profile = await prisma.bankProfile.findFirst({
      where: { bankAccount: { organizationId } },
    });
    if (!profile) {
      return Response.json({ error: "Nessun pattern salvato" }, { status: 404 });
    }
  }

  const existing = (profile.descriptionPatterns as DescriptionPatterns | null) ?? {};
  const patterns = existing[type as keyof DescriptionPatterns] ?? [];

  if (index < 0 || index >= patterns.length) {
    return Response.json({ error: "Indice non valido" }, { status: 400 });
  }

  patterns.splice(index, 1);
  existing[type as keyof DescriptionPatterns] = patterns;

  await prisma.bankProfile.update({
    where: { id: profile.id },
    data: { descriptionPatterns: existing as unknown as Prisma.InputJsonValue },
  });

  return Response.json({ success: true });
}
