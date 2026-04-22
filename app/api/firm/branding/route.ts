import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface BrandingData {
  logoDataUrl?: string;
  brandColor?: string;
  accentColor?: string;
  displayName?: string;
}

/**
 * GET /api/firm/branding
 * Returns the current branding configuration for the firm.
 */
export async function GET() {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const firm = await prisma.accountingFirm.findUnique({
    where: { id: accountingFirmId },
    select: { branding: true, name: true },
  });

  if (!firm) {
    return Response.json({ error: "Studio non trovato" }, { status: 404 });
  }

  return Response.json({
    branding: (firm.branding as BrandingData) ?? {},
    firmName: firm.name,
  });
}

/**
 * POST /api/firm/branding
 * Update branding configuration.
 * Body: { logoDataUrl?, brandColor?, accentColor?, displayName? }
 */
export async function POST(request: NextRequest) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  try {
    const body = await request.json();
    const { logoDataUrl, brandColor, accentColor, displayName } = body;

    // Validate color format if provided
    const colorRegex = /^#[0-9a-fA-F]{6}$/;
    if (brandColor && !colorRegex.test(brandColor)) {
      return Response.json(
        { error: "Colore primario non valido (formato: #RRGGBB)" },
        { status: 400 },
      );
    }
    if (accentColor && !colorRegex.test(accentColor)) {
      return Response.json(
        { error: "Colore accento non valido (formato: #RRGGBB)" },
        { status: 400 },
      );
    }

    // Validate display name length
    if (displayName && displayName.length > 60) {
      return Response.json(
        { error: "Nome studio troppo lungo (max 60 caratteri)" },
        { status: 400 },
      );
    }

    // Validate logo data URL size (max ~500KB base64)
    if (logoDataUrl && logoDataUrl.length > 700_000) {
      return Response.json({ error: "Logo troppo grande (max 500KB)" }, { status: 400 });
    }

    const branding: BrandingData = {};
    if (logoDataUrl !== undefined) branding.logoDataUrl = logoDataUrl || undefined;
    if (brandColor !== undefined) branding.brandColor = brandColor || undefined;
    if (accentColor !== undefined) branding.accentColor = accentColor || undefined;
    if (displayName !== undefined) branding.displayName = displayName || undefined;

    await prisma.accountingFirm.update({
      where: { id: accountingFirmId },
      data: { branding: branding as unknown as Prisma.InputJsonValue },
    });

    return Response.json({ ok: true, branding });
  } catch (err) {
    console.error("[firm/branding] POST error:", err);
    return Response.json({ error: "Errore nel salvataggio del branding" }, { status: 500 });
  }
}
