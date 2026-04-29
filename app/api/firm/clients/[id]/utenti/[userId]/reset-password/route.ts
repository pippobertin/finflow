import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send-email";
import { renderPasswordResetEmail } from "@/lib/email/templates";
import crypto from "crypto";

interface BrandingJson {
  logoDataUrl?: string;
  brandColor?: string;
  displayName?: string;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * POST /api/firm/clients/[id]/utenti/[userId]/reset-password
 *
 * Controller-initiated password reset.
 * Generates a token and sends the reset email to the user.
 * No rate limiting (controller action).
 */
export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id, userId } = await params;

  // Verify org belongs to this firm
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: {
      id: true,
      accountingFirm: { select: { name: true, branding: true } },
    },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  // Verify user belongs to this org
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId: id },
    select: { id: true, email: true, name: true, isActive: true },
  });
  if (!user) {
    return Response.json({ error: "Utente non trovato" }, { status: 404 });
  }

  // Invalidate previous unused tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  // Generate token
  const tokenPlain = crypto.randomUUID();
  const tokenHash = sha256(tokenPlain);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Build branded email
  const branding = (org.accountingFirm?.branding as BrandingJson) ?? {};
  const firmName = branding.displayName || org.accountingFirm?.name || "FinFlow";
  const firmColor = branding.brandColor || "#0b4d8a";
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/login/reset-password?token=${tokenPlain}`;

  sendEmail({
    to: user.email,
    subject: `Reimposta la tua password — ${firmName}`,
    html: renderPasswordResetEmail({
      branding: { firmName, firmLogo: branding.logoDataUrl, firmColor },
      userName: user.name ?? undefined,
      resetUrl,
    }),
  }).catch((err) => console.error("[reset-password] Email failed:", err));

  return Response.json({ ok: true });
}
