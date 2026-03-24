"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BankStatementMapping } from "@/lib/validations/bank-statement-import";

interface BankStatementColumnMapperProps {
  headers: string[];
  mapping: Partial<BankStatementMapping>;
  onMappingChange: (mapping: Partial<BankStatementMapping>) => void;
  onConfirm: () => void;
}

const NONE_VALUE = "__none__";

type FieldDef = {
  key: keyof BankStatementMapping;
  label: string;
  required?: boolean | "conditional";
  hint?: string;
};

const FIELDS: FieldDef[] = [
  { key: "date", label: "Data", required: true },
  { key: "valuta", label: "Data Valuta" },
  { key: "description", label: "Descrizione", required: true },
  {
    key: "amount",
    label: "Importo",
    required: "conditional",
    hint: "Colonna unica con segno (+ / −)",
  },
  {
    key: "uscite",
    label: "Uscite (Dare)",
    required: "conditional",
    hint: "Se il PDF ha colonne separate",
  },
  {
    key: "entrate",
    label: "Entrate (Avere)",
    required: "conditional",
    hint: "Se il PDF ha colonne separate",
  },
  { key: "balance", label: "Saldo" },
  { key: "reference", label: "Riferimento (CRO/TRN)" },
];

export function BankStatementColumnMapper({
  headers,
  mapping,
  onMappingChange,
  onConfirm,
}: BankStatementColumnMapperProps) {
  const hasAmount = !!mapping.amount;
  const hasDareAvere = !!mapping.uscite && !!mapping.entrate;
  const amountOk = hasAmount || hasDareAvere;
  const requiredOk = !!mapping.date && !!mapping.description && amountOk;

  function handleChange(key: keyof BankStatementMapping, value: string) {
    const next = { ...mapping };
    if (value === NONE_VALUE) {
      delete next[key];
    } else {
      next[key] = value;
    }

    // Clear conflicting fields
    if (key === "amount" && value !== NONE_VALUE) {
      delete next.uscite;
      delete next.entrate;
    }
    if ((key === "uscite" || key === "entrate") && value !== NONE_VALUE) {
      delete next.amount;
    }

    onMappingChange(next);
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Associa le colonne del file ai campi dell&apos;estratto conto. Puoi usare
        &quot;Importo&quot; (colonna unica con segno) oppure &quot;Uscite&quot; +
        &quot;Entrate&quot; (colonne separate).
      </p>

      {FIELDS.map((field) => {
        const isConditional = field.required === "conditional";
        const isRequired = field.required === true;

        // Dim dare/avere if amount is set, dim amount if dare/avere are set
        const dimmed =
          (field.key === "amount" && hasDareAvere) ||
          ((field.key === "uscite" || field.key === "entrate") && hasAmount);

        return (
          <div key={field.key} className="flex items-center gap-4">
            <div className="w-44 shrink-0">
              <Label className={dimmed ? "text-muted-foreground" : ""}>
                {field.label}
                {isRequired && <span className="text-destructive"> *</span>}
                {isConditional && !dimmed && <span className="text-amber-500"> *</span>}
              </Label>
              {field.hint && (
                <p className="text-muted-foreground mt-0.5 text-[10px] leading-tight">
                  {field.hint}
                </p>
              )}
            </div>
            <Select
              value={mapping[field.key] ?? NONE_VALUE}
              onValueChange={(v) => handleChange(field.key, v ?? NONE_VALUE)}
            >
              <SelectTrigger className={`w-full ${dimmed ? "opacity-50" : ""}`}>
                <SelectValue placeholder="Seleziona colonna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>
                  <span className="text-muted-foreground">— Non mappare —</span>
                </SelectItem>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}

      {!amountOk && (mapping.uscite || mapping.entrate) && (
        <p className="text-sm text-amber-600">
          Mappa entrambe le colonne &quot;Uscite&quot; e &quot;Entrate&quot; per procedere.
        </p>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={onConfirm} disabled={!requiredOk}>
          Avanti
        </Button>
      </div>
    </div>
  );
}
