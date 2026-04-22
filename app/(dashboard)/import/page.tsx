"use client";

import { BankStatementImportClient } from "@/components/import/bank-statement-import-client";

export default function ImportPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Operativo</p>
        <h1 className="mt-1 text-2xl font-bold lg:text-3xl">Carica il tuo estratto conto</h1>
        <p className="mt-1 text-sm text-slate-500">Trascina il file, noi lo leggiamo per te</p>
      </div>

      <BankStatementImportClient />
    </div>
  );
}
