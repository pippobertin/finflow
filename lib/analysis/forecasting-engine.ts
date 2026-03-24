import {
  linearRegression,
  linearRegressionLine,
  rSquared,
  standardDeviation,
  mean,
} from "simple-statistics";
import { prisma } from "@/lib/prisma";
import { MONTH_LABELS } from "@/lib/helpers/format";
import type {
  AnalysisFilter,
  TrendResult,
  TrendDataPoint,
  SeasonalityResult,
  SeasonalIndex,
  ForecastResult,
  ForecastPoint,
  AnomalyResult,
  Anomaly,
  AnomalySeverity,
} from "@/lib/types/analysis";

// ── Helpers ─────────────────────────────────────────────────

function toYearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildDateFilter(filter: AnalysisFilter) {
  const where: Record<string, unknown> = {
    organizationId: filter.organizationId,
  };
  if (filter.startDate || filter.endDate) {
    where.date = {
      ...(filter.startDate && { gte: filter.startDate }),
      ...(filter.endDate && { lte: filter.endDate }),
    };
  }
  if (filter.costCenterIds?.length) {
    where.costCenterId = { in: filter.costCenterIds };
  }
  return where;
}

// ── 1. Trend Analysis ───────────────────────────────────────

export async function analyzeTrend(filter: AnalysisFilter): Promise<TrendResult> {
  const snapshots = await prisma.cashflowSnapshot.findMany({
    where: buildDateFilter(filter),
    orderBy: { date: "asc" },
  });

  const dataPoints: TrendDataPoint[] = [];
  const values = snapshots.map((s) => Number(s.netFlow));

  for (let i = 0; i < snapshots.length; i++) {
    const s = snapshots[i];
    const value = Number(s.netFlow);

    // 3-month moving average
    let movingAverage: number | undefined;
    if (i >= 2) {
      movingAverage = (values[i - 2] + values[i - 1] + values[i]) / 3;
    }

    // Month-over-month growth rate
    let growthRate: number | undefined;
    if (i > 0 && values[i - 1] !== 0) {
      growthRate = (value - values[i - 1]) / Math.abs(values[i - 1]);
    }

    dataPoints.push({
      date: toYearMonth(s.date),
      value,
      movingAverage,
      growthRate,
    });
  }

  // Linear regression: pairs = [[index, value], ...]
  const pairs: [number, number][] = values.map((v, i) => [i, v]);
  let slope = 0;
  let intercept = 0;
  let r2 = 0;

  if (pairs.length >= 2) {
    const reg = linearRegression(pairs);
    slope = reg.m;
    intercept = reg.b;
    const line = linearRegressionLine(reg);
    r2 = rSquared(pairs, line);
  }

  const direction =
    Math.abs(slope) < 0.01 * (mean(values) || 1) ? "flat" : slope > 0 ? "up" : "down";

  return { dataPoints, slope, intercept, rSquared: r2, direction };
}

// ── 2. Seasonality Detection ────────────────────────────────

export async function detectSeasonality(filter: AnalysisFilter): Promise<SeasonalityResult> {
  const snapshots = await prisma.cashflowSnapshot.findMany({
    where: buildDateFilter(filter),
    orderBy: { date: "asc" },
  });

  // Group values by calendar month (0-11)
  const monthBuckets: number[][] = Array.from({ length: 12 }, () => []);
  for (const s of snapshots) {
    monthBuckets[s.date.getMonth()].push(Number(s.netFlow));
  }

  const allValues = snapshots.map((s) => Number(s.netFlow));
  const overallMean = allValues.length > 0 ? mean(allValues) : 0;

  const indices: SeasonalIndex[] = monthBuckets.map((bucket, month) => {
    const monthMean = bucket.length > 0 ? mean(bucket) : 0;
    return {
      month,
      index: overallMean !== 0 ? monthMean / overallMean : 1,
      label: MONTH_LABELS[month],
    };
  });

  const indexValues = indices.map((i) => i.index);
  const variance = indexValues.length > 1 ? standardDeviation(indexValues) ** 2 : 0;

  return {
    hasSeasonality: variance > 0.05,
    variance,
    indices,
  };
}

// ── 3. Forecast ─────────────────────────────────────────────

export async function forecast(
  filter: AnalysisFilter,
  options: { months: 3 | 6 | 12 } = { months: 3 },
): Promise<ForecastResult> {
  const trend = await analyzeTrend(filter);
  const seasonality = await detectSeasonality(filter);

  const n = trend.dataPoints.length;
  const line = linearRegressionLine({ m: trend.slope, b: trend.intercept });

  // Calculate residual std dev for confidence interval
  const residuals = trend.dataPoints.map((dp, i) => dp.value - line(i));
  const residualStdDev = residuals.length > 1 ? standardDeviation(residuals) : 0;

  // Determine starting month
  const lastDataPoint = trend.dataPoints[n - 1];
  const lastDate = lastDataPoint ? new Date(lastDataPoint.date + "-01") : new Date();

  const forecastPoints: ForecastPoint[] = [];
  for (let m = 1; m <= options.months; m++) {
    const futureDate = new Date(lastDate);
    futureDate.setMonth(futureDate.getMonth() + m);
    const calMonth = futureDate.getMonth();

    const trendValue = line(n - 1 + m);
    const seasonalIndex = seasonality.indices[calMonth]?.index ?? 1;
    const projected = trendValue * seasonalIndex;
    const margin = 1.96 * residualStdDev;

    forecastPoints.push({
      date: toYearMonth(futureDate),
      projected: Math.round(projected * 100) / 100,
      lower: Math.round((projected - margin) * 100) / 100,
      upper: Math.round((projected + margin) * 100) / 100,
    });
  }

  return {
    historical: trend.dataPoints,
    forecast: forecastPoints,
    trend,
    seasonality,
  };
}

// ── 4. Anomaly Detection ────────────────────────────────────

export async function detectAnomalies(filter: AnalysisFilter): Promise<AnomalyResult> {
  const statements = await prisma.bankStatement.findMany({
    where: buildDateFilter(filter),
    orderBy: { date: "asc" },
  });

  const inflows = statements.filter((s) => Number(s.amount) > 0);
  const outflows = statements.filter((s) => Number(s.amount) < 0);

  function computeStats(items: typeof statements) {
    const amounts = items.map((s) => Math.abs(Number(s.amount)));
    return {
      mean: amounts.length > 0 ? mean(amounts) : 0,
      stdDev: amounts.length > 1 ? standardDeviation(amounts) : 0,
    };
  }

  const inflowStats = computeStats(inflows);
  const outflowStats = computeStats(outflows);

  function findAnomalies(
    items: typeof statements,
    stats: { mean: number; stdDev: number },
    type: "inflow" | "outflow",
  ): Anomaly[] {
    if (stats.stdDev === 0) return [];

    return items
      .map((s) => {
        const amount = Math.abs(Number(s.amount));
        const zScore = (amount - stats.mean) / stats.stdDev;
        if (Math.abs(zScore) <= 2.5) return null;

        let severity: AnomalySeverity = "LOW";
        if (Math.abs(zScore) > 4) severity = "HIGH";
        else if (Math.abs(zScore) > 3) severity = "MEDIUM";

        return {
          id: s.id,
          date: s.date,
          description: s.description,
          amount: Number(s.amount),
          zScore: Math.round(zScore * 100) / 100,
          severity,
          type,
        } satisfies Anomaly;
      })
      .filter((a): a is Anomaly => a !== null);
  }

  return {
    anomalies: [
      ...findAnomalies(inflows, inflowStats, "inflow"),
      ...findAnomalies(outflows, outflowStats, "outflow"),
    ].sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore)),
    inflowStats,
    outflowStats,
  };
}
