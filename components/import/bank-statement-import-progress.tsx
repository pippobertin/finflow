"use client";

import { CheckCircle, AlertTriangle } from "lucide-react";
import type { BankStatementImportResult } from "@/lib/connectors/bank-statement-import";

interface BankStatementImportProgressProps {
  result: BankStatementImportResult;
}

export function BankStatementImportProgress({ result }: BankStatementImportProgressProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-6 w-6 text-emerald-500" />
        <div>
          <p className="font-medium">{result.imported} movimenti importati</p>
          {result.errors.length > 0 && (
            <p className="text-muted-foreground text-sm">{result.errors.length} righe con errori</p>
          )}
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Errori di importazione
            </p>
          </div>
          <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
            {result.errors.slice(0, 10).map((err, i) => (
              <li key={i}>
                Riga {err.row}: {err.message}
              </li>
            ))}
            {result.errors.length > 10 && <li>... e altri {result.errors.length - 10} errori</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
