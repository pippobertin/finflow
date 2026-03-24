"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InvoiceFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
}

export function InvoiceFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
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
          <SelectItem value="PAID">Pagata</SelectItem>
          <SelectItem value="PENDING">In attesa</SelectItem>
          <SelectItem value="OVERDUE">Scaduta</SelectItem>
          <SelectItem value="DRAFT">Bozza</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
