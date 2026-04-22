"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, CheckCircle, Clock, Circle } from "lucide-react";
import { formatEUR } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MarkAsPaidDialog } from "@/components/firm/mark-as-paid-dialog";

interface F24Row {
  id: string;
  periodLabel: string;
  codiceTributo: string | null;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate: string | null;
  notes: string | null;
}

interface F24FormData {
  periodLabel: string;
  codiceTributo: string;
  amount: string;
  dueDate: string;
  notes: string;
}

const EMPTY_FORM: F24FormData = {
  periodLabel: "",
  codiceTributo: "",
  amount: "",
  dueDate: "",
  notes: "",
};

export default function F24Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [schedules, setSchedules] = useState<F24Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<F24FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Paid dialog
  const [paidId, setPaidId] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  const loadData = useCallback(
    async (signal: AbortSignal) => {
      try {
        const res = await fetch(`/api/firm/clients/${id}/f24?year=${year}`, { signal });
        if (signal.aborted) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? `Errore ${res.status}`);
          setSchedules([]);
        } else {
          const data = await res.json();
          setError(null);
          setSchedules(data.schedules ?? []);
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
    setLoading(true);
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  // Create / Edit
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row: F24Row) => {
    setEditingId(row.id);
    setForm({
      periodLabel: row.periodLabel,
      codiceTributo: row.codiceTributo ?? "",
      amount: String(row.amount),
      dueDate: row.dueDate,
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!form.periodLabel || !form.amount || !form.dueDate) {
      toast.error("Periodo, importo e scadenza sono obbligatori");
      return;
    }

    setSubmitting(true);
    const payload = {
      periodLabel: form.periodLabel,
      codiceTributo: form.codiceTributo || null,
      amount: parseFloat(form.amount.replace(",", ".")),
      dueDate: form.dueDate,
      notes: form.notes || null,
    };

    try {
      const url = editingId
        ? `/api/firm/clients/${id}/f24/${editingId}`
        : `/api/firm/clients/${id}/f24`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Errore nel salvataggio");
        return;
      }

      const saved = await res.json();
      if (editingId) {
        setSchedules((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...saved } : s)));
        toast.success("F24 aggiornato");
      } else {
        setSchedules((prev) => [...prev, saved].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
        toast.success("F24 creato");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  // Mark as paid (via dialog with date picker)
  const handleMarkPaid = useCallback(
    async (paidDate: string) => {
      if (!paidId) return;
      setMarkingPaid(true);
      try {
        const res = await fetch(`/api/firm/clients/${id}/f24/${paidId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPaid: true, paidDate }),
        });
        if (!res.ok) {
          toast.error("Errore nell'aggiornamento");
          return;
        }
        const updated = await res.json();
        setSchedules((prev) => prev.map((s) => (s.id === paidId ? { ...s, ...updated } : s)));
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

  // Reopen (mark as not paid)
  const handleReopen = useCallback(
    async (scheduleId: string) => {
      try {
        const res = await fetch(`/api/firm/clients/${id}/f24/${scheduleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPaid: false, paidDate: null }),
        });
        if (!res.ok) {
          toast.error("Errore nell'aggiornamento");
          return;
        }
        const updated = await res.json();
        setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? { ...s, ...updated } : s)));
        toast.success("Segnata come non pagata");
      } catch {
        toast.error("Errore di rete");
      }
    },
    [id],
  );

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/firm/clients/${id}/f24/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Errore nell'eliminazione");
        return;
      }
      setSchedules((prev) => prev.filter((s) => s.id !== deleteId));
      toast.success("F24 eliminato");
      setDeleteId(null);
    } catch {
      toast.error("Errore di rete");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (s: F24Row) => {
    if (s.isPaid) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          <CheckCircle className="h-3 w-3" /> Pagata
        </span>
      );
    }
    const due = new Date(s.dueDate);
    const isOverdue = due < new Date();
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
        )}
      >
        {isOverdue ? <Clock className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
        {isOverdue ? "Scaduta" : "Da pagare"}
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
            <h1 className="text-2xl font-bold">Scadenze F24</h1>
            <p className="text-muted-foreground text-sm">Gestione tributi e contributi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuovo F24
          </Button>
          <Select
            value={String(year)}
            onValueChange={(v) => {
              setYear(Number(v));
              setLoading(true);
            }}
          >
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

      {!loading && schedules.length === 0 && !error && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nessuna scadenza F24 per {year}. Clicca &quot;Nuovo F24&quot; per aggiungerne una.
          </p>
        </div>
      )}

      {schedules.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-2.5 text-left font-medium">Periodo</th>
                <th className="px-4 py-2.5 text-left font-medium">Codice tributo</th>
                <th className="px-4 py-2.5 text-right font-medium">Importo</th>
                <th className="px-4 py-2.5 text-center font-medium">Scadenza</th>
                <th className="px-4 py-2.5 text-center font-medium">Stato</th>
                <th className="px-4 py-2.5 text-center font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr
                  key={s.id}
                  className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                >
                  <td className="px-4 py-2 font-medium">{s.periodLabel}</td>
                  <td className="font-numeric text-muted-foreground px-4 py-2">
                    {s.codiceTributo || "—"}
                  </td>
                  <td className="font-numeric px-4 py-2 text-right font-semibold">
                    {formatEUR(s.amount)}
                  </td>
                  <td className="font-numeric px-4 py-2 text-center text-xs">
                    {formatDate(s.dueDate)}
                  </td>
                  <td className="px-4 py-2 text-center">{getStatusBadge(s)}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => (s.isPaid ? handleReopen(s.id) : setPaidId(s.id))}
                        className="text-xs"
                      >
                        {s.isPaid ? "Riapri" : "Segna pagata"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={() => setDeleteId(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifica F24" : "Nuovo F24"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="f24-period">Periodo *</Label>
              <Input
                id="f24-period"
                value={form.periodLabel}
                onChange={(e) => setForm((f) => ({ ...f, periodLabel: e.target.value }))}
                placeholder="es. Gennaio 2026"
              />
            </div>
            <div>
              <Label htmlFor="f24-tributo">Codice tributo</Label>
              <Input
                id="f24-tributo"
                value={form.codiceTributo}
                onChange={(e) => setForm((f) => ({ ...f, codiceTributo: e.target.value }))}
                placeholder="es. 1001"
              />
            </div>
            <div>
              <Label htmlFor="f24-amount">Importo (€) *</Label>
              <Input
                id="f24-amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="font-numeric"
              />
            </div>
            <div>
              <Label htmlFor="f24-due">Scadenza *</Label>
              <Input
                id="f24-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="f24-notes">Note</Label>
              <textarea
                id="f24-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmitForm} disabled={submitting}>
              {submitting ? "Salvataggio..." : editingId ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Sei sicuro di voler eliminare questa scadenza F24? L&apos;azione non è reversibile.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
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
