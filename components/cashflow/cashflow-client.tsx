"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Plus,
  Trash2,
  Power,
  TrendingUp,
  TrendingDown,
  Ban,
  Receipt,
  RotateCcw,
  ArrowDownUp,
  ArrowUpRight,
  Wallet,
  Zap,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCashflowProjection } from "@/lib/hooks/use-cashflow";
import { useCashflowSettings } from "@/lib/stores/cashflow-settings";
import { applyScenario } from "@/lib/cashflow/scenario-engine";
import { applyWhatIf } from "@/lib/cashflow/whatif-engine";
import { ScenarioSelector } from "./scenario-selector";
import { TimeHorizonSlider } from "./time-horizon-slider";
import { ThresholdLineInput } from "./threshold-line-input";
import { MainForecastChart } from "./main-forecast-chart";
import { DecompositionChart } from "./decomposition-chart";
import { CashflowPdfExport } from "./cashflow-pdf-export";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatEUR } from "@/lib/helpers/format";
import type { CashflowTimelineResult, WhatIfEvent } from "@/lib/types/cashflow";

interface CashflowClientProps {
  initialData: CashflowTimelineResult;
}

const EVENT_TYPES = [
  {
    value: "extraIncome",
    label: "Entrata straordinaria",
    icon: TrendingUp,
    color: "text-emerald-600",
  },
  {
    value: "extraExpense",
    label: "Uscita straordinaria",
    icon: TrendingDown,
    color: "text-red-600",
  },
  {
    value: "temporaryRecurring",
    label: "Spesa ricorrente temporanea",
    icon: Receipt,
    color: "text-amber-600",
  },
  { value: "missedCollection", label: "Mancato incasso", icon: Ban, color: "text-red-600" },
  {
    value: "vatAnticipation",
    label: "Anticipo/Ritardo IVA",
    icon: ArrowDownUp,
    color: "text-violet-600",
  },
] as const;

let eventIdCounter = 0;
function genId() {
  return `wi-${Date.now()}-${++eventIdCounter}`;
}

export function CashflowClient({ initialData }: CashflowClientProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { data } = useCashflowProjection(initialData);
  const {
    viewRange,
    setViewRange,
    setHistoryLength,
    scenario,
    threshold,
    whatIf,
    whatIfEvents,
    addWhatIfEvent,
    removeWhatIfEvent,
    toggleWhatIfEvent,
    clearWhatIfEvents,
    resetWhatIf,
  } = useCashflowSettings();

  const timelineData = data ?? initialData;
  const historyLen = timelineData.historyLength;

  // New event form state
  const [newEventType, setNewEventType] = useState<string>("extraExpense");
  const [newEventName, setNewEventName] = useState("");
  const [newEventAmount, setNewEventAmount] = useState("");
  const [newEventDate, setNewEventDate] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [newEventEndDate, setNewEventEndDate] = useState(
    format(addDays(new Date(), 180), "yyyy-MM-dd"),
  );
  const [newEventPct, setNewEventPct] = useState("20");

  useEffect(() => {
    setHistoryLength(historyLen);
    setViewRange([historyLen, Math.min(historyLen + 90, timelineData.fullTimeline.length - 1)]);
  }, [historyLen, timelineData.fullTimeline.length, setHistoryLength, setViewRange]);

  // Base data (no what-if)
  const baseData = useMemo(() => {
    const timeline = timelineData.fullTimeline;
    if (!timeline.length) return [];
    const histPart = timeline.slice(0, historyLen);
    const projPart = timeline.slice(historyLen);
    const afterScenario = applyScenario(projPart, timelineData.startingBalance, scenario);
    return [...histPart, ...afterScenario].slice(viewRange[0], viewRange[1] + 1);
  }, [timelineData, scenario, viewRange, historyLen]);

  // What-if data (with events applied)
  const whatIfData = useMemo(() => {
    const timeline = timelineData.fullTimeline;
    if (!timeline.length) return [];
    const histPart = timeline.slice(0, historyLen);
    const projPart = timeline.slice(historyLen);
    const afterScenario = applyScenario(projPart, timelineData.startingBalance, scenario);

    // Apply legacy what-if params
    let afterWhatIf = applyWhatIf(
      afterScenario,
      timelineData.startingBalance,
      whatIf,
      timelineData.avgDso,
    );

    // Apply new event-based what-if
    const enabledEvents = whatIfEvents.filter((e) => e.enabled);
    if (enabledEvents.length > 0) {
      afterWhatIf = applyWhatIfEvents(afterWhatIf, enabledEvents, timelineData.startingBalance);
    }

    return [...histPart, ...afterWhatIf].slice(viewRange[0], viewRange[1] + 1);
  }, [timelineData, scenario, whatIf, whatIfEvents, viewRange, historyLen]);

  // Impact: difference between base and what-if at the end of the range
  const impactTotal = useMemo(() => {
    if (!baseData.length || !whatIfData.length) return 0;
    const baseEnd = baseData[baseData.length - 1]?.balance ?? 0;
    const wiEnd = whatIfData[whatIfData.length - 1]?.balance ?? 0;
    return wiEnd - baseEnd;
  }, [baseData, whatIfData]);

  const hasActiveEvents =
    whatIfEvents.some((e) => e.enabled) ||
    whatIf.extraExpense > 0 ||
    whatIf.missedCollectionPct > 0;

  const allDates = useMemo(
    () => timelineData.fullTimeline.map((p) => p.date),
    [timelineData.fullTimeline],
  );

  function handleAddEvent() {
    const amount = parseFloat(newEventAmount) || 0;
    if (!newEventName.trim() && newEventType !== "missedCollection") return;

    const event: WhatIfEvent = {
      id: genId(),
      type: newEventType as WhatIfEvent["type"],
      name: newEventName || EVENT_TYPES.find((t) => t.value === newEventType)?.label || "",
      amount,
      date: newEventDate,
      endDate: newEventType === "temporaryRecurring" ? newEventEndDate : undefined,
      frequency: newEventType === "temporaryRecurring" ? "MONTHLY" : undefined,
      percentage: newEventType === "missedCollection" ? parseFloat(newEventPct) || 0 : undefined,
      enabled: true,
    };
    addWhatIfEvent(event);
    setNewEventName("");
    setNewEventAmount("");
  }

  function handleResetAll() {
    resetWhatIf();
    clearWhatIfEvents();
  }

  return (
    <>
      <Navbar title="What If — Simulatore Scenari" />
      <motion.div
        className="space-y-6 p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* KPI cards */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="DSO medio"
            value={`${timelineData.avgDso} gg`}
            icon={Clock}
            accentColor="blue"
          />
          <KpiCard
            title="Incassi attesi"
            value={formatEUR(timelineData.totalPendingActiveGross)}
            icon={ArrowUpRight}
            accentColor="green"
          />
          <KpiCard
            title="Saldo attuale"
            value={formatEUR(timelineData.startingBalance)}
            icon={Wallet}
            accentColor="purple"
          />
          {hasActiveEvents && (
            <KpiCard
              title="Impatto What If"
              value={`${impactTotal >= 0 ? "+" : ""}${formatEUR(impactTotal)}`}
              icon={Zap}
              accentColor="red"
              trend={
                impactTotal !== 0
                  ? {
                      value: `${impactTotal >= 0 ? "+" : ""}${formatEUR(impactTotal)}`,
                      positive: impactTotal >= 0,
                    }
                  : undefined
              }
            />
          )}
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-4">
          <ScenarioSelector />
          <ThresholdLineInput />
          <div className="ml-auto">
            <CashflowPdfExport chartContainerRef={chartContainerRef} />
          </div>
        </div>

        {/* Main chart — dual curve when events active */}
        <div ref={chartContainerRef} className="space-y-6">
          <MainForecastChart
            data={hasActiveEvents ? whatIfData : baseData}
            baseData={hasActiveEvents ? baseData : undefined}
            threshold={threshold}
          />

          <TimeHorizonSlider
            timelineLength={timelineData.fullTimeline.length}
            historyLength={historyLen}
            dates={allDates}
          />

          <DecompositionChart data={hasActiveEvents ? whatIfData : baseData} />
        </div>

        {/* What-If Events Panel */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Eventi What If</CardTitle>
            <Button size="sm" variant="outline" onClick={handleResetAll} className="gap-1.5">
              <RotateCcw className="h-3 w-3" />
              Reset tutto
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Active events list */}
            {whatIfEvents.length > 0 && (
              <div className="space-y-2">
                {whatIfEvents.map((event) => {
                  const typeInfo = EVENT_TYPES.find((t) => t.value === event.type);
                  const TypeIcon = typeInfo?.icon ?? TrendingDown;
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-opacity ${
                        event.enabled ? "opacity-100" : "opacity-40"
                      }`}
                    >
                      <TypeIcon className={`h-4 w-4 ${typeInfo?.color ?? ""}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {event.type === "missedCollection"
                            ? `${event.percentage}% del portafoglio`
                            : formatEUR(event.amount)}
                          {event.date && ` — ${event.date}`}
                          {event.endDate && ` → ${event.endDate}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => toggleWhatIfEvent(event.id)}
                      >
                        <Power
                          className={`h-3.5 w-3.5 ${event.enabled ? "text-emerald-500" : "text-muted-foreground"}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                        onClick={() => removeWhatIfEvent(event.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add new event form */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Aggiungi evento</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={newEventType} onValueChange={(v) => v && setNewEventType(v)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    placeholder="Es. Acquisto macchinario"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                {newEventType === "missedCollection" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Percentuale</Label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={newEventPct}
                      onChange={(e) => setNewEventPct(e.target.value)}
                      className="font-numeric text-xs"
                      min="0"
                      max="100"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Importo</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={newEventAmount}
                      onChange={(e) => setNewEventAmount(e.target.value)}
                      className="font-numeric text-xs"
                      min="0"
                      step="100"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Data</Label>
                  <Input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
              {newEventType === "temporaryRecurring" && (
                <div className="grid grid-cols-2 gap-3 sm:w-1/2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data fine</Label>
                    <Input
                      type="date"
                      value={newEventEndDate}
                      onChange={(e) => setNewEventEndDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}
              <Button size="sm" onClick={handleAddEvent} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Aggiungi evento
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

/**
 * Apply event-based what-if adjustments to projection data.
 */
function applyWhatIfEvents(
  projection: DailyProjectionPoint[],
  events: WhatIfEvent[],
  startingBalance: number,
) {
  // Deep copy
  const adjusted = projection.map((p) => ({
    ...p,
    details: [...p.details],
  }));

  for (const event of events) {
    switch (event.type) {
      case "extraIncome": {
        const idx = adjusted.findIndex((p) => p.date === event.date);
        if (idx >= 0) {
          adjusted[idx].activeInvoices += event.amount;
          adjusted[idx].details.push({
            id: event.id,
            type: "activeInvoice",
            label: `${event.name} (what-if)`,
            amount: event.amount,
          });
        }
        break;
      }
      case "extraExpense": {
        const idx = adjusted.findIndex((p) => p.date === event.date);
        if (idx >= 0) {
          adjusted[idx].oneOffExpenses += event.amount;
          adjusted[idx].details.push({
            id: event.id,
            type: "oneOffExpense",
            label: `${event.name} (what-if)`,
            amount: event.amount,
          });
        }
        break;
      }
      case "temporaryRecurring": {
        if (!event.date || !event.endDate) break;
        const startDate = new Date(event.date);
        const endDate = new Date(event.endDate);
        // Monthly occurrences
        let current = startDate;
        while (current <= endDate) {
          const key = format(current, "yyyy-MM-dd");
          const point = adjusted.find((p) => p.date === key);
          if (point) {
            point.recurringExpenses += event.amount;
            point.details.push({
              id: event.id,
              type: "recurringExpense",
              label: `${event.name} (what-if)`,
              amount: event.amount,
            });
          }
          current = addDays(current, 30); // approximate monthly
        }
        break;
      }
      case "missedCollection": {
        const factor = 1 - (event.percentage ?? 0) / 100;
        for (const point of adjusted) {
          point.activeInvoices = Math.round(point.activeInvoices * factor * 100) / 100;
          point.futureReceivables = Math.round(point.futureReceivables * factor * 100) / 100;
        }
        break;
      }
      case "vatAnticipation": {
        // Shift all VAT payments by the amount (positive = anticipate, negative = delay)
        for (const point of adjusted) {
          if (point.vatPayments && point.vatPayments > 0) {
            const idx = adjusted.indexOf(point);
            const shiftDays =
              event.amount > 0 ? -Math.round(event.amount) : Math.round(Math.abs(event.amount));
            const targetIdx = idx + shiftDays;
            if (targetIdx >= 0 && targetIdx < adjusted.length) {
              adjusted[targetIdx].vatPayments =
                (adjusted[targetIdx].vatPayments ?? 0) + point.vatPayments;
              point.vatPayments = 0;
            }
          }
        }
        break;
      }
    }
  }

  // Recalculate netFlow and balance
  let runningBalance = startingBalance;
  for (const point of adjusted) {
    point.netFlow =
      point.activeInvoices +
      point.futureReceivables -
      point.passiveInvoices -
      point.recurringExpenses -
      point.oneOffExpenses -
      (point.vatPayments ?? 0);
    runningBalance += point.netFlow;
    point.balance = Math.round(runningBalance * 100) / 100;
  }

  return adjusted;
}

// Import needed for the function
import type { DailyProjectionPoint } from "@/lib/types/cashflow";
