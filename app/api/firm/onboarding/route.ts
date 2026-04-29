import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface BrandingPayload {
  displayName?: string;
  brandColor?: string;
  accentColor?: string;
  logoDataUrl?: string;
  email?: string;
  phone?: string;
}

/**
 * POST /api/firm/onboarding
 * Handles wizard steps: "branding" and "complete".
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const body = await request.json();
  const { step } = body;

  if (step === "branding") {
    const data = body.data as BrandingPayload;

    // Validate colors
    const colorRegex = /^#[0-9a-fA-F]{6}$/;
    if (data.brandColor && !colorRegex.test(data.brandColor)) {
      return Response.json({ error: "Colore primario non valido" }, { status: 400 });
    }
    if (data.accentColor && !colorRegex.test(data.accentColor)) {
      return Response.json({ error: "Colore accento non valido" }, { status: 400 });
    }
    if (data.displayName && data.displayName.length > 60) {
      return Response.json(
        { error: "Nome studio troppo lungo (max 60 caratteri)" },
        { status: 400 },
      );
    }
    if (data.logoDataUrl && data.logoDataUrl.length > 700_000) {
      return Response.json({ error: "Logo troppo grande (max 500KB)" }, { status: 400 });
    }

    const branding: Record<string, string | undefined> = {};
    if (data.displayName !== undefined) branding.displayName = data.displayName || undefined;
    if (data.brandColor !== undefined) branding.brandColor = data.brandColor || undefined;
    if (data.accentColor !== undefined) branding.accentColor = data.accentColor || undefined;
    if (data.logoDataUrl !== undefined) branding.logoDataUrl = data.logoDataUrl || undefined;

    await prisma.accountingFirm.update({
      where: { id: accountingFirmId },
      data: {
        branding: branding as unknown as Prisma.InputJsonValue,
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
      },
    });

    return Response.json({ ok: true });
  }

  if (step === "complete") {
    await prisma.accountingFirm.update({
      where: { id: accountingFirmId },
      data: { isOnboarded: true },
    });

    return Response.json({ ok: true });
  }

  return Response.json({ error: "Step non valido" }, { status: 400 });
}
