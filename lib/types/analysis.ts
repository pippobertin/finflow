/** Analysis engine types */

export interface AnalysisFilter {
  organizationId: string;
  costCenterIds?: string[];
  startDate?: Date;
  endDate?: Date;
}

// ── Trend ───────────────────────────────────────────────────

export interface TrendDataPoint {
  date: string; // YYYY-MM
  value: number;
  movingAverage?: number;
  growthRate?: number; // month-over-month %
}

export interface TrendResult {
  dataPoints: TrendDataPoint[];
  slope: number;
  intercept: number;
  rSquared: number;
  direction: "up" | "down" | "flat";
}

// ── Seasonality ─────────────────────────────────────────────

export interface SeasonalIndex {
  month: number; // 0-11
  index: number; // ratio vs overall mean
  label: string; // "Gen", "Feb", etc.
}

export interface SeasonalityResult {
  hasSeasonality: boolean;
  variance: number;
  indices: SeasonalIndex[];
}

// ── Forecast ────────────────────────────────────────────────

export interface ForecastPoint {
  date: string; // YYYY-MM
  projected: number;
  lower: number; // confidence interval lower
  upper: number; // confidence interval upper
}

export interface ForecastResult {
  historical: TrendDataPoint[];
  forecast: ForecastPoint[];
  trend: TrendResult;
  seasonality: SeasonalityResult;
}

// ── Anomaly ─────────────────────────────────────────────────

export type AnomalySeverity = "HIGH" | "MEDIUM" | "LOW";

export interface Anomaly {
  id: string;
  date: Date;
  description: string;
  amount: number;
  zScore: number;
  severity: AnomalySeverity;
  type: "inflow" | "outflow";
}

export interface AnomalyResult {
  anomalies: Anomaly[];
  inflowStats: { mean: number; stdDev: number };
  outflowStats: { mean: number; stdDev: number };
}
