"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProposedMatch } from "@/lib/reconciliation/reconciliation-engine";

interface ReconciliationTableProps {
  matches: ProposedMatch[];
  onConfirm: (
    decisions: { bankStatementId: string; invoiceId: string; accepted: boolean }[],
  ) => void;
  onSkip: () => void;
  isPending?: boolean;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function ReconciliationTable({
  matches,
  onConfirm,
  onSkip,
  isPending,
}: ReconciliationTableProps) {
  const [accepted, setAccepted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(matches.map((m) => [m.bankStatementId, true])),
  );

  function toggleAll(val: boolean) {
    setAccepted(Object.fromEntries(matches.map((m) => [m.bankStatementId, val])));
  }

  function handleConfirm() {
    const decisions = matches.map((m) => ({
      bankStatementId: m.bankStatementId,
      invoiceId: m.invoiceId,
      accepted: accepted[m.bankStatementId] ?? false,
    }));
    onConfirm(decisions);
  }

  if (matches.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground text-sm">
          Nessun abbinamento trovato tra i movimenti importati e le fatture in sospeso.
        </p>
        <Button onClick={onSkip}>Continua</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Trovati {matches.length} possibili abbinamenti. Seleziona quelli da confermare.
      </p>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => toggleAll(true)}>
          Seleziona tutti
        </Button>
        <Button size="sm" variant="outline" onClick={() => toggleAll(false)}>
          Deseleziona
        </Button>
      </div>

      <div className="max-h-96 overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Data</TableHead>
              <TableHead>Descrizione BS</TableHead>
              <TableHead className="text-right">Importo BS</TableHead>
              <TableHead>Fattura</TableHead>
              <TableHead>Controparte</TableHead>
              <TableHead className="text-right">Importo Fattura</TableHead>
              <TableHead>Confidenza</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((m) => (
              <TableRow key={m.bankStatementId}>
                <TableCell>
                  <Checkbox
                    checked={accepted[m.bankStatementId] ?? false}
                    onCheckedChange={(v) =>
                      setAccepted((prev) => ({
                        ...prev,
                        [m.bankStatementId]: !!v,
                      }))
                    }
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {new Date(m.bankStatementDate).toLocaleDateString("it-IT")}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {m.bankStatementDescription}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${m.bankStatementAmount < 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {formatCurrency(m.bankStatementAmount)}
                </TableCell>
                <TableCell className="font-mono text-xs">{m.invoiceNumber}</TableCell>
                <TableCell className="max-w-[150px] truncate">{m.invoiceCounterpart}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(m.invoiceGrossAmount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={m.confidence === "exact" ? "default" : "secondary"}
                    className={
                      m.confidence === "exact"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }
                  >
                    {m.confidence === "exact" ? "Esatta" : "Approssimativa"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onSkip}>
          Salta
        </Button>
        <Button onClick={handleConfirm} disabled={isPending}>
          {isPending ? "Riconciliazione..." : "Conferma Riconciliazione"}
        </Button>
      </div>
    </div>
  );
}
