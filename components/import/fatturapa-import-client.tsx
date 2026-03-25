"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FatturapaDirectionSelector } from "./fatturapa-direction-selector";
import { FatturapaUploadZone } from "./fatturapa-upload-zone";
import { FatturapaPreview } from "./fatturapa-preview";
import { FatturapaImportResultView } from "./fatturapa-import-result";
import { useFatturapaPreview, useFatturapaImport } from "@/lib/hooks/use-fatturapa-import";
import type { ParsedFatturaPA } from "@/lib/parsers/fatturapa-parser";
import type { FatturapaImportResult } from "@/lib/types/api";
import { toast } from "sonner";

type Step = "direction" | "upload" | "preview" | "result";

export function FatturapaImportClient() {
  const [step, setStep] = useState<Step>("direction");
  const [direction, setDirection] = useState<"ACTIVE" | "PASSIVE">("PASSIVE");
  const [file, setFile] = useState<File | null>(null);
  const [parseData, setParseData] = useState<ParsedFatturaPA | null>(null);
  const [result, setResult] = useState<FatturapaImportResult | null>(null);

  const preview = useFatturapaPreview();
  const importMutation = useFatturapaImport();

  function handleDirectionSelect(dir: "ACTIVE" | "PASSIVE") {
    setDirection(dir);
    setStep("upload");
  }

  function handleFileSelect(selectedFile: File) {
    setFile(selectedFile);
    preview.mutate(
      { file: selectedFile, direction },
      {
        onSuccess: (data) => {
          setParseData(data);
          setStep("preview");
          if (data.invoices.length === 0) {
            toast.error("Nessuna fattura trovata nel file");
          }
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleImport() {
    if (!file) return;
    importMutation.mutate(
      { file, direction },
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
    setStep("direction");
    setFile(null);
    setParseData(null);
    setResult(null);
  }

  const stepLabels: Record<Step, string> = {
    direction: "1. Tipo Fatture",
    upload: "2. Carica File",
    preview: "3. Anteprima",
    result: "4. Risultato",
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Step indicator */}
      <div className="flex gap-2">
        {(Object.entries(stepLabels) as [Step, string][]).map(([key, label]) => (
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
          {step === "direction" && <FatturapaDirectionSelector onSelect={handleDirectionSelect} />}
          {step === "upload" && (
            <FatturapaUploadZone
              direction={direction}
              isParsing={preview.isPending}
              onFileSelect={handleFileSelect}
              onBack={() => setStep("direction")}
            />
          )}
          {step === "preview" && parseData && (
            <FatturapaPreview
              data={parseData}
              direction={direction}
              onConfirm={handleImport}
              onBack={() => setStep("upload")}
              isPending={importMutation.isPending}
            />
          )}
          {step === "result" && result && (
            <FatturapaImportResultView result={result} onReset={handleReset} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
