"use client";

import { useMemo, useRef } from "react";
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
import type { CashflowProjectionResult } from "@/lib/types/cashflow";

interface CashflowClientProps {
  initialData: CashflowProjectionResult;
}

export function CashflowClient({ initialData }: CashflowClientProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { data } = useCashflowProjection(initialData);
  const { days, scenario, threshold, whatIf } = useCashflowSettings();

  const projectionData = data ?? initialData;

  // Apply scenario → what-if → slice by days
  const processedData = useMemo(() => {
    if (!projectionData.projection.length) return [];

    const afterScenario = applyScenario(
      projectionData.projection,
      projectionData.startingBalance,
      scenario,
    );

    const afterWhatIf = applyWhatIf(
      afterScenario,
      projectionData.startingBalance,
      whatIf,
      projectionData.avgDso,
    );

    return afterWhatIf.slice(0, days);
  }, [projectionData, scenario, whatIf, days]);

  return (
    <>
      <Navbar title="Previsione Cashflow" />
      <div className="space-y-6 p-6">
        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-4">
          <ScenarioSelector />
          <TimeHorizonSlider />
          <ThresholdLineInput />
          <div className="ml-auto">
            <CashflowPdfExport chartContainerRef={chartContainerRef} />
          </div>
        </div>

        {/* Charts */}
        <div ref={chartContainerRef} className="space-y-6">
          <MainForecastChart data={processedData} threshold={threshold} />
          <DecompositionChart data={processedData} />
        </div>

        {/* What-If Panel */}
        <WhatIfPanel
          avgDso={projectionData.avgDso}
          totalPendingActiveGross={projectionData.totalPendingActiveGross}
        />
      </div>
    </>
  );
}
