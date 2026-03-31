"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from "lucide-react";

interface EcUploadProps {
  onBalanceExtracted: (balance: number, date: string) => void;
  onFileUploaded: (fileName: string) => void;
  label?: string;
}

export function EcUpload({ onBalanceExtracted, onFileUploaded, label }: EcUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [extractedBalance, setExtractedBalance] = useState<number | null>(null);
  const [manualBalance, setManualBalance] = useState("");

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setFile(f);
      onFileUploaded(f.name);

      if (f.type === "application/pdf" || f.name.endsWith(".pdf")) {
        setParsing(true);
        try {
          const formData = new FormData();
          formData.append("file", f);
          const res = await fetch("/api/parse-ec", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            if (data.closingBalance !== null && data.closingBalance !== undefined) {
              setExtractedBalance(data.closingBalance);
              onBalanceExtracted(
                data.closingBalance,
                data.closingDate || new Date().toISOString().slice(0, 10),
              );
            }
          }
        } catch {
          // PDF parsing failed — user enters manually
        } finally {
          setParsing(false);
        }
      }
    },
    [onBalanceExtracted, onFileUploaded],
  );

  return (
    <div className="space-y-4">
      <div>
        <Label>{label || "Carica estratto conto (PDF)"}</Label>
        <div className="mt-1">
          {!file ? (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-6 transition hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-slate-600 dark:hover:border-indigo-500">
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-500">Trascina o clicca per caricare un PDF</span>
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <FileText className="h-5 w-5 text-indigo-500" />
              <span className="flex-1 text-sm">{file.name}</span>
              {parsing && <span className="text-xs text-slate-500">Analisi in corso...</span>}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setExtractedBalance(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {extractedBalance !== null && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Saldo estratto automaticamente:{" "}
            <span className="font-numeric font-bold">
              {extractedBalance.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
            </span>
          </p>
        </div>
      )}

      {!extractedBalance && !parsing && (
        <div>
          <Label htmlFor="manualBalance">
            {file
              ? "Saldo non rilevato — inserisci manualmente"
              : "Oppure inserisci il saldo manualmente"}
          </Label>
          <Input
            id="manualBalance"
            type="number"
            step="0.01"
            value={manualBalance}
            onChange={(e) => {
              setManualBalance(e.target.value);
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                onBalanceExtracted(val, new Date().toISOString().slice(0, 10));
              }
            }}
            placeholder="es. 45000.00"
          />
        </div>
      )}
    </div>
  );
}
