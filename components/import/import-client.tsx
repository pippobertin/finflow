// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy CSV import UI, behind feature flags. Will be removed in Block D.
"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvUploadZone } from "./csv-upload-zone";
import { ColumnMapper } from "./column-mapper";
import { ImportPreviewTable } from "./import-preview-table";
import { ImportProgress } from "./import-progress";
import { parseCsv } from "@/lib/parsers/csv-parser";
import { useCsvImport } from "@/lib/hooks/use-csv-import";
import type { CsvColumnMapping, CsvImportInput } from "@/lib/validations/import";
import type { ImportResult } from "@/lib/types/api";
import { toast } from "sonner";

type Step = "upload" | "mapping" | "preview" | "result";

export function ImportClient() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [direction, setDirection] = useState<"ACTIVE" | "PASSIVE">("PASSIVE");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<CsvColumnMapping>>({});
  const [result, setResult] = useState<ImportResult | null>(null);

  const csvImport = useCsvImport();

  const handleFileSelect = useCallback(async (selectedFile: File, dir: "ACTIVE" | "PASSIVE") => {
    setFile(selectedFile);
    setDirection(dir);

    const text = await selectedFile.text();
    const parsed = parseCsv(text);
    setHeaders(parsed.headers);
    setRows(parsed.rows);

    // Auto-map common Italian headers
    const autoMapping: Partial<CsvColumnMapping> = {};
    for (const h of parsed.headers) {
      const lower = h.toLowerCase();
      if (lower.includes("numero") || lower === "n." || lower === "nr") autoMapping.number = h;
      if (lower.includes("data") && !lower.includes("scadenza")) autoMapping.date = h;
      if (lower.includes("controparte") || lower.includes("fornitore") || lower.includes("cliente"))
        autoMapping.counterpart = h;
      if (lower.includes("netto") || lower.includes("imponibile")) autoMapping.netAmount = h;
      if (lower.includes("iva") && !lower.includes("p.iva")) autoMapping.vatAmount = h;
      if (lower.includes("lordo") || lower.includes("totale")) autoMapping.grossAmount = h;
      if (lower.includes("descrizione")) autoMapping.description = h;
      if (lower.includes("p.iva") || lower.includes("partita")) autoMapping.vatNumber = h;
      if (lower.includes("scadenza")) autoMapping.dueDate = h;
      if (lower.includes("stato")) autoMapping.status = h;
    }
    setMapping(autoMapping);
    setStep("mapping");
  }, []);

  function handleConfirmMapping() {
    setStep("preview");
  }

  function handleImport() {
    if (!file) return;

    const config: CsvImportInput = {
      direction,
      mapping: mapping as CsvColumnMapping,
      dateFormat: "dd/MM/yyyy",
      decimalSeparator: ",",
      skipRows: 0,
    };

    csvImport.mutate(
      { file, config },
      {
        onSuccess: (res) => {
          setResult(res);
          setStep("result");
          toast.success(`Importate ${res.imported} fatture`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleReset() {
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
  }

  const stepLabels = {
    upload: "1. Carica File",
    mapping: "2. Mappa Colonne",
    preview: "3. Anteprima",
    result: "4. Risultato",
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Step indicator */}
      <div className="flex gap-2">
        {Object.entries(stepLabels).map(([key, label]) => (
          <div
            key={key}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              step === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{stepLabels[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === "upload" && <CsvUploadZone onFileSelect={handleFileSelect} />}
          {step === "mapping" && (
            <ColumnMapper
              headers={headers}
              mapping={mapping}
              onMappingChange={setMapping}
              onConfirm={handleConfirmMapping}
            />
          )}
          {step === "preview" && (
            <ImportPreviewTable
              rows={rows}
              mapping={mapping as CsvColumnMapping}
              onConfirm={handleImport}
              onBack={() => setStep("mapping")}
              isPending={csvImport.isPending}
            />
          )}
          {step === "result" && result && <ImportProgress result={result} onReset={handleReset} />}
        </CardContent>
      </Card>
    </div>
  );
}
