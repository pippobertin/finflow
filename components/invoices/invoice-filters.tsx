"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatusLabel, ALL_STATUSES } from "@/lib/helpers/invoice-labels";

interface InvoiceFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  direction?: string;
}

export function InvoiceFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  direction,
}: InvoiceFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Cerca per numero, controparte..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-64"
      />
      <Select value={status} onValueChange={(v) => onStatusChange(v ?? "ALL")}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Stato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tutti gli stati</SelectItem>
          {ALL_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {getStatusLabel(s, direction)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
