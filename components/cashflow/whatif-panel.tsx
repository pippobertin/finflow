"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useCashflowSettings } from "@/lib/stores/cashflow-settings";
import { RotateCcw } from "lucide-react";

interface WhatIfPanelProps {
  avgDso: number;
  totalPendingActiveGross: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function WhatIfPanel({ avgDso, totalPendingActiveGross }: WhatIfPanelProps) {
  const {
    whatIf,
    setWhatIfExtraExpense,
    setWhatIfExtraExpenseDate,
    setWhatIfMissedCollectionPct,
    setWhatIfDsoAdjustment,
    resetWhatIf,
  } = useCashflowSettings();

  // Initialize dsoAdjustment with avgDso on mount
  useEffect(() => {
    setWhatIfDsoAdjustment(avgDso);
  }, [avgDso, setWhatIfDsoAdjustment]);

  const missedAmount = Math.round(totalPendingActiveGross * (whatIf.missedCollectionPct / 100));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Simulazione What-If</CardTitle>
        <Button size="sm" variant="outline" onClick={resetWhatIf}>
          <RotateCcw className="mr-1 h-3 w-3" />
          Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Extra expense */}
        <div className="space-y-3">
          <Label>Spesa Straordinaria</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={whatIf.extraExpense}
              min={0}
              max={100000}
              step={1000}
              onValueChange={(v) => setWhatIfExtraExpense(v as number)}
              className="flex-1"
            />
            <span className="w-24 text-right font-mono text-sm">
              {formatCurrency(whatIf.extraExpense)}
            </span>
          </div>
          {whatIf.extraExpense > 0 && (
            <Input
              type="date"
              value={whatIf.extraExpenseDate ?? ""}
              onChange={(e) => setWhatIfExtraExpenseDate(e.target.value || null)}
              className="w-48"
            />
          )}
        </div>

        {/* Missed collection */}
        <div className="space-y-3">
          <Label>Mancato Incasso</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={whatIf.missedCollectionPct}
              min={0}
              max={50}
              step={1}
              onValueChange={(v) => setWhatIfMissedCollectionPct(v as number)}
              className="flex-1"
            />
            <span className="w-24 text-right font-mono text-sm">{whatIf.missedCollectionPct}%</span>
          </div>
          {whatIf.missedCollectionPct > 0 && (
            <p className="text-muted-foreground text-xs">
              = {formatCurrency(missedAmount)} del portafoglio attivo
            </p>
          )}
        </div>

        {/* DSO adjustment */}
        <div className="space-y-3">
          <Label>Giorni Medi di Incasso</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={whatIf.dsoAdjustment}
              onChange={(e) => setWhatIfDsoAdjustment(parseInt(e.target.value) || 0)}
              className="w-24"
              min={0}
              max={365}
            />
            <span className="text-muted-foreground text-xs">Media attuale: {avgDso} gg</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
