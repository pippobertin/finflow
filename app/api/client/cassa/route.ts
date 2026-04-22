import { getClientSession } from "@/lib/helpers/auth-guard";
import { buildFullTimeline } from "@/lib/queries/cashflow-projection";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/client/cassa
 *
 * Returns simplified cash position for the client dashboard:
 * - current balance
 * - 30/60/90 day projected balances
 * - chart data (daily points, max 120 days)
 * - next upcoming cash events
 */
export async function GET() {
  const { error, organizationId } = await getClientSession();
  if (error) return error;

  try {
    const [timeline, org] = await Promise.all([
      buildFullTimeline(organizationId),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { cashThresholdEur: true },
      }),
    ]);
    const threshold = org?.cashThresholdEur != null ? Number(org.cashThresholdEur) : 5000;

    const today = timeline.asOfDate;
    const projection = timeline.projection;

    // Find milestone balances at 30, 60, 90 days
    function balanceAtDay(days: number): number | null {
      const target = new Date(today);
      target.setDate(target.getDate() + days);
      const targetStr = target.toISOString().slice(0, 10);
      // Find closest point at or before target
      let closest: number | null = null;
      for (const p of projection) {
        if (p.date <= targetStr) closest = p.balance;
        else break;
      }
      return closest;
    }

    const milestones = {
      days30: balanceAtDay(30),
      days60: balanceAtDay(60),
      days90: balanceAtDay(90),
    };

    // Chart data: subsample to max ~90 points (every other day for 6 months)
    const chartData = projection
      .filter((_, i) => i % 4 === 0 || i === projection.length - 1)
      .slice(0, 90)
      .map((p) => ({
        date: p.date,
        balance: Math.round(p.balance),
        netFlow: Math.round(p.netFlow),
      }));

    // Next upcoming events (first 10 with non-zero flow)
    const nextItems = projection
      .filter((p) => p.details.length > 0)
      .slice(0, 10)
      .flatMap((p) =>
        p.details.map((d) => ({
          date: p.date,
          type: d.type,
          label: d.label,
          counterpart: d.counterpart,
          amount: d.amount,
        })),
      )
      .slice(0, 10);

    return Response.json({
      currentBalance: Math.round(timeline.startingBalance),
      asOfDate: today,
      milestones,
      chartData,
      nextItems,
      threshold,
    });
  } catch (err) {
    console.error("[client/cassa] Error:", err);
    return Response.json({ error: "Errore nel calcolo della posizione di cassa" }, { status: 500 });
  }
}
