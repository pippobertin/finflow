// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy import UI, behind LEGACY_FATTURAPA_IMPORT flag. Will be removed in Block D.
"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParsedFatturaPA } from "@/lib/parsers/fatturapa-parser";

interface FatturapaPreviewProps {
  data: ParsedFatturaPA;
  direction: "ACTIVE" | "PASSIVE";
  onConfirm: () => void;
  onBack: () => void;
  isPending: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(amount);
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function FatturapaPreview({
  data,
  direction,
  onConfirm,
  onBack,
  isPending,
}: FatturapaPreviewProps) {
  const { invoices, errors, warnings } = data;

  // Compute summary
  const dates = invoices.map((i) => i.date).sort();
  const minDate = dates[0] ? formatDate(dates[0]) : "–";
  const maxDate = dates[dates.length - 1] ? formatDate(dates[dates.length - 1]) : "–";
  const totalGross = invoices.reduce((sum, i) => sum + i.grossAmount, 0);

  // Direction ambiguity warnings
  const ambiguous = invoices.filter(
    (i) => i.detectedDirection && i.detectedDirection !== direction,
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Fatture trovate</p>
          <p className="text-2xl font-bold">{invoices.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Periodo</p>
          <p className="text-sm font-semibold">
            {minDate} &rarr; {maxDate}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Totale importi</p>
          <p className="text-2xl font-bold">{formatCurrency(totalGross)}</p>
        </div>
      </div>

      {/* Direction ambiguity alert */}
      {ambiguous.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>{ambiguous.length}</strong> fattura/e hanno una direzione rilevata diversa da
            quella selezionata ({direction === "PASSIVE" ? "Passiva" : "Attiva"}). La scelta
            selezionata avrà la precedenza.
          </span>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="mb-1 font-medium text-amber-800">Avvisi ({warnings.length})</p>
          <ul className="space-y-1 text-amber-700">
            {warnings.slice(0, 5).map((w, i) => (
              <li key={i}>
                {w.file}: {w.message}
              </li>
            ))}
            {warnings.length > 5 && <li>...e altri {warnings.length - 5} avvisi</li>}
          </ul>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
          <p className="mb-1 font-medium text-red-800">
            Errori ({errors.length}) — questi file verranno saltati
          </p>
          <ul className="space-y-1 text-red-700">
            {errors.slice(0, 5).map((e, i) => (
              <li key={i}>
                {e.file}: {e.message}
              </li>
            ))}
            {errors.length > 5 && <li>...e altri {errors.length - 5} errori</li>}
          </ul>
        </div>
      )}

      {/* Preview table (first 5 invoices) */}
      {invoices.length > 0 && (
        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Controparte</TableHead>
                <TableHead>P.IVA</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Netto</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Lordo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.slice(0, 5).map((inv, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm">{inv.number}</TableCell>
                  <TableCell>{formatDate(inv.date)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{inv.counterpart}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {inv.counterpartVatNumber || "–"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {inv.documentType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(inv.netAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(inv.vatAmount)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(inv.grossAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {invoices.length > 5 && (
            <p className="text-muted-foreground border-t px-4 py-2 text-center text-xs">
              ...e altre {invoices.length - 5} fatture
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isPending}>
          Indietro
        </Button>
        <Button onClick={onConfirm} disabled={isPending || invoices.length === 0}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importazione...
            </>
          ) : (
            `Importa ${invoices.length} fatture`
          )}
        </Button>
      </div>
    </div>
  );
}
