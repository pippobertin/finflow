"use client";

import { Slider } from "@/components/ui/slider";
import { useCashflowSettings } from "@/lib/stores/cashflow-settings";

export function TimeHorizonSlider() {
  const { days, setDays } = useCashflowSettings();

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium whitespace-nowrap">Orizzonte: {days} giorni</span>
      <Slider
        value={days}
        min={7}
        max={180}
        step={1}
        onValueChange={(v) => setDays(v as number)}
        className="w-48"
      />
    </div>
  );
}
