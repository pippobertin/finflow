"use client";

import { useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, Check, AlertTriangle } from "lucide-react";

interface ParsedResult {
  snapshot: { id: string; _count: { lines: number } };
  totals: { debit: number; credit: number; balance: number };
  warnings: { row?: number; message: string }[];
}

export default function UploadBilancioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [sheetName, setSheetName] = useState("1-BV");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !periodStart || !periodEnd) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("periodStart", periodStart);
    fd.append("periodEnd", periodEnd);
    fd.append("sheetName", sheetName);
    if (notes) fd.append("notes", notes);

    try {
      const res = await fetch(`/api/firm/clients/${id}/bilanci`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore durante il caricamento");
        if (data.details) {
          setError(data.details.map((d: { message: string }) => d.message).join("; "));
        }
      } else {
        setResult(data);
      }
    } catch {
      setError("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  }

  const fmtNum = (n: number) =>
    n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {result ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              <span className="font-medium text-emerald-800">Bilancio caricato con successo</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Righe importate</span>
                <p className="font-numeric text-lg font-semibold">{result.snapshot._count.lines}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Totale Dare</span>
                <p className="font-numeric text-lg font-semibold">{fmtNum(result.totals.debit)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Totale Avere</span>
                <p className="font-numeric text-lg font-semibold">{fmtNum(result.totals.credit)}</p>
              </div>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  {result.warnings.length} avvisi
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-amber-700">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Link
              href={`/firm/clients/${id}/mapping`}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Configura mapping conti
            </Link>
            <Link
              href={`/firm/clients/${id}/bilanci`}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Torna alla lista
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Inizio periodo</label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fine periodo</label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Nome foglio Excel</label>
            <Input
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="1-BV"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Il nome del foglio nel file Excel contenente il bilancio di verifica
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">File Excel</label>
            <div
              className="mt-1 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-8 hover:border-indigo-400 hover:bg-indigo-50/50"
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-center">
                <Upload className="text-muted-foreground mx-auto h-8 w-8" />
                <p className="mt-2 text-sm">
                  {file ? (
                    <span className="font-medium text-indigo-600">{file.name}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      Clicca per selezionare il file .xlsx
                    </span>
                  )}
                </p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Note (opzionale)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Es: BV settembre 2025 definitivo"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting || !file}>
            {submitting ? "Caricamento..." : "Carica e analizza"}
          </Button>
        </form>
      )}
    </div>
  );
}
