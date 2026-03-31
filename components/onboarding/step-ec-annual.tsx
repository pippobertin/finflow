"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, ArrowRight, ArrowLeft, SkipForward } from "lucide-react";
import { EcUpload } from "./ec-upload";
import { toast } from "sonner";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StepEcAnnual({ onNext, onBack, onSkip }: StepProps) {
  const prevYear = new Date().getFullYear() - 1;
  const [balance, setBalance] = useState<number | null>(null);
  const [date, setDate] = useState(`${prevYear}-12-31`);
  const [sourceFile, setSourceFile] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (balance === null) {
      toast.error("Inserisci il saldo di fine anno");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "ec-annual",
          data: { balance: balance.toString(), date, period: `ANNUAL_${prevYear}`, sourceFile },
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
          <FileText className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Estratto Conto Annuale</h2>
          <p className="text-sm text-slate-500">
            Carica l&apos;EC dell&apos;anno {prevYear} per estrarre il saldo di chiusura
          </p>
        </div>
      </div>

      <EcUpload
        label={`EC annuale ${prevYear} (PDF)`}
        onBalanceExtracted={(bal, d) => {
          setBalance(bal);
          if (d) setDate(d);
        }}
        onFileUploaded={setSourceFile}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ecDate">Data saldo</Label>
          <Input id="ecDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {balance !== null && (
          <div>
            <Label>Saldo confermato</Label>
            <div className="font-numeric mt-1 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-lg font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
              {balance.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
            </div>
          </div>
        )}
      </div>

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
          <Button type="submit" disabled={saving || balance === null}>
            {saving ? "Salvataggio..." : "Avanti"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
