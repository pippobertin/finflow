import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

/**
 * POST /api/auth/reset-password
 *
 * Validates the reset token, updates the user's password, and deletes the token.
 * Body: { token, password }
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { token, password } = body;

  if (!token || !password || password.length < 6) {
    return Response.json(
      { error: "Token e password (min 6 caratteri) obbligatori" },
      { status: 400 },
    );
  }

  // Find valid token
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expires < new Date()) {
    return Response.json({ error: "Token non valido o scaduto" }, { status: 400 });
  }

  // Find user by identifier (email)
  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return Response.json({ error: "Utente non trovato" }, { status: 400 });
  }

  // Update password
  const passwordHash = await hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Delete used token
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: record.identifier, token } },
  });

  return Response.json({ ok: true });
}
