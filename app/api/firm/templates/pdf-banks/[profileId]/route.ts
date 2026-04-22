import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { updatePdfBankProfile, deletePdfBankProfile } from "@/lib/queries/pdf-bank-profiles";
import { pdfBankProfileUpdateSchema } from "@/lib/validations/pdf-bank-profile";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { profileId } = await params;
  const body = await request.json();
  const parsed = pdfBankProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await updatePdfBankProfile(profileId, accountingFirmId, {
    ...(parsed.data.bankName !== undefined ? { bankName: parsed.data.bankName } : {}),
    ...(parsed.data.layoutPatterns !== undefined
      ? { layoutPatterns: parsed.data.layoutPatterns as Record<string, unknown> }
      : {}),
    ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
  });

  if (result.count === 0) {
    return Response.json(
      { error: "Profilo non trovato o non modificabile (profilo di sistema)" },
      { status: 404 },
    );
  }

  return Response.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { profileId } = await params;

  const result = await deletePdfBankProfile(profileId, accountingFirmId);

  if (result.count === 0) {
    return Response.json(
      { error: "Profilo non trovato o non eliminabile (profilo di sistema)" },
      { status: 404 },
    );
  }

  return Response.json({ success: true });
}
