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
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { formatEUR } from "@/lib/helpers/format";
import { toast } from "sonner";

interface LoanRow {
  id: string;
  loanName: string;
  bankName: string | null;
  totalAmount: number;
  installment: number;
  principal: number | null;
  interest: number | null;
  frequency: string;
  startDate: string;
  endDate: string | null;
  dayOfMonth: number | null;
  notes: string | null;
}

interface LoanFormData {
  loanName: string;
  bankName: string;
  totalAmount: string;
  installment: string;
  principal: string;
  interest: string;
  frequency: string;
  startDate: string;
  endDate: string;
  dayOfMonth: string;
  notes: string;
}

const EMPTY_FORM: LoanFormData = {
  loanName: "",
  bankName: "",
  totalAmount: "",
  installment: "",
  principal: "",
  interest: "",
  frequency: "MONTHLY",
  startDate: "",
  endDate: "",
  dayOfMonth: "",
  notes: "",
};

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Mensile",
  QUARTERLY: "Trimestrale",
  SEMIANNUAL: "Semestrale",
  ANNUAL: "Annuale",
};

export default function PrestitiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LoanFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(
    async (signal: AbortSignal) => {
      try {
        const res = await fetch(`/api/firm/clients/${id}/loans`, { signal });
        if (signal.aborted) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? `Errore ${res.status}`);
          setLoans([]);
        } else {
          const data = await res.json();
          setError(null);
          setLoans(data.loans ?? []);
        }
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : "Errore di rete");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row: LoanRow) => {
    setEditingId(row.id);
    setForm({
      loanName: row.loanName,
      bankName: row.bankName ?? "",
      totalAmount: String(row.totalAmount),
      installment: String(row.installment),
      principal: row.principal != null ? String(row.principal) : "",
      interest: row.interest != null ? String(row.interest) : "",
      frequency: row.frequency,
      startDate: row.startDate,
      endDate: row.endDate ?? "",
      dayOfMonth: row.dayOfMonth != null ? String(row.dayOfMonth) : "",
      notes: row.notes ?? "",
    });
    setDialogOpen(true);
  };

  const parseNum = (s: string) => {
    const v = parseFloat(s.replace(",", "."));
    return isNaN(v) ? null : v;
  };

  const handleSubmitForm = async () => {
    if (!form.loanName || !form.totalAmount || !form.installment || !form.startDate) {
      toast.error("Nome, importo totale, rata e data inizio sono obbligatori");
      return;
    }

    setSubmitting(true);
    const payload = {
      loanName: form.loanName,
      bankName: form.bankName || null,
      totalAmount: parseNum(form.totalAmount),
      installment: parseNum(form.installment),
      principal: parseNum(form.principal),
      interest: parseNum(form.interest),
      frequency: form.frequency,
      startDate: form.startDate,
      endDate: form.endDate || null,
      dayOfMonth: form.dayOfMonth ? parseInt(form.dayOfMonth, 10) : null,
      notes: form.notes || null,
    };

    try {
      const url = editingId
        ? `/api/firm/clients/${id}/loans/${editingId}`
        : `/api/firm/clients/${id}/loans`;
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
        setLoans((prev) => prev.map((l) => (l.id === editingId ? { ...l, ...saved } : l)));
        toast.success("Prestito aggiornato");
      } else {
        setLoans((prev) => [...prev, saved].sort((a, b) => a.startDate.localeCompare(b.startDate)));
        toast.success("Prestito creato");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Errore di rete");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/firm/clients/${id}/loans/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Errore nell'eliminazione");
        return;
      }
      setLoans((prev) => prev.filter((l) => l.id !== deleteId));
      toast.success("Prestito eliminato");
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
            <h1 className="text-2xl font-bold">Gestione Prestiti</h1>
            <p className="text-muted-foreground text-sm">Finanziamenti e mutui</p>
          </div>
        </div>
        <Button variant="default" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nuovo prestito
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Caricamento...</p>}
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {!loading && loans.length === 0 && !error && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nessun prestito registrato. Clicca &quot;Nuovo prestito&quot; per aggiungerne uno.
          </p>
        </div>
      )}

      {loans.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-2.5 text-left font-medium">Nome</th>
                <th className="px-4 py-2.5 text-left font-medium">Banca</th>
                <th className="px-4 py-2.5 text-right font-medium">Totale</th>
                <th className="px-4 py-2.5 text-right font-medium">Rata</th>
                <th className="px-4 py-2.5 text-center font-medium">Frequenza</th>
                <th className="px-4 py-2.5 text-center font-medium">Inizio</th>
                <th className="px-4 py-2.5 text-center font-medium">Fine</th>
                <th className="px-4 py-2.5 text-center font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr
                  key={l.id}
                  className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                >
                  <td className="px-4 py-2 font-medium">{l.loanName}</td>
                  <td className="text-muted-foreground px-4 py-2">{l.bankName || "—"}</td>
                  <td className="font-numeric px-4 py-2 text-right">{formatEUR(l.totalAmount)}</td>
                  <td className="font-numeric px-4 py-2 text-right font-semibold">
                    {formatEUR(l.installment)}
                  </td>
                  <td className="px-4 py-2 text-center text-xs">
                    {FREQUENCY_LABELS[l.frequency] ?? l.frequency}
                  </td>
                  <td className="font-numeric px-4 py-2 text-center text-xs">
                    {formatDate(l.startDate)}
                  </td>
                  <td className="font-numeric px-4 py-2 text-center text-xs">
                    {formatDate(l.endDate)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(l)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={() => setDeleteId(l.id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifica prestito" : "Nuovo prestito"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="loan-name">Nome prestito *</Label>
                <Input
                  id="loan-name"
                  value={form.loanName}
                  onChange={(e) => setForm((f) => ({ ...f, loanName: e.target.value }))}
                  placeholder="es. Mutuo sede"
                />
              </div>
              <div>
                <Label htmlFor="loan-bank">Banca</Label>
                <Input
                  id="loan-bank"
                  value={form.bankName}
                  onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                  placeholder="es. Intesa Sanpaolo"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="loan-total">Importo totale (€) *</Label>
                <Input
                  id="loan-total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.totalAmount}
                  onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                  className="font-numeric"
                />
              </div>
              <div>
                <Label htmlFor="loan-installment">Rata (€) *</Label>
                <Input
                  id="loan-installment"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.installment}
                  onChange={(e) => setForm((f) => ({ ...f, installment: e.target.value }))}
                  className="font-numeric"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="loan-principal">Quota capitale (€)</Label>
                <Input
                  id="loan-principal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.principal}
                  onChange={(e) => setForm((f) => ({ ...f, principal: e.target.value }))}
                  className="font-numeric"
                />
              </div>
              <div>
                <Label htmlFor="loan-interest">Quota interessi (€)</Label>
                <Input
                  id="loan-interest"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.interest}
                  onChange={(e) => setForm((f) => ({ ...f, interest: e.target.value }))}
                  className="font-numeric"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="loan-freq">Frequenza</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => v && setForm((f) => ({ ...f, frequency: v }))}
                >
                  <SelectTrigger id="loan-freq">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensile</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestrale</SelectItem>
                    <SelectItem value="SEMIANNUAL">Semestrale</SelectItem>
                    <SelectItem value="ANNUAL">Annuale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="loan-day">Giorno del mese</Label>
                <Input
                  id="loan-day"
                  type="number"
                  min="1"
                  max="31"
                  value={form.dayOfMonth}
                  onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: e.target.value }))}
                  placeholder="es. 15"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="loan-start">Data inizio *</Label>
                <Input
                  id="loan-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="loan-end">Data fine</Label>
                <Input
                  id="loan-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="loan-notes">Note</Label>
              <textarea
                id="loan-notes"
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
            Sei sicuro di voler eliminare questo prestito? L&apos;azione non è reversibile.
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
    </div>
  );
}
