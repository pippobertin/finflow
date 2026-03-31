"use client";

import { useState, useCallback } from "react";
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
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, SkipForward } from "lucide-react";
import { ColumnMapper } from "./column-mapper";
import { toast } from "sonner";
import type { BankStatementMapping } from "@/lib/validations/bank-statement-import";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function StepMovements({ onNext, onBack, onSkip }: StepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<BankStatementMapping | null>(null);
  const [dateFormat, setDateFormat] = useState("dd/MM/yyyy");
  const [decimalSeparator, setDecimalSeparator] = useState<"," | ".">(",");
  const [delimiter, setDelimiter] = useState(",");
  const [skipRows, setSkipRows] = useState(0);
  const [saving, setSaving] = useState(false);
  const [, setResult] = useState<{ imported: number; errors: unknown[] } | null>(null);

  const parsePreview = useCallback((content: string, delim: string, skip: number) => {
    const lines = content.split("\n").filter((l) => l.trim());
    const dataLines = lines.slice(skip);
    if (dataLines.length === 0) return;

    // Detect delimiter if auto
    const actualDelim =
      delim === "auto"
        ? dataLines[0].includes(";")
          ? ";"
          : dataLines[0].includes("\t")
            ? "\t"
            : ","
        : delim;

    const headerLine = dataLines[0];
    const hdrs = headerLine.split(actualDelim).map((h) => h.replace(/^"|"$/g, "").trim());
    setHeaders(hdrs);

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < Math.min(dataLines.length, 6); i++) {
      const cells = dataLines[i].split(actualDelim).map((c) => c.replace(/^"|"$/g, "").trim());
      const row: Record<string, string> = {};
      hdrs.forEach((h, j) => (row[h] = cells[j] || ""));
      rows.push(row);
    }
    setPreviewRows(rows);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setFile(f);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setCsvContent(content);
        parsePreview(content, delimiter, skipRows);
      };
      reader.readAsText(f);
    },
    [delimiter, skipRows, parsePreview],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!csvContent || !mapping) {
      toast.error("Carica un file CSV e mappa le colonne");
      return;
    }
    if (!mapping.date || !mapping.description) {
      toast.error("Le colonne Data e Descrizione sono obbligatorie");
      return;
    }
    if (!mapping.amount && !(mapping.uscite && mapping.entrate)) {
      toast.error("Mappa la colonna Importo oppure entrambe Uscite e Entrate");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "movements",
          data: {
            csvContent,
            mapping,
            dateFormat,
            decimalSeparator,
            delimiter,
            skipRows,
            sourceFile: file?.name,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      setResult(data);
      toast.success(`${data.imported} movimenti importati`);
      onNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore nell'importazione");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Movimenti Bancari</h2>
          <p className="text-sm text-slate-500">
            Importa i movimenti da CSV. La mappatura colonne verrà salvata per la tua banca.
          </p>
        </div>
      </div>

      {/* File upload */}
      {!file ? (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-6 transition hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-slate-600 dark:hover:border-indigo-500">
          <Upload className="h-5 w-5 text-slate-400" />
          <span className="text-sm text-slate-500">Carica file CSV</span>
          <input
            type="file"
            accept=".csv,.txt,.tsv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <>
          {/* Import options */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label>Formato data</Label>
              <Select value={dateFormat} onValueChange={(v) => v && setDateFormat(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">GG/MM/AAAA</SelectItem>
                  <SelectItem value="dd-MM-yyyy">GG-MM-AAAA</SelectItem>
                  <SelectItem value="yyyy-MM-dd">AAAA-MM-GG</SelectItem>
                  <SelectItem value="dd.MM.yyyy">GG.MM.AAAA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Separatore decimale</Label>
              <Select
                value={decimalSeparator}
                onValueChange={(v) => v && setDecimalSeparator(v as "," | ".")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Virgola (,)</SelectItem>
                  <SelectItem value=".">Punto (.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Delimitatore</Label>
              <Select
                value={delimiter}
                onValueChange={(v) => {
                  if (!v) return;
                  setDelimiter(v);
                  if (csvContent) parsePreview(csvContent, v, skipRows);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Virgola</SelectItem>
                  <SelectItem value=";">Punto e virgola</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Righe da saltare</Label>
              <Input
                type="number"
                min={0}
                value={skipRows}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  setSkipRows(v);
                  if (csvContent) parsePreview(csvContent, delimiter, v);
                }}
              />
            </div>
          </div>

          {/* Column mapping */}
          {headers.length > 0 && (
            <ColumnMapper
              headers={headers}
              previewRows={previewRows}
              onMappingChange={setMapping}
            />
          )}
        </>
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
          <Button type="submit" disabled={saving || !file}>
            {saving ? "Importazione..." : "Importa e Avanti"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
