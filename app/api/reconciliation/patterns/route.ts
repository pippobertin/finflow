import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface PatternEntry {
  label: string;
  regex: string;
  flags?: string;
  sample: string;
}

interface DescriptionPatterns {
  counterpartPatterns?: PatternEntry[];
  invoiceRefPatterns?: PatternEntry[];
  [key: string]: PatternEntry[] | undefined;
}

// GET: Load all patterns for the org
export async function GET() {
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
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const { bankAccountId, type, regex, flags, label, sample } = body;

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
      return Response.json(
        { error: "Nessun profilo bancario configurato. Importa prima un estratto conto." },
        { status: 404 },
      );
    }
  }

  // Update patterns
  const existing = (profile.descriptionPatterns as DescriptionPatterns | null) ?? {};
  const patterns = existing[type] ?? [];

  patterns.push({
    label,
    regex,
    flags: flags ?? (type === "invoiceRefPatterns" ? "gi" : "i"),
    sample,
  });
  existing[type] = patterns;

  await prisma.bankProfile.update({
    where: { id: profile.id },
    data: { descriptionPatterns: existing as unknown as Prisma.InputJsonValue },
  });

  return Response.json({ success: true, patternCount: patterns.length });
}

// DELETE: Remove a pattern by index
export async function DELETE(request: NextRequest) {
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
      return Response.json({ error: "Nessun profilo bancario" }, { status: 404 });
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
