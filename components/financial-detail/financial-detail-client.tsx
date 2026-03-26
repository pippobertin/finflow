"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { X, Info, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/dashboard/navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEUR } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";
import { VatSection } from "@/components/financial-detail/vat-section";

const MONTH_LABELS = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
];

const MONTH_FULL = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

interface CellDetail {
  id: string;
  label: string;
  counterpart?: string;
  amount: number;
  type: string;
  date: string;
  status?: string;
  isReconciled?: boolean;
}

interface MonthlyRow {
  name: string;
  type:
    | "saldoRiportato"
    | "bankInflow"
    | "bankOutflow"
    | "revenue"
    | "cost"
    | "recurring"
    | "vat"
    | "total"
    | "cumulative";
  color?: string;
  months: number[];
  total: number;
}

interface FinancialDetailData {
  year: number;
  rows: MonthlyRow[];
  startingBalance: number;
  detailMap: Record<string, Record<number, CellDetail[]>>;
  currentMonth: number;
  lastActualMonth: number;
  monthDataSource: string[];
  hasBankDataForYear: boolean;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PAID: { label: "Pagata", className: "bg-emerald-100 text-emerald-700" },
  PENDING: { label: "In attesa", className: "bg-amber-100 text-amber-700" },
  OVERDUE: { label: "Scaduta", className: "bg-red-100 text-red-700" },
  PARTIALLY_PAID: { label: "Parz.", className: "bg-blue-100 text-blue-700" },
  RECONCILED: { label: "Riconciliata", className: "bg-teal-100 text-teal-700" },
};

function DrillDownPanel({
  rowName,
  month,
  year,
  details,
  position,
  onClose,
}: {
  rowName: string;
  month: number;
  year: number;
  details: CellDetail[];
  position: { top: number; left: number };
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay to avoid the same click that opened the panel closing it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Clamp position so panel doesn't overflow viewport
  useEffect(() => {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw - 16) {
      panelRef.current.style.left = `${Math.max(16, vw - rect.width - 16)}px`;
    }
    if (rect.bottom > vh - 16) {
      panelRef.current.style.top = `${Math.max(16, vh - rect.height - 16)}px`;
    }
  }, []);

  const total = details.reduce((sum, d) => sum + d.amount, 0);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed z-50 max-h-[400px] w-[380px] overflow-auto rounded-xl border bg-white p-4 shadow-xl dark:bg-neutral-900"
      style={{ top: position.top, left: position.left }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">{rowName}</p>
          <p className="text-muted-foreground text-xs">
            {MONTH_FULL[month]} {year}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="divide-y">
        {details.map((d, i) => (
          <div key={`${d.id}-${i}`} className="flex items-center justify-between gap-2 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{d.label}</p>
              {d.counterpart && (
                <p className="text-muted-foreground truncate text-xs">{d.counterpart}</p>
              )}
              <p className="text-muted-foreground text-xs">
                {new Date(d.date + "T00:00:00").toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {d.status && STATUS_BADGE[d.status] && (
                <Badge
                  variant="secondary"
                  className={cn("text-[10px]", STATUS_BADGE[d.status].className)}
                >
                  {STATUS_BADGE[d.status].label}
                </Badge>
              )}
              <span className="font-numeric text-sm font-semibold tabular-nums">
                {formatEUR(d.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-2">
        <span className="text-muted-foreground text-xs font-medium">
          {details.length} {details.length === 1 ? "voce" : "voci"}
        </span>
        <span className="font-numeric text-sm font-bold">{formatEUR(total)}</span>
      </div>
    </motion.div>
  );
}

export function FinancialDetailClient() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [drillDown, setDrillDown] = useState<{
    rowName: string;
    month: number;
    position: { top: number; left: number };
  } | null>(null);

  const { data, isLoading } = useQuery<FinancialDetailData>({
    queryKey: ["financial-detail", year],
    queryFn: async () => {
      const { data } = await axios.get(`/api/analysis/financial-detail?year=${year}`);
      return data;
    },
  });

  const rows = data?.rows ?? [];
  const currentMonth = data?.currentMonth ?? -1;
  const detailMap = data?.detailMap ?? {};
  const lastActualMonth = data?.lastActualMonth ?? -1;
  const monthDataSource = data?.monthDataSource ?? Array(12).fill("projection");
  const hasBankDataForYear = data?.hasBankDataForYear ?? false;

  const handleCellClick = useCallback(
    (rowName: string, month: number, e: React.MouseEvent) => {
      const details = detailMap[rowName]?.[month];
      if (!details?.length) return;
      setDrillDown({
        rowName,
        month,
        position: { top: e.clientY + 8, left: e.clientX - 190 },
      });
    },
    [detailMap],
  );

  const yearOptions = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

  const drillDownDetails = drillDown ? (detailMap[drillDown.rowName]?.[drillDown.month] ?? []) : [];

  // Determine if we should show the "no bank data" banner
  const showNoBankBanner = !hasBankDataForYear && Number(year) <= currentYear;

  return (
    <>
      <Navbar title="Dettaglio Finanziario" />
      <div className="space-y-4 p-6">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={(v) => v && setYear(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Banner: no bank data */}
        {!isLoading && showNoBankBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
          >
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Dati basati sulle fatture
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                I dati mostrati sono basati sulle fatture. Per i movimenti reali, importa
                l&apos;estratto conto dalla pagina movimenti bancari.
              </p>
              <Link
                href="/bank-statements"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Vai ai movimenti bancari
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <Card className="shadow-card overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b">
                      <th className="bg-muted/30 sticky left-0 z-10 min-w-[200px] px-4 py-3 text-left font-semibold">
                        Voce
                      </th>
                      {MONTH_LABELS.map((m, i) => (
                        <th
                          key={m}
                          className={cn(
                            "min-w-[100px] px-3 py-3 text-right font-medium",
                            i === currentMonth && "bg-primary/5",
                          )}
                        >
                          {m}
                        </th>
                      ))}
                      <th className="min-w-[110px] px-4 py-3 text-right font-bold">TOTALE</th>
                    </tr>
                    {/* Data source badges row */}
                    {lastActualMonth >= 0 && (
                      <tr className="bg-muted/10 border-b">
                        <th className="bg-muted/10 sticky left-0 z-10 min-w-[200px] px-4 py-1" />
                        {monthDataSource.map((source, i) => (
                          <th
                            key={`badge-${i}`}
                            className={cn(
                              "px-3 py-1 text-center",
                              i === currentMonth && "bg-primary/5",
                            )}
                          >
                            <Badge
                              variant="secondary"
                              className={cn(
                                "px-1.5 py-0 text-[9px]",
                                source === "bank"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                              )}
                            >
                              {source === "bank" ? "Effettivo" : "Previsione"}
                            </Badge>
                          </th>
                        ))}
                        <th className="px-4 py-1" />
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={14} className="text-muted-foreground px-4 py-12 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                            Caricamento...
                          </div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="text-muted-foreground px-4 py-12 text-center">
                          Nessun dato disponibile per {year}
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, idx) => {
                        const isTotal = row.type === "total" || row.type === "cumulative";
                        const isSaldoRiportato = row.type === "saldoRiportato";
                        const isBankRow = row.type === "bankInflow" || row.type === "bankOutflow";
                        const isSeparator =
                          row.name === "TOTALE ENTRATE" || row.name === "TOTALE USCITE";

                        return (
                          <tr
                            key={`${row.name}-${idx}`}
                            className={cn(
                              "border-b transition-colors duration-150 last:border-0",
                              isTotal && "bg-muted/20 font-semibold",
                              isSaldoRiportato && "bg-indigo-50/60 dark:bg-indigo-950/30",
                              isBankRow && "bg-blue-50/30 dark:bg-blue-950/10",
                              isSeparator && "border-t-2",
                              !isTotal && !isSaldoRiportato && !isBankRow && "hover:bg-muted/10",
                            )}
                          >
                            <td
                              className={cn(
                                "sticky left-0 z-10 px-4 py-2.5",
                                isTotal ? "bg-muted/20 font-bold" : "bg-card",
                                isSaldoRiportato &&
                                  "bg-indigo-50/60 font-bold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
                                isBankRow && "bg-blue-50/30 dark:bg-blue-950/10",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {row.color && (
                                  <span
                                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: row.color }}
                                  />
                                )}
                                <span
                                  className={cn(
                                    row.type === "revenue" &&
                                      "text-emerald-700 dark:text-emerald-400",
                                    (row.type === "cost" || row.type === "recurring") &&
                                      "text-red-700 dark:text-red-400",
                                    row.type === "vat" && "text-violet-700 dark:text-violet-400",
                                    isSaldoRiportato && "text-indigo-700 dark:text-indigo-400",
                                    row.type === "bankInflow" &&
                                      "text-emerald-600 dark:text-emerald-400",
                                    row.type === "bankOutflow" && "text-red-600 dark:text-red-400",
                                  )}
                                >
                                  {row.name}
                                </span>
                              </div>
                            </td>
                            {row.months.map((val, m) => {
                              const isProjection = monthDataSource[m] === "projection";

                              // Bank rows show "-" in projection months
                              if (isBankRow && isProjection) {
                                return (
                                  <td
                                    key={m}
                                    className={cn(
                                      "font-numeric text-muted-foreground/40 px-3 py-2.5 text-right tabular-nums",
                                      m === currentMonth && "bg-primary/5",
                                    )}
                                  >
                                    -
                                  </td>
                                );
                              }

                              const isForecast =
                                isProjection && currentMonth >= 0 && m > currentMonth;
                              const isNegative = val < 0;
                              const hasDetail = !!detailMap[row.name]?.[m]?.length;

                              return (
                                <td
                                  key={m}
                                  className={cn(
                                    "font-numeric px-3 py-2.5 text-right tabular-nums",
                                    m === currentMonth && "bg-primary/5",
                                    isForecast && "italic opacity-60",
                                    isNegative && "text-red-600",
                                    isTotal && "font-bold",
                                    isSaldoRiportato &&
                                      "font-bold text-indigo-700 dark:text-indigo-400",
                                    hasDetail &&
                                      "hover:bg-primary/10 cursor-pointer rounded hover:underline",
                                  )}
                                  onClick={
                                    hasDetail ? (e) => handleCellClick(row.name, m, e) : undefined
                                  }
                                >
                                  {val === 0 ? "-" : formatEUR(val)}
                                </td>
                              );
                            })}
                            <td
                              className={cn(
                                "font-numeric px-4 py-2.5 text-right font-bold tabular-nums",
                                row.total < 0 && "text-red-600",
                                isSaldoRiportato && "text-indigo-700 dark:text-indigo-400",
                              )}
                            >
                              {formatEUR(row.total)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* VAT Section */}
        <VatSection year={Number(year)} />
      </div>

      {/* Drill-down panel (portal-like, fixed position) */}
      <AnimatePresence>
        {drillDown && drillDownDetails.length > 0 && (
          <DrillDownPanel
            rowName={drillDown.rowName}
            month={drillDown.month}
            year={Number(year)}
            details={drillDownDetails}
            position={drillDown.position}
            onClose={() => setDrillDown(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
