import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

interface AuthSession extends Session {
  user: Session["user"] & {
    id: string;
    organizationId: string;
    role: string;
  };
}

type AuthResult =
  | { error: Response; session: null; organizationId: null }
  | { error: null; session: AuthSession; organizationId: string };

export async function getAuthSession(): Promise<AuthResult> {
  const session = (await auth()) as Session | null;
  if (!session?.user?.organizationId) {
    return {
      error: Response.json({ error: "Non autorizzato" }, { status: 401 }),
      session: null,
      organizationId: null,
    };
  }
  return {
    error: null,
    session: session as AuthSession,
    organizationId: session.user.organizationId,
  };
}

export async function getAdminSession(): Promise<AuthResult> {
  const session = (await auth()) as Session | null;
  if (!session?.user?.organizationId) {
    return {
      error: Response.json({ error: "Non autorizzato" }, { status: 401 }),
      session: null,
      organizationId: null,
    };
  }
  if (session.user.role !== "ADMIN") {
    return {
      error: Response.json({ error: "Accesso riservato agli amministratori" }, { status: 403 }),
      session: null,
      organizationId: null,
    };
  }
  return {
    error: null,
    session: session as AuthSession,
    organizationId: session.user.organizationId,
  };
}
