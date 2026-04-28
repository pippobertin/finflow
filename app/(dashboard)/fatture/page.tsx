"use client";

import { useState } from "react";
import {
  useClientFatture,
  useCreateFattura,
  useMarkFatturaPaid,
} from "@/lib/hooks/use-client-fatture";
import { formatEUR, formatDateShort } from "@/lib/helpers/format";
import { FileText, Plus, Check, ChevronLeft, ChevronRight, X, ArrowDownLeft } from "lucide-react";

interface InvoiceRow {
  id: string;
  number: string;
  direction: "ACTIVE" | "PASSIVE";
  status: "PENDING" | "PAID";
  date: string;
  dueDate: string | null;
  netAmount: string;
  vatAmount: string;
  grossAmount: string;
  notes: string | null;
  paidAt: string | null;
}

interface FattureResult {
  data: InvoiceRow[];
  total: number;
  totalGrossAmount: number;
  pendingReceivable: { total: number; count: number };
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function FatturePage() {
  const [directionFilter, setDirectionFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useClientFatture({
    direction: directionFilter,
    status: statusFilter,
    search: search || undefined,
    page,
    pageSize: 15,
  }) as { data: FattureResult | undefined; isLoading: boolean };

  const markPaid = useMarkFatturaPaid();

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
            Operativo
          </p>
          <h1 className="mt-1 text-2xl font-bold lg:text-3xl">Le tue fatture</h1>
          <p className="mt-1 text-sm text-slate-500">Tutto quello che hai emesso e ricevuto</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-[var(--brand,#0b4d8a)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Chiudi" : "Nuova fattura"}
        </button>
      </div>

      {/* Create form */}
      {showForm && <CreateInvoiceForm onClose={() => setShowForm(false)} />}

      {/* Hero KPI */}
      {data && (
        <div
          className="rounded-xl p-4 text-white"
          style={{ backgroundColor: "var(--brand, #0b4d8a)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <ArrowDownLeft className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">
              Fatture da incassare
            </p>
          </div>
          <p className="font-numeric mt-2 text-2xl font-bold tabular-nums">
            {formatEUR(data.pendingReceivable.total)}
          </p>
          <p className="mt-0.5 text-xs text-white/60">
            {data.pendingReceivable.count} fatture attive in attesa
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {[
            { value: undefined, label: "Tutte" },
            { value: "ACTIVE", label: "Attive" },
            { value: "PASSIVE", label: "Passive" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                setDirectionFilter(opt.value);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                directionFilter === opt.value
                  ? "bg-[var(--brand,#0b4d8a)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[
            { value: undefined, label: "Tutti" },
            { value: "PENDING", label: "Da pagare" },
            { value: "PAID", label: "Pagate" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                setStatusFilter(opt.value);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-[var(--brand,#0b4d8a)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Cerca fattura..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-[var(--brand,#0b4d8a)] dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm text-slate-500">Nessuna fattura trovata.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    N.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Scadenza
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                    Imponibile
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                    IVA
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                    Totale
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">
                    Stato
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.data.map((inv: InvoiceRow) => (
                  <tr
                    key={inv.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-medium">{inv.number}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          inv.direction === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {inv.direction === "ACTIVE" ? "Attiva" : "Passiva"}
                      </span>
                    </td>
                    <td className="font-numeric px-4 py-3 text-slate-600 tabular-nums dark:text-slate-400">
                      {formatDateShort(inv.date)}
                    </td>
                    <td className="font-numeric px-4 py-3 text-slate-600 tabular-nums dark:text-slate-400">
                      {inv.dueDate ? formatDateShort(inv.dueDate) : "—"}
                    </td>
                    <td className="font-numeric px-4 py-3 text-right tabular-nums">
                      {formatEUR(Number(inv.netAmount))}
                    </td>
                    <td className="font-numeric px-4 py-3 text-right text-slate-500 tabular-nums">
                      {formatEUR(Number(inv.vatAmount))}
                    </td>
                    <td className="font-numeric px-4 py-3 text-right font-semibold tabular-nums">
                      {formatEUR(Number(inv.grossAmount))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          inv.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {inv.status === "PAID" ? "Pagata" : "In attesa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {inv.status === "PENDING" && (
                        <button
                          onClick={() => markPaid.mutate({ invoiceId: inv.id })}
                          disabled={markPaid.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                          title="Segna come pagata"
                        >
                          <Check className="h-3 w-3" />
                          Marca come pagata
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {data.total} fatture · Totale lordo: {formatEUR(data.totalGrossAmount)}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-xs text-slate-500">
                  {page}/{data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CreateInvoiceForm({ onClose }: { onClose: () => void }) {
  const create = useCreateFattura();
  const [form, setForm] = useState({
    direction: "ACTIVE" as "ACTIVE" | "PASSIVE",
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
    netAmount: "",
    vatAmount: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const net = parseFloat(form.netAmount.replace(",", "."));
    const vat = parseFloat((form.vatAmount || "0").replace(",", "."));
    if (isNaN(net) || net <= 0) return;

    create.mutate(
      {
        direction: form.direction,
        date: form.date,
        dueDate: form.dueDate || undefined,
        netAmount: net,
        vatAmount: isNaN(vat) ? 0 : vat,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--brand,#0b4d8a)]/20 bg-[var(--brand,#0b4d8a)]/5 p-5"
    >
      <h3 className="mb-4 text-sm font-semibold">Nuova fattura</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Direction */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Tipo *
          </label>
          <div className="flex gap-2">
            {(["ACTIVE", "PASSIVE"] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => setForm((f) => ({ ...f, direction: dir }))}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  form.direction === dir
                    ? dir === "ACTIVE"
                      ? "bg-emerald-600 text-white"
                      : "bg-red-500 text-white"
                    : "bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {dir === "ACTIVE" ? "Attiva (incasso)" : "Passiva (pagamento)"}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Data fattura *
          </label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        {/* Due date */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Scadenza
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        {/* Net amount */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Imponibile (€) *
          </label>
          <input
            type="text"
            required
            placeholder="1.000,00"
            value={form.netAmount}
            onChange={(e) => setForm((f) => ({ ...f, netAmount: e.target.value }))}
            className="font-numeric w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        {/* VAT */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            IVA (€)
          </label>
          <input
            type="text"
            placeholder="220,00"
            value={form.vatAmount}
            onChange={(e) => setForm((f) => ({ ...f, vatAmount: e.target.value }))}
            className="font-numeric w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Note
          </label>
          <input
            type="text"
            placeholder="Descrizione opzionale"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-lg bg-[var(--brand,#0b4d8a)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {create.isPending ? "Salvataggio..." : "Salva fattura"}
        </button>
      </div>
    </form>
  );
}
