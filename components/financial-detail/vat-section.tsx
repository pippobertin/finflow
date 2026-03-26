"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, CheckCircle2, Clock, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  useVatSnapshots,
  useRecalculateVat,
  useToggleVatPaid,
  type VatSnapshotRow,
} from "@/lib/hooks/use-vat-snapshots";
import { formatEUR, formatDateShort } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VatSectionProps {
  year: number;
}

function periodLabel(row: VatSnapshotRow): string {
  if (row.label) return row.label;

  const start = new Date(row.periodStart);
  const monthNames = [
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

  if (row.periodType === "monthly") {
    return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
  }

  const quarter = Math.floor(start.getMonth() / 3) + 1;
  const romanNumerals = ["I", "II", "III", "IV"];
  return `${romanNumerals[quarter - 1]} Trimestre ${start.getFullYear()}`;
}

export function VatSection({ year }: VatSectionProps) {
  const { data: snapshots, isLoading } = useVatSnapshots(year);
  const recalculate = useRecalculateVat();
  const togglePaid = useToggleVatPaid();
  const [editingPaidDate, setEditingPaidDate] = useState<string | null>(null);

  function handleRecalculate() {
    recalculate.mutate(year, {
      onSuccess: () => toast.success("Periodi IVA ricalcolati"),
      onError: (err) => toast.error(err.message),
    });
  }

  function handleTogglePaid(row: VatSnapshotRow) {
    if (row.id.startsWith("calc-")) {
      toast.error("Tabella fin_vat_snapshot non disponibile. Esegui la migrazione Phase 2.");
      return;
    }

    const newPaid = !row.isPaid;
    togglePaid.mutate(
      {
        id: row.id,
        isPaid: newPaid,
        paidDate: newPaid ? new Date().toISOString().split("T")[0] : undefined,
      },
      {
        onSuccess: () =>
          toast.success(
            newPaid ? "Versamento contrassegnato come pagato" : "Stato pagamento resettato",
          ),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handlePaidDateChange(row: VatSnapshotRow, dateStr: string) {
    if (row.id.startsWith("calc-")) return;
    togglePaid.mutate(
      { id: row.id, isPaid: true, paidDate: dateStr },
      {
        onSuccess: () => {
          toast.success("Data pagamento aggiornata");
          setEditingPaidDate(null);
        },
      },
    );
  }

  const rows = snapshots ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
    >
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-violet-600" />
            Liquidazione IVA — {year}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={recalculate.isPending}
          >
            <RefreshCw
              className={cn("mr-1.5 h-3.5 w-3.5", recalculate.isPending && "animate-spin")}
            />
            Ricalcola
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="px-4 py-3 text-left font-semibold">Periodo</th>
                  <th className="px-3 py-3 text-right font-medium">Debito</th>
                  <th className="px-3 py-3 text-right font-medium">Credito</th>
                  <th className="px-3 py-3 text-right font-medium">Saldo</th>
                  <th className="px-3 py-3 text-right font-medium">Riporto</th>
                  <th className="px-3 py-3 text-right font-medium">Da versare</th>
                  <th className="px-3 py-3 text-right font-medium">Scadenza</th>
                  <th className="px-3 py-3 text-center font-medium">Pagato</th>
                  <th className="px-3 py-3 text-right font-medium">Data pag.</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-muted-foreground px-4 py-12 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                        Caricamento...
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-muted-foreground px-4 py-12 text-center">
                      Nessun dato IVA disponibile per {year}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const hasCarryForward = row.carryForward > 0;
                    const isDue = row.amountDue > 0;
                    const isPastDue =
                      isDue && !row.isPaid && row.dueDate && new Date(row.dueDate) < new Date();

                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "hover:bg-muted/10 border-b transition-colors duration-150 last:border-0",
                          row.isPaid && "bg-emerald-50/30 dark:bg-emerald-950/10",
                          isPastDue && "bg-red-50/30 dark:bg-red-950/10",
                        )}
                      >
                        <td className="px-4 py-2.5 font-medium">
                          <div className="flex items-center gap-2">
                            {periodLabel(row)}
                            {row.periodType === "quarterly" && (
                              <Badge variant="secondary" className="text-[10px]">
                                Trim.
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="font-numeric px-3 py-2.5 text-right text-red-600 tabular-nums">
                          {row.vatDebit > 0 ? formatEUR(row.vatDebit) : "-"}
                        </td>
                        <td className="font-numeric px-3 py-2.5 text-right text-emerald-600 tabular-nums">
                          {row.vatCredit > 0 ? formatEUR(row.vatCredit) : "-"}
                        </td>
                        <td
                          className={cn(
                            "font-numeric px-3 py-2.5 text-right tabular-nums",
                            row.vatBalance > 0
                              ? "text-red-600"
                              : row.vatBalance < 0
                                ? "text-emerald-600"
                                : "",
                          )}
                        >
                          {row.vatBalance !== 0 ? formatEUR(row.vatBalance) : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {hasCarryForward ? (
                            <Badge
                              variant="outline"
                              className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-300"
                            >
                              {formatEUR(row.carryForward)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td
                          className={cn(
                            "font-numeric px-3 py-2.5 text-right font-bold tabular-nums",
                            isDue ? "text-red-700" : "text-emerald-600",
                          )}
                        >
                          {isDue ? formatEUR(row.amountDue) : "Credito"}
                        </td>
                        <td
                          className={cn(
                            "font-numeric px-3 py-2.5 text-right tabular-nums",
                            isPastDue && "font-semibold text-red-600",
                          )}
                        >
                          {row.dueDate ? (
                            <span className="flex items-center justify-end gap-1">
                              {isPastDue && <Clock className="h-3.5 w-3.5 text-red-500" />}
                              {formatDateShort(row.dueDate)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {isDue ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Switch
                                checked={row.isPaid}
                                onCheckedChange={() => handleTogglePaid(row)}
                                size="sm"
                                disabled={togglePaid.isPending}
                              />
                              {row.isPaid && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {row.isPaid && isDue ? (
                            editingPaidDate === row.id ? (
                              <Input
                                type="date"
                                className="h-7 w-32 text-xs"
                                defaultValue={row.paidDate?.split("T")[0] ?? ""}
                                onBlur={(e) => handlePaidDateChange(row, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handlePaidDateChange(row, (e.target as HTMLInputElement).value);
                                  }
                                  if (e.key === "Escape") setEditingPaidDate(null);
                                }}
                                autoFocus
                              />
                            ) : (
                              <button
                                className="font-numeric hover:bg-muted cursor-pointer rounded px-1 py-0.5 text-xs tabular-nums"
                                onClick={() => setEditingPaidDate(row.id)}
                              >
                                {row.paidDate ? formatDateShort(row.paidDate) : "Imposta data"}
                              </button>
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
  );
}
