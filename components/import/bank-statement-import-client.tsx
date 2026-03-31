"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankStatementUploadZone } from "./bank-statement-upload-zone";
import { BankStatementColumnMapper } from "./bank-statement-column-mapper";
import { BankStatementPreviewTable } from "./bank-statement-preview-table";
import { BankStatementImportProgress } from "./bank-statement-import-progress";
import { ReconciliationTable } from "./reconciliation-table";
import { ReconciliationResult } from "./reconciliation-result";
import { parseCsv } from "@/lib/parsers/csv-parser";
import {
  useBankStatementImport,
  useReconciliationMatches,
  useConfirmReconciliation,
} from "@/lib/hooks/use-bank-statement-import";
import type {
  BankStatementMapping,
  BankStatementImportInput,
} from "@/lib/validations/bank-statement-import";
import type { BankStatementImportResult } from "@/lib/connectors/bank-statement-import";
import { toast } from "sonner";

type Step = "upload" | "parsing" | "mapping" | "preview" | "importing" | "reconciliation" | "done";

export function BankStatementImportClient() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [, setFileType] = useState<"csv" | "pdf">("csv");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<BankStatementMapping>>({});
  const [importResult, setImportResult] = useState<BankStatementImportResult | null>(null);
  const [reconResult, setReconResult] = useState<{ reconciled: number; rejected: number } | null>(
    null,
  );

  const bankStatementImport = useBankStatementImport();
  const confirmReconciliation = useConfirmReconciliation();
  const { data: matches, isLoading: matchesLoading } = useReconciliationMatches(
    importResult?.bankStatementIds ?? [],
    step === "reconciliation",
  );

  function autoMapHeaders(parsedHeaders: string[]): Partial<BankStatementMapping> {
    const autoMapping: Partial<BankStatementMapping> = {};
    for (const h of parsedHeaders) {
      const lower = h.toLowerCase().trim();

      // Date (exclude "valuta") — also detect "Operaz." / "Operazione"
      if (
        (lower.includes("data") && !lower.includes("valuta")) ||
        lower === "date" ||
        lower.startsWith("operaz")
      )
        autoMapping.date = h;

      // Data Valuta
      if (lower.includes("valuta") || lower === "data valuta") autoMapping.valuta = h;

      // Descrizione / Causale
      if (
        lower.includes("descrizione") ||
        lower.includes("causale") ||
        lower.includes("description")
      )
        autoMapping.description = h;

      // Single amount (signed)
      if (lower === "importo" || lower === "amount") autoMapping.amount = h;

      // Separate outflows / inflows
      if (lower === "uscite" || lower === "dare" || lower === "addebiti") autoMapping.uscite = h;
      if (lower === "entrate" || lower === "avere" || lower === "accrediti")
        autoMapping.entrate = h;

      // Balance
      if (lower.includes("saldo") || lower === "balance") autoMapping.balance = h;

      // Reference
      if (
        lower.includes("riferimento") ||
        lower.includes("cro") ||
        lower.includes("trn") ||
        lower === "reference"
      )
        autoMapping.reference = h;
    }

    // If both uscite and entrate found, don't set amount
    if (autoMapping.uscite && autoMapping.entrate) {
      delete autoMapping.amount;
    }
    // If only amount is set, don't set uscite/entrate
    if (autoMapping.amount) {
      delete autoMapping.uscite;
      delete autoMapping.entrate;
    }

    return autoMapping;
  }

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    const isPdf = selectedFile.name.toLowerCase().endsWith(".pdf");
    setFileType(isPdf ? "pdf" : "csv");

    if (isPdf) {
      // Parse PDF server-side
      setStep("parsing");
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetch("/api/import/parse-pdf", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Errore analisi PDF" }));
          toast.error(err.error ?? `Errore ${res.status}`);
          setStep("upload");
          return;
        }

        const result = (await res.json()) as { headers: string[]; rows: Record<string, string>[] };
        setHeaders(result.headers);
        setRows(result.rows);
        setMapping(autoMapHeaders(result.headers));
        toast.success(`PDF analizzato: ${result.rows.length} movimenti trovati`);
        setStep("mapping");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore analisi PDF");
        setStep("upload");
      }
    } else {
      // Parse CSV client-side (existing flow)
      const text = await selectedFile.text();
      const parsed = parseCsv(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(autoMapHeaders(parsed.headers));
      setStep("mapping");
    }
  }, []);

  function handleConfirmMapping() {
    setStep("preview");
  }

  function handleImport() {
    if (!file) return;

    const config: BankStatementImportInput = {
      mapping: mapping as BankStatementMapping,
      dateFormat: "dd/MM/yyyy",
      decimalSeparator: ",",
      skipRows: 0,
    };

    bankStatementImport.mutate(
      { file, config },
      {
        onSuccess: (res) => {
          setImportResult(res);
          toast.success(`Importati ${res.imported} movimenti`);
          if (res.imported > 0) {
            setStep("reconciliation");
          } else {
            setStep("done");
          }
        },
        onError: (err) => {
          toast.error(err.message);
          setStep("importing");
        },
      },
    );
    setStep("importing");
  }

  function handleConfirmReconciliation(
    decisions: { bankStatementId: string; invoiceId: string; accepted: boolean }[],
  ) {
    confirmReconciliation.mutate(decisions, {
      onSuccess: (res) => {
        setReconResult(res);
        toast.success(`${res.reconciled} movimenti riconciliati`);
        setStep("done");
      },
      onError: (err) => toast.error(err.message),
    });
  }

  function handleSkipReconciliation() {
    setReconResult({ reconciled: 0, rejected: 0 });
    setStep("done");
  }

  function handleReset() {
    setStep("upload");
    setFile(null);
    setFileType("csv");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setImportResult(null);
    setReconResult(null);
  }

  const stepLabels: Record<Step, string> = {
    upload: "1. Carica File",
    parsing: "1. Analisi PDF",
    mapping: "2. Mappa Colonne",
    preview: "3. Anteprima",
    importing: "4. Importazione",
    reconciliation: "5. Riconciliazione",
    done: "6. Completato",
  };

  // For the step indicator, merge parsing into upload visually
  const displaySteps = Object.entries(stepLabels).filter(([key]) => key !== "parsing");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {displaySteps.map(([key, label]) => (
          <div
            key={key}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              step === key || (step === "parsing" && key === "upload")
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{step === "parsing" ? "Analisi PDF in corso..." : stepLabels[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === "upload" && <BankStatementUploadZone onFileSelect={handleFileSelect} />}
          {step === "parsing" && (
            <div className="flex items-center justify-center py-8">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
              <span className="text-muted-foreground ml-3 text-sm">
                Analisi del PDF in corso...
              </span>
            </div>
          )}
          {step === "mapping" && (
            <BankStatementColumnMapper
              headers={headers}
              mapping={mapping}
              onMappingChange={setMapping}
              onConfirm={handleConfirmMapping}
            />
          )}
          {step === "preview" && (
            <BankStatementPreviewTable
              rows={rows}
              mapping={mapping as BankStatementMapping}
              onConfirm={handleImport}
              onBack={() => setStep("mapping")}
              isPending={bankStatementImport.isPending}
            />
          )}
          {step === "importing" && importResult && (
            <BankStatementImportProgress result={importResult} />
          )}
          {step === "importing" && !importResult && (
            <div className="flex items-center justify-center py-8">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
              <span className="text-muted-foreground ml-3 text-sm">Importazione in corso...</span>
            </div>
          )}
          {step === "reconciliation" &&
            (matchesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
                <span className="text-muted-foreground ml-3 text-sm">Ricerca abbinamenti...</span>
              </div>
            ) : (
              <ReconciliationTable
                matches={matches ?? []}
                onConfirm={handleConfirmReconciliation}
                onSkip={handleSkipReconciliation}
                isPending={confirmReconciliation.isPending}
              />
            ))}
          {step === "done" && (
            <ReconciliationResult
              imported={importResult?.imported ?? 0}
              duplicates={importResult?.duplicates ?? 0}
              totalParsed={importResult?.totalParsed}
              reconciled={reconResult?.reconciled ?? 0}
              rejected={reconResult?.rejected ?? 0}
              unmatched={
                (importResult?.imported ?? 0) -
                (reconResult?.reconciled ?? 0) -
                (reconResult?.rejected ?? 0)
              }
              errors={importResult?.errors.length ?? 0}
              errorDetails={importResult?.errors}
              onReset={handleReset}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
