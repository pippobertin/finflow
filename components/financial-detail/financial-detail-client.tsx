"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { X, Info, ArrowRight, ChevronRight } from "lucide-react";
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
    | "cumulative"
    | "futureReceivable"
    | "expectedPayable";
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
  OVERDUE_DYNAMIC: { label: "Scaduta", className: "bg-red-100 text-red-700" },
  RECONCILED: { label: "Riconciliata", className: "bg-teal-100 text-teal-700" },
};

function getEffectiveStatusBadge(status?: string, dueDate?: string) {
  if (!status) return undefined;
  if (status === "PENDING" && dueDate && new Date(dueDate + "T00:00:00") < new Date()) {
    return STATUS_BADGE["OVERDUE_DYNAMIC"];
  }
  return STATUS_BADGE[status];
}

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
              {d.status && getEffectiveStatusBadge(d.status, d.date) && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px]",
                    getEffectiveStatusBadge(d.status, d.date)!.className,
                  )}
                >
                  {getEffectiveStatusBadge(d.status, d.date)!.label}
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

type GroupedRow =
  | { kind: "row"; row: MonthlyRow; idx: number }
  | {
      kind: "parent";
      row: MonthlyRow;
      idx: number;
      children: { row: MonthlyRow; idx: number }[];
      sectionKey: string;
    };

export function FinancialDetailClient() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [drillDown, setDrillDown] = useState<{
    rowName: string;
    month: number;
    position: { top: number; left: number };
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((name: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

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

  // Group revenue rows under bankInflow (Fatture Attive) and cost rows under bankOutflow (Fatture Passive)
  const groupedRows = useMemo<GroupedRow[]>(() => {
    const result: GroupedRow[] = [];
    let i = 0;
    while (i < rows.length) {
      const row = rows[i];
      if (row.type === "bankInflow") {
        // Collect subsequent revenue rows as children
        const children: { row: MonthlyRow; idx: number }[] = [];
        let j = i + 1;
        while (j < rows.length && rows[j].type === "revenue") {
          children.push({ row: rows[j], idx: j });
          j++;
        }
        if (children.length > 0) {
          result.push({ kind: "parent", row, idx: i, children, sectionKey: "fatture-attive" });
        } else {
          result.push({ kind: "row", row, idx: i });
        }
        i = j;
      } else if (row.type === "bankOutflow") {
        // Collect subsequent cost rows as children
        const children: { row: MonthlyRow; idx: number }[] = [];
        let j = i + 1;
        while (j < rows.length && rows[j].type === "cost") {
          children.push({ row: rows[j], idx: j });
          j++;
        }
        if (children.length > 0) {
          result.push({ kind: "parent", row, idx: i, children, sectionKey: "fatture-passive" });
        } else {
          result.push({ kind: "row", row, idx: i });
        }
        i = j;
      } else {
        result.push({ kind: "row", row, idx: i });
        i++;
      }
    }
    return result;
  }, [rows]);

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

  function renderRow(row: MonthlyRow, idx: number) {
    const isTotal = row.type === "total" || row.type === "cumulative";
    const isSaldoRiportato = row.type === "saldoRiportato";
    const isBankRow = row.type === "bankInflow" || row.type === "bankOutflow";
    const isSeparator = row.name === "TOTALE ENTRATE" || row.name === "TOTALE USCITE";

    return (
      <tr
        key={`${row.name}-${idx}`}
        className={cn(
          "border-b transition-colors duration-150 last:border-0",
          isTotal && "bg-muted/20 font-semibold",
          isSaldoRiportato && "bg-[var(--primary-light)]",
          isBankRow && "bg-[var(--accent)]",
          isSeparator && "border-t-2",
          !isTotal && !isSaldoRiportato && !isBankRow && "hover:bg-muted/10",
        )}
      >
        <td
          className={cn(
            "sticky left-0 z-10 px-4 py-2.5",
            isTotal ? "bg-[var(--muted)] font-bold" : "bg-[var(--card)]",
            isSaldoRiportato && "bg-[var(--primary-light)] font-bold text-[color:var(--primary)]",
            isBankRow && "bg-[var(--accent)]",
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
                row.type === "revenue" && "text-emerald-700 dark:text-emerald-400",
                (row.type === "cost" || row.type === "recurring") &&
                  "text-red-700 dark:text-red-400",
                row.type === "expectedPayable" && "text-orange-700 dark:text-orange-400",
                row.type === "vat" && "text-violet-700 dark:text-violet-400",
                isSaldoRiportato && "text-[color:var(--primary)]",
                row.type === "bankInflow" && "text-emerald-600 dark:text-emerald-400",
                row.type === "bankOutflow" && "text-red-600 dark:text-red-400",
              )}
            >
              {row.name}
            </span>
          </div>
        </td>
        {row.months.map((val, m) => {
          const isProjection = monthDataSource[m] === "projection";

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

          const isForecast = isProjection && currentMonth >= 0 && m > currentMonth;
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
                isSaldoRiportato && "font-bold text-indigo-700 dark:text-indigo-400",
                hasDetail && "hover:bg-primary/10 cursor-pointer rounded hover:underline",
              )}
              onClick={hasDetail ? (e) => handleCellClick(row.name, m, e) : undefined}
            >
              {val === 0 ? "-" : formatEUR(val)}
            </td>
          );
        })}
        <td
          className={cn(
            "font-numeric px-4 py-2.5 text-right font-bold tabular-nums",
            row.total < 0 && "text-red-600",
            isSaldoRiportato && "text-[color:var(--primary)]",
          )}
        >
          {formatEUR(row.total)}
        </td>
      </tr>
    );
  }

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
                      <th className="sticky left-0 z-10 min-w-[200px] bg-[var(--muted)] px-4 py-3 text-left font-semibold">
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
                        <th className="sticky left-0 z-10 min-w-[200px] bg-[var(--secondary)] px-4 py-1" />
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
                      groupedRows.map((entry) => {
                        if (entry.kind === "row") {
                          return renderRow(entry.row, entry.idx);
                        }
                        // Accordion parent + children
                        const isExpanded = expandedSections.has(entry.sectionKey);
                        const parentRow = entry.row;
                        const isBankInflow = parentRow.type === "bankInflow";
                        return (
                          <React.Fragment key={`group-${entry.sectionKey}-${entry.idx}`}>
                            {/* Accordion parent row */}
                            <tr
                              className={cn(
                                "cursor-pointer border-b transition-colors duration-150 select-none",
                                "bg-[var(--accent)] hover:bg-[var(--accent)]/80",
                              )}
                              onClick={() => toggleSection(entry.sectionKey)}
                            >
                              <td className="sticky left-0 z-10 bg-[var(--accent)] px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <ChevronRight
                                    className={cn(
                                      "h-4 w-4 shrink-0 transition-transform duration-200",
                                      isBankInflow ? "text-emerald-600" : "text-red-600",
                                      isExpanded && "rotate-90",
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "font-semibold",
                                      isBankInflow
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-red-600 dark:text-red-400",
                                    )}
                                  >
                                    {parentRow.name}
                                  </span>
                                </div>
                              </td>
                              {parentRow.months.map((val, m) => {
                                const isProjection = monthDataSource[m] === "projection";
                                if (
                                  (parentRow.type === "bankInflow" ||
                                    parentRow.type === "bankOutflow") &&
                                  isProjection
                                ) {
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
                                const hasDetail = !!detailMap[parentRow.name]?.[m]?.length;
                                return (
                                  <td
                                    key={m}
                                    className={cn(
                                      "font-numeric px-3 py-2.5 text-right font-semibold tabular-nums",
                                      m === currentMonth && "bg-primary/5",
                                      isForecast && "italic opacity-60",
                                      val < 0 && "text-red-600",
                                      hasDetail &&
                                        "hover:bg-primary/10 cursor-pointer rounded hover:underline",
                                    )}
                                    onClick={
                                      hasDetail
                                        ? (e) => {
                                            e.stopPropagation();
                                            handleCellClick(parentRow.name, m, e);
                                          }
                                        : undefined
                                    }
                                  >
                                    {val === 0 ? "-" : formatEUR(val)}
                                  </td>
                                );
                              })}
                              <td className="font-numeric px-4 py-2.5 text-right font-bold tabular-nums">
                                {formatEUR(parentRow.total)}
                              </td>
                            </tr>
                            {/* Accordion children (animated) */}
                            <AnimatePresence>
                              {isExpanded &&
                                entry.children.map((child, childIdx) => (
                                  <motion.tr
                                    key={`child-${child.row.name}-${child.idx}`}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{
                                      duration: 0.2,
                                      delay: childIdx * 0.04,
                                      ease: "easeOut",
                                    }}
                                    className="hover:bg-muted/10 border-b transition-colors duration-150"
                                  >
                                    <td
                                      className="sticky left-0 z-10 bg-[var(--card)] py-2"
                                      style={{ paddingLeft: 40, paddingRight: 16 }}
                                    >
                                      <div className="flex items-center gap-2">
                                        {child.row.color && (
                                          <span
                                            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: child.row.color }}
                                          />
                                        )}
                                        <span
                                          className={cn(
                                            "text-[12.5px]",
                                            child.row.type === "revenue" &&
                                              "text-emerald-700 dark:text-emerald-400",
                                            child.row.type === "cost" &&
                                              "text-red-700 dark:text-red-400",
                                          )}
                                        >
                                          {child.row.name}
                                        </span>
                                      </div>
                                    </td>
                                    {child.row.months.map((val, m) => {
                                      const isProjection = monthDataSource[m] === "projection";
                                      const isForecast =
                                        isProjection && currentMonth >= 0 && m > currentMonth;
                                      const hasDetail = !!detailMap[child.row.name]?.[m]?.length;
                                      return (
                                        <td
                                          key={m}
                                          className={cn(
                                            "font-numeric px-3 py-2 text-right text-[12.5px] tabular-nums",
                                            m === currentMonth && "bg-primary/5",
                                            isForecast && "italic opacity-60",
                                            val < 0 && "text-red-600",
                                            hasDetail &&
                                              "hover:bg-primary/10 cursor-pointer rounded hover:underline",
                                          )}
                                          onClick={
                                            hasDetail
                                              ? (e) => {
                                                  e.stopPropagation();
                                                  handleCellClick(child.row.name, m, e);
                                                }
                                              : undefined
                                          }
                                        >
                                          {val === 0 ? "-" : formatEUR(val)}
                                        </td>
                                      );
                                    })}
                                    <td
                                      className={cn(
                                        "font-numeric px-4 py-2 text-right text-[12.5px] font-bold tabular-nums",
                                        child.row.total < 0 && "text-red-600",
                                      )}
                                    >
                                      {formatEUR(child.row.total)}
                                    </td>
                                  </motion.tr>
                                ))}
                            </AnimatePresence>
                          </React.Fragment>
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
