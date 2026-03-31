"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, RefreshCw, PartyPopper } from "lucide-react";

interface StepProps {
  onBack: () => void;
  onComplete: () => void;
}

interface ReconciliationResult {
  total: number;
  reconciled: number;
  pending: number;
}

export function StepReconciliation({ onBack, onComplete }: StepProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState("");

  async function runReconciliation() {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/reconciliation/auto", { method: "POST" });
      if (!res.ok) throw new Error("Errore nella riconciliazione");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setRunning(false);
    }
  }

  // Auto-run on mount
  useEffect(() => {
    runReconciliation();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <CheckCircle className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Riconciliazione Automatica</h2>
          <p className="text-sm text-slate-500">
            Abbinamento automatico movimenti bancari con fatture
          </p>
        </div>
      </div>

      {running && (
        <div className="flex flex-col items-center gap-3 py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500">Riconciliazione in corso...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={runReconciliation}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Riprova
          </Button>
        </div>
      )}

      {result && !running && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="font-numeric text-2xl font-bold text-slate-700 dark:text-slate-300">
                {result.total}
              </p>
              <p className="text-xs text-slate-500">Movimenti analizzati</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="font-numeric text-2xl font-bold text-emerald-600">
                {result.reconciled}
              </p>
              <p className="text-xs text-emerald-600/80">Riconciliati</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-900/20">
              <p className="font-numeric text-2xl font-bold text-amber-600">{result.pending}</p>
              <p className="text-xs text-amber-600/80">Da verificare</p>
            </div>
          </div>

          {result.pending > 0 && (
            <p className="text-sm text-slate-500">
              I movimenti non riconciliati potranno essere gestiti dalla sezione
              <strong> Riconciliazione</strong> nella dashboard.
            </p>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
            <PartyPopper className="h-5 w-5 text-emerald-600" />
            <p className="font-medium text-emerald-700 dark:text-emerald-400">
              Configurazione completata! Sei pronto per usare FinFlow.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Indietro
        </Button>
        <Button onClick={onComplete} disabled={running}>
          Vai alla Dashboard
        </Button>
      </div>
    </div>
  );
}
