"use client";

import { useState, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

const SECTIONS = [
  { id: "ce", label: "CE Riclassificato" },
  { id: "health", label: "Indicatori di Salute" },
  { id: "scadenze", label: "Scadenze 90 giorni" },
  { id: "iva", label: "IVA del Periodo" },
];

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [year, setYear] = useState(String(currentYear));
  const [selected, setSelected] = useState<Set<string>>(new Set(["ce", "health"]));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSection(sectionId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  async function handleGenerate() {
    if (selected.size === 0) {
      setError("Seleziona almeno una sezione.");
      return;
    }
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/firm/clients/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(year),
          sections: Array.from(selected),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Errore nella generazione del report");
        return;
      }

      // Download the PDF
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Errore di rete");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6 p-6">
      {/* Year selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Anno</label>
        <Select value={year} onValueChange={(v) => v && setYear(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Section checkboxes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Sezioni da includere</label>
        <div className="space-y-2">
          {SECTIONS.map((section) => (
            <label
              key={section.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/30"
            >
              <input
                type="checkbox"
                checked={selected.has(section.id)}
                onChange={() => toggleSection(section.id)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm">{section.label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={generating || selected.size === 0}
        className="w-full"
      >
        {generating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generazione in corso...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Genera Report PDF
          </>
        )}
      </Button>
    </div>
  );
}
