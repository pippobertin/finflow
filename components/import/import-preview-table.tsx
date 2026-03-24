"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { CsvColumnMapping } from "@/lib/validations/import";

interface ImportPreviewTableProps {
  rows: Record<string, string>[];
  mapping: CsvColumnMapping;
  onConfirm: () => void;
  onBack: () => void;
  isPending?: boolean;
}

const displayColumns: Array<{ key: keyof CsvColumnMapping; label: string }> = [
  { key: "number", label: "Numero" },
  { key: "date", label: "Data" },
  { key: "counterpart", label: "Controparte" },
  { key: "netAmount", label: "Importo Netto" },
  { key: "vatAmount", label: "IVA" },
  { key: "grossAmount", label: "Importo Lordo" },
];

export function ImportPreviewTable({
  rows,
  mapping,
  onConfirm,
  onBack,
  isPending,
}: ImportPreviewTableProps) {
  const previewRows = rows.slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Anteprima delle prime {previewRows.length} righe su {rows.length} totali
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Indietro
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? "Importazione..." : `Importa ${rows.length} fatture`}
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              {displayColumns.map((col) =>
                mapping[col.key] ? <TableHead key={col.key}>{col.label}</TableHead> : null,
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                {displayColumns.map((col) =>
                  mapping[col.key] ? (
                    <TableCell key={col.key}>{row[mapping[col.key]!] ?? "-"}</TableCell>
                  ) : null,
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
