"use client";

import { useEffect, useMemo, useRef } from "react";
import { Clock } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { useCashflowProjection } from "@/lib/hooks/use-cashflow";
import { useCashflowSettings } from "@/lib/stores/cashflow-settings";
import { applyScenario } from "@/lib/cashflow/scenario-engine";
import { applyWhatIf } from "@/lib/cashflow/whatif-engine";
import { ScenarioSelector } from "./scenario-selector";
import { TimeHorizonSlider } from "./time-horizon-slider";
import { ThresholdLineInput } from "./threshold-line-input";
import { MainForecastChart } from "./main-forecast-chart";
import { DecompositionChart } from "./decomposition-chart";
import { WhatIfPanel } from "./whatif-panel";
import { CashflowPdfExport } from "./cashflow-pdf-export";
import { formatEUR } from "@/lib/helpers/format";
import type { CashflowTimelineResult } from "@/lib/types/cashflow";

interface CashflowClientProps {
  initialData: CashflowTimelineResult;
}

export function CashflowClient({ initialData }: CashflowClientProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { data } = useCashflowProjection(initialData);
  const { viewRange, setViewRange, setHistoryLength, scenario, threshold, whatIf } =
    useCashflowSettings();

  const timelineData = data ?? initialData;

  // Initialize viewRange and historyLength when data loads
  const historyLen = timelineData.historyLength;
  useEffect(() => {
    setHistoryLength(historyLen);
    // Default: from today (historyLength) to today + 90 days
    setViewRange([historyLen, Math.min(historyLen + 90, timelineData.fullTimeline.length - 1)]);
  }, [historyLen, timelineData.fullTimeline.length, setHistoryLength, setViewRange]);

  // Apply scenario → what-if ONLY to projection; history stays as-is (real data)
  const processedData = useMemo(() => {
    const timeline = timelineData.fullTimeline;
    if (!timeline.length) return [];

    const histLen = timelineData.historyLength;
    const historyPart = timeline.slice(0, histLen);
    const projectionPart = timeline.slice(histLen);

    const afterScenario = applyScenario(projectionPart, timelineData.startingBalance, scenario);

    const afterWhatIf = applyWhatIf(
      afterScenario,
      timelineData.startingBalance,
      whatIf,
      timelineData.avgDso,
    );

    const full = [...historyPart, ...afterWhatIf];
    return full.slice(viewRange[0], viewRange[1] + 1);
  }, [timelineData, scenario, whatIf, viewRange]);

  // Extract all dates for the slider
  const allDates = useMemo(
    () => timelineData.fullTimeline.map((p) => p.date),
    [timelineData.fullTimeline],
  );

  return (
    <>
      <Navbar title="Previsione Cashflow" />
      <div className="space-y-6 p-6">
        {/* KPI row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-muted/50 flex items-center gap-2 rounded-lg border px-3 py-2">
            <Clock className="text-muted-foreground h-4 w-4" />
            <div className="text-xs">
              <span className="text-muted-foreground">DSO medio</span>
              <span className="ml-1.5 font-semibold">{timelineData.avgDso} gg</span>
            </div>
          </div>
          <div className="bg-muted/50 flex items-center gap-2 rounded-lg border px-3 py-2">
            <div className="text-xs">
              <span className="text-muted-foreground">Incassi attesi</span>
              <span className="ml-1.5 font-semibold">
                {formatEUR(timelineData.totalPendingActiveGross)}
              </span>
            </div>
          </div>
          <div className="bg-muted/50 flex items-center gap-2 rounded-lg border px-3 py-2">
            <div className="text-xs">
              <span className="text-muted-foreground">Saldo attuale</span>
              <span className="ml-1.5 font-semibold">
                {formatEUR(timelineData.startingBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-4">
          <ScenarioSelector />
          <ThresholdLineInput />
          <div className="ml-auto">
            <CashflowPdfExport chartContainerRef={chartContainerRef} />
          </div>
        </div>

        {/* Charts with slider in between */}
        <div ref={chartContainerRef} className="space-y-6">
          <MainForecastChart data={processedData} threshold={threshold} />

          <TimeHorizonSlider
            timelineLength={timelineData.fullTimeline.length}
            historyLength={historyLen}
            dates={allDates}
          />

          <DecompositionChart data={processedData} />
        </div>

        {/* What-If Panel */}
        <WhatIfPanel
          avgDso={timelineData.avgDso}
          totalPendingActiveGross={timelineData.totalPendingActiveGross}
        />
      </div>
    </>
  );
}
