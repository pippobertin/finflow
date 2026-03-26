"use client";

import { useState, useMemo, useCallback } from "react";
import { format, addDays, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Navbar } from "@/components/dashboard/navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KpiGrid } from "./kpi-grid";
import { BalanceChartSection } from "./balance-chart-section";
import { CategoryChartSection } from "./category-chart-section";
import { DistributionSection } from "./distribution-section";
import { ForecastChartSection } from "./forecast-chart-section";
import { DecompositionChartSection } from "./decomposition-chart-section";
import { OverviewTimeSlider } from "./overview-time-slider";
import { useOverview, useCashflowForecast } from "@/lib/hooks/use-overview";
import type { OverviewData } from "@/lib/queries/overview";

interface OverviewClientProps {
  initialData: OverviewData;
}

function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// Downsample for chart rendering (keep every Nth point when > 80 points)
function downsample<T>(data: T[], maxPoints = 80): T[] {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  const result: T[] = [];
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }
  return result;
}

export function OverviewClient({ initialData }: OverviewClientProps) {
  const today = useMemo(() => new Date(), []);
  const [dateFrom, setDateFrom] = useState(toIsoDate(today));
  const [dateTo, setDateTo] = useState(toIsoDate(addDays(today, 90)));

  const { data } = useOverview(initialData, dateFrom, dateTo);
  const overview = data ?? initialData;

  // Cashflow forecast for the two projection charts + slider
  const {
    data: timeline,
    isLoading: timelineLoading,
    isError: timelineError,
  } = useCashflowForecast();

  // Slider range state (index-based into fullTimeline)
  const [sliderRange, setSliderRange] = useState<[number, number] | null>(null);

  const timelineLength = timeline?.fullTimeline?.length ?? 0;
  const historyLength = timeline?.historyLength ?? 0;

  // Initialize slider range when data arrives
  const effectiveRange = useMemo((): [number, number] => {
    if (sliderRange) return sliderRange;
    if (!timelineLength) return [0, 0];
    // Default: from today (historyLength) + 90 days of projection
    const start = historyLength;
    const end = Math.min(historyLength + 90, timelineLength - 1);
    return [start, end];
  }, [sliderRange, timelineLength, historyLength]);

  const handleSliderChange = useCallback((range: [number, number]) => {
    setSliderRange(range);
  }, []);

  // Sliced + downsampled data for the charts
  const forecastData = useMemo(() => {
    if (!timeline?.fullTimeline) return [];
    const sliced = timeline.fullTimeline.slice(effectiveRange[0], effectiveRange[1] + 1);
    return downsample(sliced);
  }, [timeline, effectiveRange]);

  // For decomposition: only the projection (future) portion of the visible range
  const decompositionData = useMemo(() => {
    if (!timeline?.fullTimeline) return [];
    const projStart = Math.max(effectiveRange[0], historyLength);
    if (projStart >= effectiveRange[1]) return [];
    const sliced = timeline.fullTimeline.slice(projStart, effectiveRange[1] + 1);
    return downsample(sliced);
  }, [timeline, effectiveRange, historyLength]);

  const allDates = useMemo(() => timeline?.fullTimeline?.map((p) => p.date) ?? [], [timeline]);

  const rangeLabel = useMemo(() => {
    try {
      const from = format(parseISO(dateFrom), "dd MMM yyyy", { locale: it });
      const to = format(parseISO(dateTo), "dd MMM yyyy", { locale: it });
      return `${from} → ${to}`;
    } catch {
      return "";
    }
  }, [dateFrom, dateTo]);

  const showForecastSection = !timelineLoading && !timelineError && timelineLength > 0;

  return (
    <>
      <Navbar title="Panoramica" />
      <div className="space-y-6 p-6">
        {/* Date range picker row */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label htmlFor="kpi-from" className="text-muted-foreground text-xs">
              Da
            </Label>
            <Input
              id="kpi-from"
              type="date"
              className="w-40"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="kpi-to" className="text-muted-foreground text-xs">
              A
            </Label>
            <Input
              id="kpi-to"
              type="date"
              className="w-40"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <p className="text-muted-foreground pb-2 text-xs">
            Intervallo per crediti, debiti e saldo proiettato
          </p>
        </div>

        {/* KPI Cards */}
        <KpiGrid kpis={overview.kpis} rangeLabel={rangeLabel} />

        {/* Balance chart (compacted 30%) */}
        <BalanceChartSection historicalData={overview.balanceChart} />

        {/* Forecast section: slider + charts */}
        {timelineLoading && (
          <div className="space-y-4">
            <div className="skeleton-shimmer h-12 rounded-lg" />
            <div className="skeleton-shimmer h-[300px] rounded-lg" />
          </div>
        )}

        {showForecastSection && (
          <>
            {/* Time horizon slider */}
            <OverviewTimeSlider
              totalLength={timelineLength}
              historyLength={historyLength}
              dates={allDates}
              value={effectiveRange}
              onChange={handleSliderChange}
            />

            {/* Daily forecast projection */}
            <ForecastChartSection data={forecastData} historyLength={historyLength} />

            {/* Flow decomposition */}
            <DecompositionChartSection data={decompositionData} />
          </>
        )}

        {/* Revenue distribution + Expense distribution side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryChartSection data={overview.revenueDistribution} />
          <DistributionSection data={overview.distribution} />
        </div>
      </div>
    </>
  );
}
