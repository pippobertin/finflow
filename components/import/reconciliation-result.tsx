"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReconciliationResultProps {
  imported: number;
  reconciled: number;
  rejected: number;
  unmatched: number;
  errors: number;
  onReset: () => void;
}

export function ReconciliationResult({
  imported,
  reconciled,
  rejected,
  unmatched,
  errors,
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

      {errors > 0 && (
        <p className="text-sm text-amber-600">
          {errors} righe con errori durante l&apos;importazione
        </p>
      )}

      <Button onClick={onReset}>Importa altro file</Button>
    </div>
  );
}
