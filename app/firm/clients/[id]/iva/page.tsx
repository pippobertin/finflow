"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, RefreshCw, CheckCircle, Circle, Clock } from "lucide-react";
import { formatEUR } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MarkAsPaidDialog } from "@/components/firm/mark-as-paid-dialog";

interface VatSnapshotRow {
  id: string;
  periodStart: string;
  periodEnd: string;
  periodType: string;
  vatDebit: number;
  vatCredit: number;
  vatBalance: number;
  carryForward: number;
  amountDue: number;
  dueDate: string | null;
  isPaid: boolean;
  paidDate: string | null;
  sourceType: string;
  label: string | null;
  surchargeAmount: number;
  creditCarriedOut: number;
}

export default function IvaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [snapshots, setSnapshots] = useState<VatSnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidId, setPaidId] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const loadData = useCallback(
    async (signal: AbortSignal) => {
      try {
        const res = await fetch(`/api/firm/clients/${id}/iva?year=${year}`, { signal });
        if (signal.aborted) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? `Errore ${res.status}`);
          setSnapshots([]);
        } else {
          const data = await res.json();
          setError(null);
          setSnapshots(data.snapshots ?? []);
        }
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : "Errore di rete");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [id, year],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const handleYearChange = useCallback((v: string | null) => {
    if (!v) return;
    setYear(Number(v));
    setLoading(true);
    setError(null);
  }, []);

  const handleRecalculate = useCallback(async () => {
    setRecalculating(true);
    try {
      const res = await fetch(`/api/firm/clients/${id}/iva?year=${year}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Errore nel ricalcolo");
      } else {
        const data = await res.json();
        setSnapshots(data.snapshots ?? []);
        toast.success("IVA ricalcolata con successo");
      }
    } catch {
      toast.error("Errore di rete");
    } finally {
      setRecalculating(false);
    }
  }, [id, year]);

  const handleMarkPaid = useCallback(
    async (paidDate: string) => {
      if (!paidId) return;
      setMarkingPaid(true);
      try {
        const res = await fetch(`/api/firm/clients/${id}/iva/${paidId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPaid: true, paidDate }),
        });
        if (!res.ok) {
          toast.error("Errore nell'aggiornamento");
          return;
        }
        const updated = await res.json();
        setSnapshots((prev) => prev.map((s) => (s.id === paidId ? { ...s, ...updated } : s)));
        toast.success("Segnata come pagata");
        setPaidId(null);
      } catch {
        toast.error("Errore di rete");
      } finally {
        setMarkingPaid(false);
      }
    },
    [id, paidId],
  );

  const handleReopen = useCallback(
    async (snapshotId: string) => {
      try {
        const res = await fetch(`/api/firm/clients/${id}/iva/${snapshotId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPaid: false, paidDate: null }),
        });
        if (!res.ok) {
          toast.error("Errore nell'aggiornamento");
          return;
        }
        const updated = await res.json();
        setSnapshots((prev) => prev.map((s) => (s.id === snapshotId ? { ...s, ...updated } : s)));
        toast.success("Segnata come non pagata");
      } catch {
        toast.error("Errore di rete");
      }
    },
    [id],
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (s: VatSnapshotRow) => {
    if (s.isPaid) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle className="h-3 w-3" /> Pagata
        </span>
      );
    }
    if (s.amountDue === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <Circle className="h-3 w-3" /> A credito
        </span>
      );
    }
    const due = s.dueDate ? new Date(s.dueDate) : null;
    const isOverdue = due && due < new Date();
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          isOverdue
            ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
        )}
      >
        <Clock className="h-3 w-3" /> {isOverdue ? "Scaduta" : "Da pagare"}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/firm/clients/${id}/anagrafica`}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Gestione IVA</h1>
            <p className="text-muted-foreground text-sm">Liquidazioni periodiche</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={recalculating}>
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", recalculating && "animate-spin")} />
            {recalculating ? "Ricalcolo..." : "Ricalcola"}
          </Button>
          <Select value={String(year)} onValueChange={handleYearChange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Caricamento...</p>}
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {!loading && snapshots.length === 0 && !error && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nessun dato IVA per {year}. Clicca &quot;Ricalcola&quot; per generare le liquidazioni.
          </p>
        </div>
      )}

      {snapshots.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-2.5 text-left font-medium">Periodo</th>
                <th className="px-4 py-2.5 text-right font-medium">IVA a debito</th>
                <th className="px-4 py-2.5 text-right font-medium">IVA a credito</th>
                <th className="px-4 py-2.5 text-right font-medium">Saldo</th>
                <th className="px-4 py-2.5 text-right font-medium">Riporto</th>
                <th className="px-4 py-2.5 text-right font-medium">Da versare</th>
                <th className="px-4 py-2.5 text-center font-medium">Scadenza</th>
                <th className="px-4 py-2.5 text-center font-medium">Stato</th>
                <th className="px-4 py-2.5 text-center font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr
                  key={s.id}
                  className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                >
                  <td className="px-4 py-2 font-medium">
                    {s.label ?? `${s.periodType === "monthly" ? "Mese" : "Trimestre"}`}
                  </td>
                  <td className="font-numeric px-4 py-2 text-right">{formatEUR(s.vatDebit)}</td>
                  <td className="font-numeric px-4 py-2 text-right">{formatEUR(s.vatCredit)}</td>
                  <td
                    className={cn(
                      "font-numeric px-4 py-2 text-right",
                      s.vatBalance > 0
                        ? "text-red-600 dark:text-red-400"
                        : s.vatBalance < 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "",
                    )}
                  >
                    {formatEUR(s.vatBalance)}
                  </td>
                  <td className="font-numeric text-muted-foreground px-4 py-2 text-right">
                    {s.carryForward > 0 ? formatEUR(s.carryForward) : "—"}
                  </td>
                  <td
                    className={cn(
                      "font-numeric px-4 py-2 text-right font-semibold",
                      s.amountDue > 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {s.amountDue > 0 ? formatEUR(s.amountDue) : "Credito"}
                  </td>
                  <td className="font-numeric px-4 py-2 text-center text-xs">
                    {formatDate(s.dueDate)}
                  </td>
                  <td className="px-4 py-2 text-center">{getStatusBadge(s)}</td>
                  <td className="px-4 py-2 text-center">
                    {s.amountDue > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => (s.isPaid ? handleReopen(s.id) : setPaidId(s.id))}
                        className="text-xs"
                      >
                        {s.isPaid ? "Riapri" : "Segna pagata"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MarkAsPaidDialog
        open={!!paidId}
        onOpenChange={(open) => {
          if (!open) setPaidId(null);
        }}
        onConfirm={handleMarkPaid}
        loading={markingPaid}
      />
    </div>
  );
}
