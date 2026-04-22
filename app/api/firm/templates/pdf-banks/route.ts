import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { listPdfBankProfiles, createPdfBankProfile } from "@/lib/queries/pdf-bank-profiles";
import { pdfBankProfileCreateSchema } from "@/lib/validations/pdf-bank-profile";

export async function GET() {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const profiles = await listPdfBankProfiles(accountingFirmId);

  return Response.json({
    profiles: profiles.map((p) => ({
      ...p,
      isSystemDefault: p.accountingFirmId === null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const body = await request.json();
  const parsed = pdfBankProfileCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const profile = await createPdfBankProfile(accountingFirmId, {
      bankName: parsed.data.bankName,
      layoutPatterns: parsed.data.layoutPatterns as Record<string, unknown>,
      notes: parsed.data.notes,
    });
    return Response.json(profile, { status: 201 });
  } catch (err) {
    // Unique constraint violation
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return Response.json(
        { error: `Profilo per "${parsed.data.bankName}" già esistente per questo studio` },
        { status: 409 },
      );
    }
    throw err;
  }
}
