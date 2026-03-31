"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, ArrowRight, ArrowLeft, SkipForward, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

interface QuarterlyEntry {
  period: string;
  label: string;
  endDate: string;
  balance: string;
  sourceFile: string;
}

function getExpectedQuarters(): QuarterlyEntry[] {
  const today = new Date();
  const year = today.getFullYear();
  const quarters: QuarterlyEntry[] = [];

  const qDefs = [
    { label: "Q1", endDate: `${year}-03-31`, deadline: new Date(year, 3, 7) },
    { label: "Q2", endDate: `${year}-06-30`, deadline: new Date(year, 6, 7) },
    { label: "Q3", endDate: `${year}-09-30`, deadline: new Date(year, 9, 7) },
    { label: "Q4", endDate: `${year}-12-31`, deadline: new Date(year + 1, 0, 7) },
  ];

  for (const q of qDefs) {
    if (today > q.deadline) {
      quarters.push({
        period: `${q.label}_${year}`,
        label: `${q.label} ${year}`,
        endDate: q.endDate,
        balance: "",
        sourceFile: "",
      });
    }
  }

  return quarters;
}

export function StepEcQuarterly({ onNext, onBack, onSkip }: StepProps) {
  const expectedQuarters = useMemo(() => getExpectedQuarters(), []);
  const [entries, setEntries] = useState<QuarterlyEntry[]>(expectedQuarters);
  const [saving, setSaving] = useState(false);

  function updateEntry(idx: number, field: keyof QuarterlyEntry, value: string) {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = entries.filter((e) => e.balance.trim() !== "");
    if (valid.length === 0) {
      toast.error("Inserisci almeno un saldo trimestrale");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "ec-quarterly",
          data: {
            snapshots: valid.map((e) => ({
              date: e.endDate,
              balance: e.balance,
              period: e.period,
              sourceFile: e.sourceFile || undefined,
            })),
          },
        }),
      });
      if (!res.ok) throw new Error();
      onNext();
    } catch {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">EC Trimestrali</h2>
          <p className="text-sm text-slate-500">
            {entries.length > 0
              ? `${entries.length} trimestri chiusi da più di 7 giorni`
              : "Nessun trimestre completato richiesto al momento"}
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
          Nessun EC trimestrale richiesto al momento. Puoi procedere.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, idx) => (
            <div
              key={entry.period}
              className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-3 dark:border-slate-700"
            >
              <div>
                <Label className="text-xs font-medium text-slate-500">{entry.label}</Label>
                <p className="text-sm">Fine: {entry.endDate}</p>
              </div>
              <div>
                <Label htmlFor={`balance-${idx}`}>Saldo di chiusura</Label>
                <Input
                  id={`balance-${idx}`}
                  type="number"
                  step="0.01"
                  value={entry.balance}
                  onChange={(e) => updateEntry(idx, "balance", e.target.value)}
                  placeholder="es. 52000.00"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEntries((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Indietro
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onSkip}>
            <SkipForward className="mr-2 h-4 w-4" />
            Salta
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvataggio..." : "Avanti"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
