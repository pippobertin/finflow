import { NextRequest } from "next/server";
import { getClientSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/client/settings/cash-threshold
 * Body: { threshold: number }
 *
 * Sets the cash attention threshold for the client's organization.
 * - threshold > 0: set to that value
 * - threshold === 0: disable threshold (no reference line shown)
 * - threshold === null: reset to default (5000)
 */
export async function PATCH(request: NextRequest) {
  const { error, organizationId } = await getClientSession();
  if (error) return error;

  try {
    const body = await request.json();
    const { threshold } = body;

    if (threshold !== null && (typeof threshold !== "number" || threshold < 0)) {
      return Response.json(
        { error: "Soglia non valida. Deve essere un numero >= 0 o null." },
        { status: 400 },
      );
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: { cashThresholdEur: threshold },
    });

    return Response.json({ ok: true, threshold: threshold ?? 5000 });
  } catch (err) {
    console.error("[client/settings/cash-threshold] PATCH error:", err);
    return Response.json({ error: "Errore nel salvataggio della soglia" }, { status: 500 });
  }
}
