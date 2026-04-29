import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Minimo 8 caratteri")
    .regex(/[a-zA-Z]/, "Deve contenere almeno una lettera")
    .regex(/[0-9]/, "Deve contenere almeno un numero"),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return Response.json({ error: "Utente non trovato" }, { status: 400 });
  }

  const isValid = await compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return Response.json({ error: "Password attuale non corretta" }, { status: 400 });
  }

  const newHash = await hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return Response.json({ ok: true });
}
