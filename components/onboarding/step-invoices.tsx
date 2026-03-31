"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight, ArrowLeft, SkipForward, CheckCircle } from "lucide-react";
import Link from "next/link";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StepInvoices({ onNext, onBack, onSkip }: StepProps) {
  const [invoiceCount, setInvoiceCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/invoices?count=true")
      .then((r) => r.json())
      .then((data) => setInvoiceCount(data.count ?? data.total ?? 0))
      .catch(() => setInvoiceCount(0));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <FileText className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Fatture</h2>
          <p className="text-sm text-slate-500">
            Importa le fatture dal Cassetto Fiscale (XML FatturaPA) o CSV
          </p>
        </div>
      </div>

      {invoiceCount !== null && invoiceCount > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-700 dark:text-emerald-400">
              {invoiceCount} fatture già presenti
            </p>
            <p className="text-sm text-emerald-600/80">
              Puoi procedere o importarne di nuove dalla pagina Importa.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Puoi importare le fatture in un secondo momento dalla sezione
              <strong> Importa Dati</strong> nella barra laterale.
            </p>
            <p className="mt-2 text-sm text-slate-500">Formati supportati: FatturaPA XML, CSV</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" render={<Link href="/import" target="_blank" />}>
              Vai a Importa Dati
            </Button>
          </div>
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
          <Button onClick={onNext}>
            Avanti
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
