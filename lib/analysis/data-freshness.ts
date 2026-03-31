import { prisma } from "@/lib/prisma";

export interface DataGap {
  type: "EC_QUARTERLY" | "MOVEMENTS";
  period: string;
  label: string;
  startDate: Date;
  endDate: Date;
  daysOverdue: number;
  priority: "high" | "medium" | "low";
}

/**
 * Analyze data freshness for an organization.
 * Checks for missing quarterly EC uploads and stale movement data.
 * A quarter is considered overdue if >7 days have passed since its end.
 */
export async function analyzeDataFreshness(organizationId: string): Promise<DataGap[]> {
  const today = new Date();
  const year = today.getFullYear();
  const gaps: DataGap[] = [];

  // Fetch existing data periods
  const dataPeriods = await prisma.dataPeriod.findMany({
    where: { organizationId },
    select: { type: true, startDate: true, endDate: true },
  });

  // Also check balance snapshots for EC_QUARTERLY
  let balanceSnapshots: Array<{ date: Date; source: string; period: string | null }> = [];
  try {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { organizationId, isDefault: true },
      select: { id: true },
    });
    if (bankAccount) {
      balanceSnapshots = await prisma.balanceSnapshot.findMany({
        where: { bankAccountId: bankAccount.id, source: "EC_QUARTERLY" },
        select: { date: true, source: true, period: true },
      });
    }
  } catch {
    // Tables may not exist
  }

  // Define quarters
  const quarters = [
    {
      period: `Q1_${year}`,
      label: `Q1 ${year} (Gen-Mar)`,
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 2, 31),
      deadline: new Date(year, 3, 7), // April 7
    },
    {
      period: `Q2_${year}`,
      label: `Q2 ${year} (Apr-Giu)`,
      startDate: new Date(year, 3, 1),
      endDate: new Date(year, 5, 30),
      deadline: new Date(year, 6, 7), // July 7
    },
    {
      period: `Q3_${year}`,
      label: `Q3 ${year} (Lug-Set)`,
      startDate: new Date(year, 6, 1),
      endDate: new Date(year, 8, 30),
      deadline: new Date(year, 9, 7), // October 7
    },
    {
      period: `Q4_${year - 1}`,
      label: `Q4 ${year - 1} (Ott-Dic)`,
      startDate: new Date(year - 1, 9, 1),
      endDate: new Date(year - 1, 11, 31),
      deadline: new Date(year, 0, 7), // January 7
    },
  ];

  for (const q of quarters) {
    if (today <= q.deadline) continue; // Not yet overdue

    const daysOverdue = Math.round(
      (today.getTime() - q.deadline.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Check if we already have this quarterly data
    const hasEcData =
      dataPeriods.some(
        (dp) =>
          dp.type === "EC_QUARTERLY" && dp.startDate <= q.endDate && dp.endDate >= q.startDate,
      ) || balanceSnapshots.some((bs) => bs.period === q.period);

    if (!hasEcData) {
      gaps.push({
        type: "EC_QUARTERLY",
        period: q.period,
        label: q.label,
        startDate: q.startDate,
        endDate: q.endDate,
        daysOverdue,
        priority: daysOverdue > 30 ? "high" : daysOverdue > 14 ? "medium" : "low",
      });
    }
  }

  // Check for stale movement data (no movements in last 30 days)
  const lastMovement = await prisma.bankStatement.findFirst({
    where: { organizationId },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (lastMovement) {
    const daysSinceLastMovement = Math.round(
      (today.getTime() - lastMovement.date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceLastMovement > 30) {
      const lastDate = lastMovement.date;
      gaps.push({
        type: "MOVEMENTS",
        period: `movements_stale`,
        label: `Movimenti bancari`,
        startDate: lastDate,
        endDate: today,
        daysOverdue: daysSinceLastMovement - 30,
        priority: daysSinceLastMovement > 60 ? "high" : "medium",
      });
    }
  }

  // Sort by priority (high first) then daysOverdue
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  gaps.sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] || b.daysOverdue - a.daysOverdue,
  );

  return gaps;
}
