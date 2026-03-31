"use client";

import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BankStatementMapping } from "@/lib/validations/bank-statement-import";

interface ColumnMapperProps {
  headers: string[];
  previewRows: Record<string, string>[];
  onMappingChange: (mapping: BankStatementMapping) => void;
  initialMapping?: Partial<BankStatementMapping>;
}

const FIELD_OPTIONS = [
  { value: "", label: "— Non mappare —" },
  { value: "date", label: "Data operazione" },
  { value: "valuta", label: "Data valuta" },
  { value: "description", label: "Descrizione" },
  { value: "amount", label: "Importo (con segno)" },
  { value: "uscite", label: "Uscite (Dare)" },
  { value: "entrate", label: "Entrate (Avere)" },
  { value: "balance", label: "Saldo" },
  { value: "reference", label: "Riferimento" },
];

function autoDetectField(header: string): string {
  const h = header.toLowerCase().trim();
  if (/^data(?:\s+op|\s+cont|\s+mov)?$/i.test(h) || h === "data") return "date";
  if (/valuta/i.test(h)) return "valuta";
  if (/descri|causale|dettagl/i.test(h)) return "description";
  if (/^importo$|^amount$/i.test(h)) return "amount";
  if (/uscit|dare|addeb/i.test(h)) return "uscite";
  if (/entrat|avere|accred/i.test(h)) return "entrate";
  if (/saldo|balance/i.test(h)) return "balance";
  if (/riferim|referen|trn/i.test(h)) return "reference";
  return "";
}

export function ColumnMapper({
  headers,
  previewRows,
  onMappingChange,
  initialMapping,
}: ColumnMapperProps) {
  const autoDetected = useMemo(() => {
    const detected: Record<string, string> = {};
    for (const h of headers) {
      const field = autoDetectField(h);
      if (field) detected[h] = field;
    }
    return detected;
  }, [headers]);

  const [columnMap, setColumnMap] = useState<Record<string, string>>(() => {
    if (initialMapping) {
      // Reverse: field -> header
      const reverse: Record<string, string> = {};
      for (const [field, header] of Object.entries(initialMapping)) {
        if (header) reverse[header as string] = field;
      }
      return reverse;
    }
    return autoDetected;
  });

  function handleFieldChange(header: string, field: string) {
    const newMap = { ...columnMap };
    // Remove previous assignment of this field
    for (const [h, f] of Object.entries(newMap)) {
      if (f === field && h !== header) newMap[h] = "";
    }
    newMap[header] = field;
    setColumnMap(newMap);

    // Build mapping object
    const mapping: Record<string, string> = {};
    for (const [h, f] of Object.entries(newMap)) {
      if (f) mapping[f] = h;
    }
    onMappingChange(mapping as unknown as BankStatementMapping);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {headers.map((header) => (
          <div key={header}>
            <Label className="text-xs text-slate-500">{header}</Label>
            <Select
              value={columnMap[header] || ""}
              onValueChange={(v) => handleFieldChange(header, v ?? "")}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleziona campo" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || "none"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {previewRows.length > 0 && (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((h) => (
                    <TableHead key={h} className="text-xs">
                      {h}
                      {columnMap[h] && (
                        <span className="ml-1 text-indigo-500">
                          ({FIELD_OPTIONS.find((o) => o.value === columnMap[h])?.label})
                        </span>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.slice(0, 5).map((row, i) => (
                  <TableRow key={i}>
                    {headers.map((h) => (
                      <TableCell key={h} className="text-xs">
                        {row[h] || "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
