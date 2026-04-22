"use client";

import { useState } from "react";
import { useClientMovimenti } from "@/lib/hooks/use-client-movimenti";
import { formatEUR, formatDateShort } from "@/lib/helpers/format";
import { ArrowDownUp, ChevronLeft, ChevronRight, Upload, Search } from "lucide-react";
import Link from "next/link";

const CDG_LABELS: Record<string, string> = {
  REVENUE: "Ricavo",
  VAR_COST_MATERIALS: "Costo var. materiali",
  VAR_COST_SERVICES: "Costo var. servizi",
  VAR_COST_DIRECT_LABOR: "Costo var. lavoro",
  FIXED_COST_DEPRECIATION: "Ammortamento",
  FIXED_COST_ADMIN_COMPENSATION: "Compensi amm.",
  FIXED_COST_RENT: "Affitto",
  FIXED_COST_UTILITIES: "Utenze",
  FIXED_COST_INSURANCE: "Assicurazioni",
  FIXED_COST_CONSULTING: "Consulenze",
  FIXED_COST_MARKETING: "Marketing",
  FIXED_COST_GENERAL: "Costi generali",
  FINANCIAL_INCOME: "Provento finanziario",
  FINANCIAL_EXPENSE: "Onere finanziario",
  EXTRAORDINARY_INCOME: "Provento straord.",
  EXTRAORDINARY_EXPENSE: "Onere straord.",
  TAX_INCOME: "Imposte",
};

interface BankStatementRow {
  id: string;
  date: string;
  description: string;
  amount: string;
  balance: string;
  cdgCategory: string | null;
  reference: string | null;
  sourceFile: string | null;
  costCenter: { id: string; name: string; color: string } | null;
}

interface MovimentiResult {
  data: BankStatementRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function MovimentiPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useClientMovimenti({
    search: search || undefined,
    page,
    pageSize: 30,
  }) as { data: MovimentiResult | undefined; isLoading: boolean };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
            Operativo
          </p>
          <h1 className="mt-1 text-2xl font-bold lg:text-3xl">Il tuo conto corrente</h1>
          <p className="mt-1 text-sm text-slate-500">Cosa è entrato e uscito dal conto</p>
        </div>
        <Link
          href="/import"
          className="flex items-center gap-2 rounded-lg bg-[var(--brand,#0b4d8a)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          <Upload className="h-4 w-4" />
          Importa estratto conto
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cerca per descrizione o riferimento..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-4 pl-9 text-sm outline-none focus:border-[var(--brand,#0b4d8a)] sm:max-w-md dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <ArrowDownUp className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm text-slate-500">
            Nessun movimento trovato. Importa un estratto conto per iniziare.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Descrizione
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Categoria CDG
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">
                    Centro
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                    Importo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.data.map((row: BankStatementRow) => {
                  const amount = Number(row.amount);
                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="font-numeric px-4 py-3 whitespace-nowrap text-slate-600 tabular-nums dark:text-slate-400">
                        {formatDateShort(row.date)}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3" title={row.description}>
                        <span className="font-medium">{row.description}</span>
                        {row.reference && (
                          <span className="ml-2 text-xs text-slate-400">{row.reference}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.cdgCategory ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {CDG_LABELS[row.cdgCategory] ?? row.cdgCategory}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.costCenter ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: row.costCenter.color || "#94a3b8" }}
                            />
                            <span className="text-xs">{row.costCenter.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td
                        className={`font-numeric px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums ${
                          amount >= 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {amount >= 0 ? "+" : ""}
                        {formatEUR(amount)}
                      </td>
                      <td className="font-numeric px-4 py-3 text-right whitespace-nowrap text-slate-600 tabular-nums dark:text-slate-400">
                        {formatEUR(Number(row.balance))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{data.total} movimenti</p>
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
