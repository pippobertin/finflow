"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
  startDate: string;
  endDate: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
}

export function InvoiceFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  direction,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
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
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500">Dal</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className={cn(
            "border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-36 rounded-lg border bg-transparent px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-3",
          )}
        />
        <span className="text-xs text-slate-500">al</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className={cn(
            "border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-36 rounded-lg border bg-transparent px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-3",
          )}
        />
      </div>
    </div>
  );
}
