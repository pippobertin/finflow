import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email/send-email";
import { renderPasswordResetEmail } from "@/lib/email/templates";

interface BrandingJson {
  logoDataUrl?: string;
  brandColor?: string;
  displayName?: string;
}

/**
 * POST /api/auth/forgot-password
 *
 * Sends a password reset email with a time-limited token.
 * Always returns { ok: true } to avoid leaking user existence.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const email = body.email?.trim()?.toLowerCase();

  if (!email) {
    return Response.json({ ok: true });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      organization: {
        select: {
          accountingFirm: { select: { name: true, branding: true } },
        },
      },
    },
  });

  // Always return ok (don't leak user existence)
  if (!user || !user.isActive) {
    return Response.json({ ok: true });
  }

  // Generate token and store it (expires in 1 hour)
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      expires,
    },
  });

  // Build branded email
  const branding = (user.organization?.accountingFirm?.branding as BrandingJson) ?? {};
  const firmName = branding.displayName || user.organization?.accountingFirm?.name || "FinFlow";
  const firmColor = branding.brandColor || "#0b4d8a";
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/login/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: `Reset password — ${firmName}`,
    html: renderPasswordResetEmail({
      branding: { firmName, firmLogo: branding.logoDataUrl, firmColor },
      userName: user.name ?? undefined,
      resetUrl,
    }),
  });

  return Response.json({ ok: true });
}
