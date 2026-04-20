import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

// ─── Client auth (V1 compatible) ─────────────────────────────

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

// ─── Firm auth (V2 controller) ───────────────────────────────
// Ref: docs/adr/004-scoped-query-pattern.md

interface FirmSession extends Session {
  user: Session["user"] & {
    id: string;
    organizationId: string;
    accountingFirmId: string;
    userType: "CONTROLLER";
  };
}

type FirmAuthResult =
  | { error: Response; session: null; accountingFirmId: null }
  | { error: null; session: FirmSession; accountingFirmId: string };

/**
 * Auth guard for controller routes (app/api/firm/*).
 * Verifies userType === CONTROLLER and accountingFirmId is present.
 * Returns accountingFirmId for use in scoped queries.
 */
export async function getFirmSession(): Promise<FirmAuthResult> {
  const session = (await auth()) as Session | null;
  if (!session?.user?.organizationId) {
    return {
      error: Response.json({ error: "Non autorizzato" }, { status: 401 }),
      session: null,
      accountingFirmId: null,
    };
  }
  if (session.user.userType !== "CONTROLLER" || !session.user.accountingFirmId) {
    return {
      error: Response.json(
        { error: "Accesso riservato ai controller dello studio" },
        { status: 403 },
      ),
      session: null,
      accountingFirmId: null,
    };
  }
  return {
    error: null,
    session: session as FirmSession,
    accountingFirmId: session.user.accountingFirmId,
  };
}
