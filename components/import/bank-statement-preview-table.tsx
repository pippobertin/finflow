"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BankStatementMapping } from "@/lib/validations/bank-statement-import";

interface BankStatementPreviewTableProps {
  rows: Record<string, string>[];
  mapping: BankStatementMapping;
  onConfirm: () => void;
  onBack: () => void;
  isPending?: boolean;
}

function getAmountDisplay(
  row: Record<string, string>,
  mapping: BankStatementMapping,
): { text: string; isNeg: boolean } {
  if (mapping.amount) {
    const raw = row[mapping.amount] ?? "";
    const isNeg =
      raw.trim().startsWith("-") ||
      raw.trim().endsWith("-") ||
      parseFloat(raw.replace(/\./g, "").replace(",", ".")) < 0;
    return { text: raw, isNeg };
  }

  // uscite + entrate columns
  const uscite = row[mapping.uscite ?? ""]?.trim() || "";
  const entrate = row[mapping.entrate ?? ""]?.trim() || "";

  if (uscite && (!entrate || entrate === "0" || entrate === "0,00")) {
    return { text: `−${uscite}`, isNeg: true };
  }
  if (entrate && (!uscite || uscite === "0" || uscite === "0,00")) {
    return { text: `+${entrate}`, isNeg: false };
  }
  if (uscite && entrate) {
    return { text: `+${entrate} / −${uscite}`, isNeg: false };
  }
  return { text: "—", isNeg: false };
}

export function BankStatementPreviewTable({
  rows,
  mapping,
  onConfirm,
  onBack,
  isPending,
}: BankStatementPreviewTableProps) {
  const preview = rows.slice(0, 10);
  const hasBalance = !!mapping.balance;
  const hasSeparateAmounts = !!mapping.uscite && !!mapping.entrate;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Anteprima delle prime {Math.min(10, rows.length)} righe di {rows.length} totali.
      </p>
      <div className="max-h-96 overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrizione</TableHead>
              {hasSeparateAmounts ? (
                <>
                  <TableHead className="text-right">Uscite</TableHead>
                  <TableHead className="text-right">Entrate</TableHead>
                </>
              ) : (
                <TableHead className="text-right">Importo</TableHead>
              )}
              {hasBalance && <TableHead className="text-right">Saldo</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((row, i) => {
              if (hasSeparateAmounts) {
                const uscite = row[mapping.uscite!] ?? "";
                const entrate = row[mapping.entrate!] ?? "";
                return (
                  <TableRow key={i}>
                    <TableCell>{row[mapping.date]}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {row[mapping.description]}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      {uscite || "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">
                      {entrate || "—"}
                    </TableCell>
                    {hasBalance && (
                      <TableCell className="text-right font-mono">
                        {row[mapping.balance!]}
                      </TableCell>
                    )}
                  </TableRow>
                );
              }

              const { text, isNeg } = getAmountDisplay(row, mapping);
              return (
                <TableRow key={i}>
                  <TableCell>{row[mapping.date]}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {row[mapping.description]}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${isNeg ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {text}
                  </TableCell>
                  {hasBalance && (
                    <TableCell className="text-right font-mono">{row[mapping.balance!]}</TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Indietro
        </Button>
        <Button onClick={onConfirm} disabled={isPending}>
          {isPending ? "Importazione..." : `Importa ${rows.length} movimenti`}
        </Button>
      </div>
    </div>
  );
}
