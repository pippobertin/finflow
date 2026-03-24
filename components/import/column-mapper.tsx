"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CsvColumnMapping } from "@/lib/validations/import";

const FIELDS: Array<{ key: keyof CsvColumnMapping; label: string; required: boolean }> = [
  { key: "number", label: "Numero Fattura", required: true },
  { key: "date", label: "Data", required: true },
  { key: "counterpart", label: "Controparte", required: true },
  { key: "netAmount", label: "Importo Netto", required: true },
  { key: "vatAmount", label: "IVA", required: false },
  { key: "grossAmount", label: "Importo Lordo", required: false },
  { key: "description", label: "Descrizione", required: false },
  { key: "vatNumber", label: "P.IVA", required: false },
  { key: "dueDate", label: "Data Scadenza", required: false },
  { key: "status", label: "Stato", required: false },
];

interface ColumnMapperProps {
  headers: string[];
  mapping: Partial<CsvColumnMapping>;
  onMappingChange: (mapping: Partial<CsvColumnMapping>) => void;
  onConfirm: () => void;
}

export function ColumnMapper({ headers, mapping, onMappingChange, onConfirm }: ColumnMapperProps) {
  const requiredFieldsMapped = FIELDS.filter((f) => f.required).every((f) => mapping[f.key]);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Mappa le colonne del CSV ai campi fattura. I campi con * sono obbligatori.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs">
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Select
              value={mapping[field.key] ?? ""}
              onValueChange={(v) =>
                onMappingChange({
                  ...mapping,
                  [field.key]: !v || v === "__none__" ? undefined : v,
                })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Seleziona colonna..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">- Nessuna -</SelectItem>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={onConfirm} disabled={!requiredFieldsMapped}>
          Anteprima
        </Button>
      </div>
    </div>
  );
}
