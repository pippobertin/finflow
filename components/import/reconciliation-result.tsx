"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorDetail {
  row: number;
  field?: string;
  message: string;
}

interface ReconciliationResultProps {
  imported: number;
  duplicates?: number;
  totalParsed?: number;
  reconciled: number;
  rejected: number;
  unmatched: number;
  errors: number;
  errorDetails?: ErrorDetail[];
  onReset: () => void;
}

export function ReconciliationResult({
  imported,
  duplicates = 0,
  totalParsed,
  reconciled,
  rejected,
  unmatched,
  errors,
  errorDetails,
  onReset,
}: ReconciliationResultProps) {
  return (
    <div className="space-y-6 text-center">
      <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
      <div>
        <h3 className="text-lg font-semibold">Importazione completata</h3>
        <p className="text-muted-foreground text-sm">Riepilogo operazione</p>
      </div>

      <div className="mx-auto grid max-w-sm grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border p-3">
          <p className="text-2xl font-bold text-emerald-600">{imported}</p>
          <p className="text-muted-foreground">Importati</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-2xl font-bold text-blue-600">{reconciled}</p>
          <p className="text-muted-foreground">Riconciliati</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-2xl font-bold text-amber-600">{rejected}</p>
          <p className="text-muted-foreground">Rifiutati</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-2xl font-bold text-gray-600">{unmatched}</p>
          <p className="text-muted-foreground">Non abbinati</p>
        </div>
      </div>

      {duplicates > 0 && (
        <p className="text-sm text-slate-500">
          {duplicates} movimenti duplicati saltati
          {totalParsed ? ` (su ${totalParsed} trovati nel file)` : ""}
        </p>
      )}

      {errors > 0 && (
        <div className="text-sm text-amber-600">
          <p>{errors} righe con errori durante l&apos;importazione</p>
          {errorDetails && errorDetails.length > 0 && (
            <details className="mt-2 text-left">
              <summary className="cursor-pointer text-xs font-medium">
                Mostra dettagli errori
              </summary>
              <ul className="mt-1 max-h-32 overflow-y-auto text-xs text-slate-500">
                {errorDetails.slice(0, 10).map((e, i) => (
                  <li key={i}>
                    Riga {e.row}: {e.message}
                    {e.field ? ` (${e.field})` : ""}
                  </li>
                ))}
                {errorDetails.length > 10 && (
                  <li>...e altri {errorDetails.length - 10} errori simili</li>
                )}
              </ul>
            </details>
          )}
        </div>
      )}

      {totalParsed !== undefined && imported === 0 && duplicates === 0 && errors === 0 && (
        <p className="text-sm text-amber-600">
          {totalParsed === 0
            ? "Nessun movimento trovato nel file. Verifica il formato."
            : `${totalParsed} righe trovate ma nessuna importata. Verifica la mappatura colonne.`}
        </p>
      )}

      <Button onClick={onReset}>Importa altro file</Button>
    </div>
  );
}
