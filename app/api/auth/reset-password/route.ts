import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Minimo 8 caratteri")
    .regex(/[a-zA-Z]/, "Deve contenere almeno una lettera")
    .regex(/[0-9]/, "Deve contenere almeno un numero"),
});

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * POST /api/auth/reset-password
 *
 * Validates the reset token (SHA-256), updates the user's password,
 * and marks the token as used.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Token e password (min 8 caratteri, una lettera e un numero) obbligatori" },
      { status: 400 },
    );
  }

  const { token, newPassword } = parsed.data;
  const tokenHash = sha256(token);

  // Find valid token
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return Response.json({ error: "Token non valido o scaduto" }, { status: 400 });
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return Response.json({ error: "Utente non trovato" }, { status: 400 });
  }

  // Update password
  const passwordHash = await hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return Response.json({ ok: true });
}
