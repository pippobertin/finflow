import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { parsePdfWithProfile } from "@/lib/parsers/pdf-bank-statement-parser";
import { bankLayoutPatternsSchema } from "@/lib/validations/pdf-bank-profile";

/**
 * POST /api/firm/templates/pdf-banks/test
 *
 * Upload a test PDF file + either a profileId or inline layoutPatterns.
 * Returns parsed rows for validation — does NOT import anything.
 */
export async function POST(request: NextRequest) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const profileId = formData.get("profileId") as string | null;
  const patternsJson = formData.get("layoutPatterns") as string | null;

  if (!file || file.size === 0) {
    return Response.json({ error: "File PDF obbligatorio" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return Response.json({ error: "Solo file PDF accettati" }, { status: 400 });
  }

  // Resolve layout patterns
  let patterns;

  if (profileId) {
    const profile = await prisma.pdfBankProfile.findFirst({
      where: {
        id: profileId,
        OR: [{ accountingFirmId }, { accountingFirmId: null }],
      },
    });
    if (!profile) {
      return Response.json({ error: "Profilo non trovato" }, { status: 404 });
    }
    const parsed = bankLayoutPatternsSchema.safeParse(profile.layoutPatterns);
    if (!parsed.success) {
      return Response.json(
        { error: "Pattern del profilo non validi", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    patterns = parsed.data;
  } else if (patternsJson) {
    try {
      const raw = JSON.parse(patternsJson);
      const parsed = bankLayoutPatternsSchema.safeParse(raw);
      if (!parsed.success) {
        return Response.json(
          { error: "Pattern non validi", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
      patterns = parsed.data;
    } catch {
      return Response.json({ error: "JSON layoutPatterns non valido" }, { status: 400 });
    }
  } else {
    return Response.json({ error: "Specificare profileId o layoutPatterns" }, { status: 400 });
  }

  // Parse PDF
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await parsePdfWithProfile(buffer, patterns);

  return Response.json({
    rows: result.rows.slice(0, 50), // Limit preview to 50 rows
    totalRows: result.rows.length,
    warnings: result.warnings,
    rawTextPreview: result.rawTextPreview,
    stats: {
      totalLines: result.totalLines,
      matchedLines: result.matchedLines,
      skippedLines: result.skippedLines,
    },
  });
}
