"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BankStatementUploadZone } from "./bank-statement-upload-zone";
import { BankStatementColumnMapper } from "./bank-statement-column-mapper";
import { BankStatementPreviewTable } from "./bank-statement-preview-table";
import { BankStatementImportProgress } from "./bank-statement-import-progress";
import { parseCsv } from "@/lib/parsers/csv-parser";
import { useBankStatementImport } from "@/lib/hooks/use-bank-statement-import";
import type {
  BankStatementMapping,
  BankStatementImportInput,
} from "@/lib/validations/bank-statement-import";
import type { BankStatementImportResult } from "@/lib/connectors/bank-statement-import";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, RotateCcw, Landmark } from "lucide-react";

type Step = "upload" | "bank-select" | "parsing" | "mapping" | "preview" | "importing" | "done";

interface BankOption {
  bankName: string;
  isSystemDefault: boolean;
}

export function BankStatementImportClient() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"csv" | "pdf">("csv");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Partial<BankStatementMapping>>({});
  const [importResult, setImportResult] = useState<BankStatementImportResult | null>(null);

  // Bank selector state
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [loadingBanks, setLoadingBanks] = useState(false);

  const bankStatementImport = useBankStatementImport();

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

  const fetchBankOptions = useCallback(() => {
    setLoadingBanks(true);
    fetch("/api/client/bank-profiles")
      .then((r) => r.json())
      .then((data) => {
        setBankOptions(data.profiles ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingBanks(false));
  }, []);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      const isPdf = selectedFile.name.toLowerCase().endsWith(".pdf");
      setFileType(isPdf ? "pdf" : "csv");

      if (isPdf) {
        // Show bank selector step for PDFs — fetch profiles
        if (bankOptions.length === 0) fetchBankOptions();
        setStep("bank-select");
      } else {
        // Parse CSV client-side (existing flow)
        const text = await selectedFile.text();
        const parsed = parseCsv(text);
        setHeaders(parsed.headers);
        setRows(parsed.rows);
        setMapping(autoMapHeaders(parsed.headers));
        setStep("mapping");
      }
    },
    [bankOptions.length, fetchBankOptions],
  );

  const handleBankConfirm = useCallback(async () => {
    if (!file) return;

    setStep("parsing");

    if (selectedBank) {
      // Profile-based parsing via /api/client/movimenti/upload with bankName
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "config",
          JSON.stringify({
            mapping: { date: "Data", description: "Descrizione", amount: "Importo" },
          }),
        );
        formData.append("bankName", selectedBank);

        const res = await fetch("/api/client/movimenti/upload", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();

        if (!res.ok) {
          toast.error(result.error ?? "Errore nell'upload");
          setStep("bank-select");
          return;
        }

        // Profile-based upload does import directly — show result
        setImportResult(result);
        if (result.imported > 0) {
          toast.success(
            `${result.imported} movimenti importati (${result.duplicates ?? 0} duplicati)`,
          );
        } else if (result.duplicates > 0) {
          toast.info(`Tutti i ${result.duplicates} movimenti erano già presenti`);
        } else {
          toast.info("Nessun movimento importato");
        }
        setStep("done");
      } catch {
        toast.error("Errore di rete");
        setStep("bank-select");
      }
    } else {
      // Generic PDF parsing (no bank profile selected)
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/import/parse-pdf", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Errore analisi PDF" }));
          toast.error(err.error ?? `Errore ${res.status}`);
          setStep("bank-select");
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
        setStep("bank-select");
      }
    }
  }, [file, selectedBank]);

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
          setStep("done");
        },
        onError: (err) => {
          toast.error(err.message);
          setStep("importing");
        },
      },
    );
    setStep("importing");
  }

  function handleReset() {
    setStep("upload");
    setFile(null);
    setFileType("csv");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setImportResult(null);
    setSelectedBank("");
  }

  const stepLabels: Record<Step, string> = {
    upload: "1. Carica File",
    "bank-select": "2. Seleziona Banca",
    parsing: "2. Analisi PDF",
    mapping: fileType === "pdf" ? "3. Mappa Colonne" : "2. Mappa Colonne",
    preview: fileType === "pdf" ? "4. Anteprima" : "3. Anteprima",
    importing: fileType === "pdf" ? "5. Importazione" : "4. Importazione",
    done: fileType === "pdf" ? "6. Completato" : "5. Completato",
  };

  // Steps shown in indicator (hide parsing, bank-select shows only for PDF)
  const displaySteps = Object.entries(stepLabels).filter(
    ([key]) => key !== "parsing" && (fileType === "pdf" || key !== "bank-select"),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {displaySteps.map(([key, label]) => (
          <div
            key={key}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              step === key || (step === "parsing" && (key === "bank-select" || key === "upload"))
                ? "bg-[var(--brand,#0b4d8a)] text-white"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {step === "parsing" ? "Analisi PDF in corso..." : stepLabels[step]}
        </h2>

        {step === "upload" && <BankStatementUploadZone onFileSelect={handleFileSelect} />}

        {step === "bank-select" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Seleziona la banca del tuo estratto conto PDF per un&apos;analisi più accurata, oppure
              continua con l&apos;analisi generica.
            </p>
            <div className="max-w-sm">
              <Select value={selectedBank} onValueChange={(v) => v != null && setSelectedBank(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona la banca (opzionale)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__generic__">
                    <span className="flex items-center gap-2">
                      Analisi generica (nessun profilo)
                    </span>
                  </SelectItem>
                  {loadingBanks && (
                    <SelectItem value="__loading__" disabled>
                      Caricamento profili...
                    </SelectItem>
                  )}
                  {bankOptions.map((b) => (
                    <SelectItem key={b.bankName} value={b.bankName}>
                      <span className="flex items-center gap-2">
                        <Landmark className="h-3.5 w-3.5 text-slate-400" />
                        {b.bankName}
                        {b.isSystemDefault && (
                          <span className="text-[10px] text-slate-400">(predefinito)</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setFile(null);
                }}
              >
                Indietro
              </Button>
              <Button
                onClick={() => {
                  // Treat "__generic__" as no bank
                  if (selectedBank === "__generic__") setSelectedBank("");
                  handleBankConfirm();
                }}
              >
                Continua
              </Button>
            </div>
          </div>
        )}

        {step === "parsing" && (
          <div className="flex items-center justify-center py-8">
            <div
              className="h-8 w-8 animate-spin rounded-full border-b-2"
              style={{ borderColor: "var(--brand, #0b4d8a)" }}
            />
            <span className="ml-3 text-sm text-slate-500">Analisi del PDF in corso...</span>
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
            <div
              className="h-8 w-8 animate-spin rounded-full border-b-2"
              style={{ borderColor: "var(--brand, #0b4d8a)" }}
            />
            <span className="ml-3 text-sm text-slate-500">Importazione in corso...</span>
          </div>
        )}
        {step === "done" && importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-lg font-semibold">Importazione completata</p>
                <p className="text-sm text-slate-500">
                  {importResult.imported} movimenti importati
                  {importResult.duplicates > 0 && `, ${importResult.duplicates} duplicati ignorati`}
                </p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  {importResult.errors.length} righe con errori
                </div>
                <ul className="mt-2 space-y-1 text-xs text-amber-600 dark:text-amber-500">
                  {importResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>
                      Riga {err.row}: {err.message}
                    </li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li>...e altri {importResult.errors.length - 5} errori</li>
                  )}
                </ul>
              </div>
            )}
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Importa altro file
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
