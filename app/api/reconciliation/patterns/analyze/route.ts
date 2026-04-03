import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

interface AnalyzeResult {
  matchCount: number;
  averageAmount: number;
  detectedFrequency: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";
  detectedDayOfMonth: number | null;
  customDays: number | null;
  counterpart: string | null;
  startDate: string;
  amounts: number[];
  dates: string[];
  /** Number of complete periods used for the average */
  periodsUsed: number;
  /** Per-period totals (e.g. monthly sums) */
  periodTotals: number[];
}

/**
 * Group matched movements by period bucket (YYYY-MM for monthly, YYYY-QN for quarterly, YYYY for annual).
 * Returns a map of period key → total amount for that period.
 */
function groupByPeriod(
  dates: Date[],
  amounts: number[],
  frequency: AnalyzeResult["detectedFrequency"],
): Map<string, number> {
  const groups = new Map<string, number>();
  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    let key: string;
    if (frequency === "ANNUAL") {
      key = `${d.getFullYear()}`;
    } else if (frequency === "QUARTERLY") {
      const q = Math.floor(d.getMonth() / 3) + 1;
      key = `${d.getFullYear()}-Q${q}`;
    } else {
      // MONTHLY or CUSTOM — group by month
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    groups.set(key, (groups.get(key) ?? 0) + amounts[i]);
  }
  return groups;
}

/**
 * Detect frequency by first grouping movements by month and checking
 * how many months have matches. If most months have matches → MONTHLY.
 * Otherwise check quarterly/annual groupings.
 */
function detectFrequency(dates: Date[]): {
  frequency: AnalyzeResult["detectedFrequency"];
  customDays: number | null;
} {
  if (dates.length < 2) return { frequency: "MONTHLY", customDays: null };

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());

  // Group by month first to see how many distinct months have matches
  const monthKeys = new Set<string>();
  for (const d of sorted) {
    monthKeys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  // Calculate total month span between first and last movement
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const monthSpan =
    (last.getFullYear() - first.getFullYear()) * 12 + (last.getMonth() - first.getMonth()) + 1;

  // If at least 50% of months in the span have matches → MONTHLY
  if (monthKeys.size >= Math.max(2, monthSpan * 0.5)) {
    return { frequency: "MONTHLY", customDays: null };
  }

  // Check quarterly
  const quarterKeys = new Set<string>();
  for (const d of sorted) {
    const q = Math.floor(d.getMonth() / 3) + 1;
    quarterKeys.add(`${d.getFullYear()}-Q${q}`);
  }
  const quarterSpan = Math.ceil(monthSpan / 3);
  if (quarterKeys.size >= Math.max(2, quarterSpan * 0.5)) {
    return { frequency: "QUARTERLY", customDays: null };
  }

  // Check annual
  const yearKeys = new Set<string>();
  for (const d of sorted) yearKeys.add(`${d.getFullYear()}`);
  if (yearKeys.size >= 2) {
    return { frequency: "ANNUAL", customDays: null };
  }

  // Fallback: compute average interval between individual movements
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = Math.round(
      (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24),
    );
    intervals.push(days);
  }
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  if (avgInterval >= 25 && avgInterval <= 35) return { frequency: "MONTHLY", customDays: null };
  if (avgInterval >= 80 && avgInterval <= 100) return { frequency: "QUARTERLY", customDays: null };
  if (avgInterval >= 340 && avgInterval <= 395) return { frequency: "ANNUAL", customDays: null };
  return { frequency: "CUSTOM", customDays: Math.round(avgInterval) };
}

function detectDayOfMonth(dates: Date[]): number | null {
  if (dates.length < 2) return dates[0]?.getDate() ?? null;

  const days = dates.map((d) => d.getDate());
  // Most common day
  const counts = new Map<number, number>();
  for (const d of days) counts.set(d, (counts.get(d) ?? 0) + 1);
  let bestDay = days[0];
  let bestCount = 0;
  for (const [day, count] of counts) {
    if (count > bestCount) {
      bestDay = day;
      bestCount = count;
    }
  }
  return bestDay;
}

// POST: Analyze bank statement outflows matching a regex to detect periodicity
export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const { regex, flags } = body;

  if (!regex) {
    return Response.json({ error: "Campo obbligatorio: regex" }, { status: 400 });
  }

  let re: RegExp;
  try {
    re = new RegExp(regex, flags ?? "i");
  } catch {
    return Response.json({ error: "Regex non valida" }, { status: 400 });
  }

  // Fetch ALL bank statements (outflows only) for the org
  const movements = await prisma.bankStatement.findMany({
    where: { organizationId },
    select: { description: true, amount: true, date: true },
    orderBy: { date: "asc" },
  });

  const matchedAmounts: number[] = [];
  const matchedDates: Date[] = [];
  let counterpart: string | null = null;

  for (const m of movements) {
    const amount = Number(m.amount);
    // Only outflows (negative amounts)
    if (amount >= 0) continue;

    re.lastIndex = 0;
    const match = re.exec(m.description);
    if (match) {
      matchedAmounts.push(Math.abs(amount));
      matchedDates.push(m.date);
      // Use first captured group as counterpart hint
      if (!counterpart && match[1]) {
        counterpart = match[1].trim();
      }
    }
  }

  if (matchedAmounts.length === 0) {
    return Response.json({
      matchCount: 0,
      averageAmount: 0,
      detectedFrequency: "MONTHLY",
      detectedDayOfMonth: null,
      customDays: null,
      counterpart: null,
      startDate: new Date().toISOString(),
      amounts: [],
      dates: [],
      periodsUsed: 0,
      periodTotals: [],
    } satisfies AnalyzeResult);
  }

  const { frequency, customDays } = detectFrequency(matchedDates);
  const dayOfMonth = detectDayOfMonth(matchedDates);

  // Group movements by period and sum each period's amounts
  const periodGroups = groupByPeriod(matchedDates, matchedAmounts, frequency);
  const periodTotals = [...periodGroups.values()].map((v) => Math.round(v * 100) / 100);

  // Use only periods with at least 3 data points for a reliable average,
  // but if we have fewer periods, use what we have
  const periodsUsed = periodTotals.length;
  const avgAmount = periodsUsed > 0 ? periodTotals.reduce((a, b) => a + b, 0) / periodsUsed : 0;

  return Response.json({
    matchCount: matchedAmounts.length,
    averageAmount: Math.round(avgAmount * 100) / 100,
    detectedFrequency: frequency,
    detectedDayOfMonth: dayOfMonth,
    customDays,
    counterpart,
    startDate: matchedDates[0].toISOString(),
    amounts: matchedAmounts,
    dates: matchedDates.map((d) => d.toISOString()),
    periodsUsed,
    periodTotals,
  } satisfies AnalyzeResult);
}
