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
 * Minimal in-memory rate limiting.
 * Max 3 requests per email per hour.
 * Not persistent across restarts — acceptable for a single-instance app.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(email) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }

  recent.push(now);
  rateLimitMap.set(email, recent);
  return false;
}

// Periodically clean up stale entries (every 10 minutes)
setInterval(
  () => {
    const now = Date.now();
    for (const [email, timestamps] of rateLimitMap.entries()) {
      const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (recent.length === 0) {
        rateLimitMap.delete(email);
      } else {
        rateLimitMap.set(email, recent);
      }
    }
  },
  10 * 60 * 1000,
).unref?.();

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
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

  // Rate limit check (before DB lookup to avoid enumeration via timing)
  if (isRateLimited(email)) {
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
    console.log(`[forgot-password] no-op forgot password for ${email}`);
    return Response.json({ ok: true });
  }

  // Invalidate previous unused tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  // Generate token: plaintext UUID → SHA-256 hash stored in DB
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
  const branding = (user.organization?.accountingFirm?.branding as BrandingJson) ?? {};
  const firmName = branding.displayName || user.organization?.accountingFirm?.name || "FinFlow";
  const firmColor = branding.brandColor || "#0b4d8a";
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/login/reset-password?token=${tokenPlain}`;

  await sendEmail({
    to: user.email,
    subject: `Reimposta la tua password — ${firmName}`,
    html: renderPasswordResetEmail({
      branding: { firmName, firmLogo: branding.logoDataUrl, firmColor },
      userName: user.name ?? undefined,
      resetUrl,
    }),
  });

  return Response.json({ ok: true });
}
