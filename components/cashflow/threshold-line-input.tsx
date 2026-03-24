"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useCashflowSettings } from "@/lib/stores/cashflow-settings";

export function ThresholdLineInput() {
  const { threshold, setThreshold } = useCashflowSettings();
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(threshold));
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync external threshold value
      setLocalValue(String(threshold));
    }
  }, [threshold, editing]);

  function handleChange(val: string) {
    setLocalValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const num = parseFloat(val);
      if (!isNaN(num)) setThreshold(num);
    }, 300);
  }

  function handleBlur() {
    setEditing(false);
    const num = parseFloat(localValue);
    if (!isNaN(num)) setThreshold(num);
  }

  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(threshold);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Soglia minima:</span>
      {editing ? (
        <Input
          ref={inputRef}
          type="number"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && handleBlur()}
          className="h-7 w-32"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="hover:bg-muted rounded px-2 py-0.5 font-medium"
        >
          {formatted}
        </button>
      )}
    </div>
  );
}
