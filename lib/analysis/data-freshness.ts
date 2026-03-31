import { prisma } from "@/lib/prisma";

export interface SourceFileInfo {
  sourceFile: string;
  minDate: string;
  maxDate: string;
  recordCount: number;
  closingBalance: number | null;
  overlapsQuarter: boolean;
}

export interface DataGap {
  type: "EC_QUARTERLY" | "MOVEMENTS";
  period: string;
  label: string;
  startDate: Date;
  endDate: Date;
  daysOverdue: number;
  priority: "high" | "medium" | "low";
  availableFiles: SourceFileInfo[];
}

export interface LinkedEc {
  id: string;
  period: string;
  label: string;
  sourceFile: string | null;
  closingBalance: number | null;
  createdAt: Date;
}

/**
 * Analyze data freshness for an organization.
 * Checks for missing quarterly EC uploads and stale movement data.
 * A quarter is considered overdue if >7 days have passed since its end.
 */
export interface FreshnessResult {
  gaps: DataGap[];
  allFiles: SourceFileInfo[];
}

export async function analyzeDataFreshness(organizationId: string): Promise<FreshnessResult> {
  const today = new Date();
  const year = today.getFullYear();
  const gaps: DataGap[] = [];

  // Fetch existing data periods
  const dataPeriods = await prisma.dataPeriod.findMany({
    where: { organizationId },
    select: { type: true, startDate: true, endDate: true },
  });

  // Also check balance snapshots (EC_QUARTERLY and EC_ANNUAL)
  let balanceSnapshots: Array<{ date: Date; source: string; period: string | null }> = [];
  try {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { organizationId, isDefault: true },
      select: { id: true },
    });
    if (bankAccount) {
      balanceSnapshots = await prisma.balanceSnapshot.findMany({
        where: {
          bankAccountId: bankAccount.id,
          source: { in: ["EC_QUARTERLY", "EC_ANNUAL"] },
        },
        select: { date: true, source: true, period: true },
      });
    }
  } catch {
    // Tables may not exist
  }

  // Fetch ALL uploaded source files for this organization
  const allStatements = await prisma.bankStatement.findMany({
    where: { organizationId, sourceFile: { not: null } },
    select: { sourceFile: true, date: true, balance: true },
    orderBy: { date: "asc" },
  });

  // Group by sourceFile
  const fileMap = new Map<string, { dates: Date[]; balances: number[] }>();
  for (const st of allStatements) {
    if (!st.sourceFile) continue;
    const entry = fileMap.get(st.sourceFile) ?? { dates: [], balances: [] };
    entry.dates.push(st.date);
    entry.balances.push(Number(st.balance));
    fileMap.set(st.sourceFile, entry);
  }

  interface FileEntry {
    sourceFile: string;
    minDate: Date;
    maxDate: Date;
    recordCount: number;
    closingBalance: number | null;
  }

  // Also fetch BalanceSnapshots that have sourceFile set (from EC import)
  const snapshotsByFile = new Map<string, number>();
  for (const bs of balanceSnapshots) {
    // balanceSnapshots was fetched above but without sourceFile/balance — re-fetch if needed
  }
  let ecSnapshots: Array<{ sourceFile: string | null; balance: unknown }> = [];
  try {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { organizationId, isDefault: true },
      select: { id: true },
    });
    if (bankAccount) {
      ecSnapshots = await prisma.balanceSnapshot.findMany({
        where: { bankAccountId: bankAccount.id, source: "EC_QUARTERLY" },
        select: { sourceFile: true, balance: true },
      });
    }
  } catch {
    // Table may not exist
  }
  for (const snap of ecSnapshots) {
    if (snap.sourceFile) {
      snapshotsByFile.set(snap.sourceFile, Number(snap.balance));
    }
  }

  const allFiles: FileEntry[] = [];
  for (const [sourceFile, data] of fileMap) {
    const sorted = data.dates
      .map((d, i) => ({ d, b: data.balances[i] }))
      .sort((a, b) => a.d.getTime() - b.d.getTime());
    const lastBalance = sorted[sorted.length - 1].b;
    // Use BalanceSnapshot closing balance if available, else fall back to last statement balance
    const ecBalance = snapshotsByFile.get(sourceFile) ?? null;
    allFiles.push({
      sourceFile,
      minDate: sorted[0].d,
      maxDate: sorted[sorted.length - 1].d,
      recordCount: sorted.length,
      closingBalance: ecBalance ?? (lastBalance !== 0 ? lastBalance : null),
    });
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
    // A quarter is covered if:
    // 1. A DataPeriod of type EC_QUARTERLY covers it, OR
    // 2. A BalanceSnapshot with matching period exists (EC_QUARTERLY), OR
    // 3. An EC_ANNUAL snapshot exists for the same year (annual EC covers all quarters)
    const qYear = q.endDate.getFullYear();
    const hasEcData =
      dataPeriods.some(
        (dp) =>
          dp.type === "EC_QUARTERLY" && dp.startDate <= q.endDate && dp.endDate >= q.startDate,
      ) ||
      balanceSnapshots.some((bs) => bs.period === q.period) ||
      balanceSnapshots.some((bs) => bs.source === "EC_ANNUAL" && bs.date.getFullYear() === qYear);

    if (!hasEcData) {
      // Build available files for this quarter from the pre-fetched allFiles
      const availableFiles: SourceFileInfo[] = allFiles.map((f) => {
        const overlaps = f.minDate <= q.endDate && f.maxDate >= q.startDate;
        return {
          sourceFile: f.sourceFile,
          minDate: f.minDate.toISOString().slice(0, 10),
          maxDate: f.maxDate.toISOString().slice(0, 10),
          recordCount: f.recordCount,
          closingBalance: f.closingBalance,
          overlapsQuarter: overlaps,
        };
      });
      // Sort: overlapping files first
      availableFiles.sort((a, b) =>
        a.overlapsQuarter === b.overlapsQuarter ? 0 : a.overlapsQuarter ? -1 : 1,
      );

      gaps.push({
        type: "EC_QUARTERLY",
        period: q.period,
        label: q.label,
        startDate: q.startDate,
        endDate: q.endDate,
        daysOverdue,
        priority: daysOverdue > 30 ? "high" : daysOverdue > 14 ? "medium" : "low",
        availableFiles,
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
        availableFiles: [],
      });
    }
  }

  // Sort by priority (high first) then daysOverdue
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  gaps.sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority] || b.daysOverdue - a.daysOverdue,
  );

  // Build allFiles with SourceFileInfo format (no quarter-specific overlap)
  const allFilesInfo: SourceFileInfo[] = allFiles.map((f) => ({
    sourceFile: f.sourceFile,
    minDate: f.minDate.toISOString().slice(0, 10),
    maxDate: f.maxDate.toISOString().slice(0, 10),
    recordCount: f.recordCount,
    closingBalance: f.closingBalance,
    overlapsQuarter: false,
  }));

  return { gaps, allFiles: allFilesInfo };
}

/** Period code → human label */
function periodLabel(period: string): string {
  const match = period.match(/^Q(\d)_(\d{4})$/);
  if (!match) return period;
  const qNames: Record<string, string> = {
    "1": "Gen-Mar",
    "2": "Apr-Giu",
    "3": "Lug-Set",
    "4": "Ott-Dic",
  };
  return `Q${match[1]} ${match[2]} (${qNames[match[1]]})`;
}

/** Get all EC_QUARTERLY DataPeriod records for an organization, with closing balance */
export async function getLinkedEcs(organizationId: string): Promise<LinkedEc[]> {
  const periods = await prisma.dataPeriod.findMany({
    where: { organizationId, type: "EC_QUARTERLY" },
    orderBy: { startDate: "desc" },
    select: { id: true, startDate: true, endDate: true, sourceFile: true, createdAt: true },
  });

  // Fetch corresponding BalanceSnapshots to get closing balances
  let snapshots: Array<{ period: string | null; balance: unknown }> = [];
  try {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { organizationId, isDefault: true },
      select: { id: true },
    });
    if (bankAccount) {
      snapshots = await prisma.balanceSnapshot.findMany({
        where: { bankAccountId: bankAccount.id, source: "EC_QUARTERLY" },
        select: { period: true, balance: true },
      });
    }
  } catch {
    // Table may not exist
  }

  return periods.map((dp) => {
    const qMonth = dp.startDate.getMonth(); // 0=Jan, 3=Apr, 6=Jul, 9=Oct
    const qNum = Math.floor(qMonth / 3) + 1;
    const year = dp.startDate.getFullYear();
    const period = `Q${qNum}_${year}`;
    const snap = snapshots.find((s) => s.period === period);
    return {
      id: dp.id,
      period,
      label: periodLabel(period),
      sourceFile: dp.sourceFile,
      createdAt: dp.createdAt,
      closingBalance: snap ? Number(snap.balance) : null,
    };
  });
}
