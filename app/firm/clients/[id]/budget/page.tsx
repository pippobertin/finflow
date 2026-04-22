"use client";

import { Fragment, use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, Save, Trash2, BarChart3 } from "lucide-react";
import { formatEUR } from "@/lib/helpers/format";
import { toast } from "sonner";

// ��── CE Category Structure ──────────────────────────────────

interface CategoryDef {
  key: string;
  label: string;
}

interface SectionDef {
  title: string;
  categories: CategoryDef[];
  subtotalLabel?: string;
}

const CE_SECTIONS: SectionDef[] = [
  {
    title: "Ricavi",
    categories: [{ key: "REVENUE", label: "Ricavi" }],
  },
  {
    title: "Costi variabili",
    categories: [
      { key: "VAR_COST_MATERIALS", label: "Materiali" },
      { key: "VAR_COST_SERVICES", label: "Servizi e consulenze" },
      { key: "VAR_COST_DIRECT_LABOR", label: "Manodopera diretta" },
    ],
    subtotalLabel: "Margine di contribuzione",
  },
  {
    title: "Costi fissi operativi",
    categories: [
      { key: "FIXED_COST_ADMIN_COMPENSATION", label: "Compensi amm./soci" },
      { key: "FIXED_COST_RENT", label: "Affitti" },
      { key: "FIXED_COST_UTILITIES", label: "Utenze e telecomunicazioni" },
      { key: "FIXED_COST_INSURANCE", label: "Assicurazioni" },
      { key: "FIXED_COST_CONSULTING", label: "Consulenze amministrative" },
      { key: "FIXED_COST_MARKETING", label: "Marketing e pubblicità" },
      { key: "FIXED_COST_GENERAL", label: "Costi fissi generali" },
    ],
    subtotalLabel: "EBITDA",
  },
  {
    title: "Ammortamenti",
    categories: [{ key: "FIXED_COST_DEPRECIATION", label: "Ammortamenti" }],
    subtotalLabel: "EBIT",
  },
  {
    title: "Gestione finanziaria",
    categories: [
      { key: "FINANCIAL_INCOME", label: "Proventi finanziari" },
      { key: "FINANCIAL_EXPENSE", label: "Oneri finanziari" },
    ],
  },
  {
    title: "Gestione straordinaria",
    categories: [
      { key: "EXTRAORDINARY_INCOME", label: "Proventi straordinari" },
      { key: "EXTRAORDINARY_EXPENSE", label: "Oneri straordinari" },
    ],
    subtotalLabel: "Utile ante imposte",
  },
  {
    title: "Imposte",
    categories: [{ key: "TAX_INCOME", label: "Imposte sul reddito" }],
    subtotalLabel: "Utile netto",
  },
];

const ALL_CATEGORIES = CE_SECTIONS.flatMap((s) => s.categories.map((c) => c.key));
const MONTHS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

// Revenue/income categories (positive in CE)
const INCOME_CATEGORIES = new Set(["REVENUE", "FINANCIAL_INCOME", "EXTRAORDINARY_INCOME"]);

// ─── Types ──────────────────────────────────────────────────

interface BudgetRowData {
  id?: string;
  cdgCategory: string;
  month: number;
  amount: number;
}

// ─── Component ──────────────────────────────────────────────

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<BudgetRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [years, setYears] = useState<number[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Grid data: category → month → amount
  const grid = useCallback(() => {
    const map: Record<string, Record<number, number>> = {};
    for (const cat of ALL_CATEGORIES) {
      map[cat] = {};
      for (let m = 1; m <= 12; m++) map[cat][m] = 0;
    }
    for (const r of rows) {
      if (map[r.cdgCategory]) {
        map[r.cdgCategory][r.month] = r.amount;
      }
    }
    return map;
  }, [rows]);

  const gridData = grid();

  // Load data
  const loadBudget = useCallback(
    async (y: number) => {
      setLoading(true);
      try {
        const [budgetRes, yearsRes] = await Promise.all([
          fetch(`/api/firm/clients/${id}/budget?year=${y}`),
          fetch(`/api/firm/clients/${id}/budget`),
        ]);
        if (budgetRes.ok) {
          const data = await budgetRes.json();
          setRows(data.rows || []);
        }
        if (yearsRes.ok) {
          const data = await yearsRes.json();
          setYears(data.years || []);
        }
      } catch {
        toast.error("Errore nel caricamento del budget");
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    loadBudget(year);
  }, [year, loadBudget]);

  // Cell edit handler
  const handleCellBlur = useCallback(
    async (category: string, month: number, value: string) => {
      const amount = parseFloat(value.replace(",", ".")) || 0;
      const existingRow = rows.find((r) => r.cdgCategory === category && r.month === month);

      if (existingRow?.amount === amount) return; // No change

      // Optimistic update
      setRows((prev) => {
        const idx = prev.findIndex((r) => r.cdgCategory === category && r.month === month);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], amount };
          return updated;
        }
        return [...prev, { cdgCategory: category, month, amount }];
      });

      // Persist
      if (existingRow?.id) {
        await fetch(`/api/firm/clients/${id}/budget/${existingRow.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
      } else if (amount !== 0) {
        // New record — batch save
        await fetch(`/api/firm/clients/${id}/budget/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            rows: [{ cdgCategory: category, month, amount }],
          }),
        });
        // Reload to get IDs
        loadBudget(year);
      }
    },
    [rows, id, year, loadBudget],
  );

  // Row total
  const rowTotal = (category: string) => {
    let sum = 0;
    for (let m = 1; m <= 12; m++) sum += gridData[category]?.[m] || 0;
    return sum;
  };

  // Column total (for a given month, sum of specific categories)
  const colTotal = (month: number, categories: string[]) => {
    let sum = 0;
    for (const cat of categories) sum += gridData[cat]?.[month] || 0;
    return sum;
  };

  // CE cascade computations
  const computeSubtotals = (month: number) => {
    const revenue = gridData["REVENUE"]?.[month] || 0;
    const varCosts =
      (gridData["VAR_COST_MATERIALS"]?.[month] || 0) +
      (gridData["VAR_COST_SERVICES"]?.[month] || 0) +
      (gridData["VAR_COST_DIRECT_LABOR"]?.[month] || 0);
    const mdc = revenue - varCosts;

    const fixedOps =
      (gridData["FIXED_COST_ADMIN_COMPENSATION"]?.[month] || 0) +
      (gridData["FIXED_COST_RENT"]?.[month] || 0) +
      (gridData["FIXED_COST_UTILITIES"]?.[month] || 0) +
      (gridData["FIXED_COST_INSURANCE"]?.[month] || 0) +
      (gridData["FIXED_COST_CONSULTING"]?.[month] || 0) +
      (gridData["FIXED_COST_MARKETING"]?.[month] || 0) +
      (gridData["FIXED_COST_GENERAL"]?.[month] || 0);
    const ebitda = mdc - fixedOps;

    const depreciation = gridData["FIXED_COST_DEPRECIATION"]?.[month] || 0;
    const ebit = ebitda - depreciation;

    const financialNet =
      (gridData["FINANCIAL_INCOME"]?.[month] || 0) - (gridData["FINANCIAL_EXPENSE"]?.[month] || 0);
    const extraordinaryNet =
      (gridData["EXTRAORDINARY_INCOME"]?.[month] || 0) -
      (gridData["EXTRAORDINARY_EXPENSE"]?.[month] || 0);
    const pretax = ebit + financialNet + extraordinaryNet;
    const tax = gridData["TAX_INCOME"]?.[month] || 0;
    const netIncome = pretax - tax;

    return { mdc, ebitda, ebit, pretax, netIncome };
  };

  // Upload handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("year", String(year));

    try {
      const res = await fetch(`/api/firm/clients/${id}/budget/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Errore upload");
        return;
      }

      if (!data.rows || data.rows.length === 0) {
        const catCount = data.matchedCategories?.length ?? 0;
        if (catCount > 0) {
          toast.info(
            `Il file è stato letto correttamente. Trovate ${catCount} categorie CDG ma tutti i valori budget sono a zero (template vuoto?). Puoi inserire i valori manualmente nella griglia.`,
            { duration: 8000 },
          );
        } else {
          toast.info(
            "Nessuna categoria CDG riconosciuta nel file. Verifica che il formato sia corretto.",
            { duration: 8000 },
          );
        }
        return;
      }

      // Confirm the import
      const confirmRes = await fetch(`/api/firm/clients/${id}/budget/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: data.year || year, rows: data.rows }),
      });

      if (confirmRes.ok) {
        const result = await confirmRes.json();
        toast.success(`Budget importato: ${result.upserted} voci`);
        if (data.warnings?.length) {
          toast.info(`${data.warnings.length} avvisi nel parsing`);
        }
        loadBudget(year);
      } else {
        toast.error("Errore nella conferma del budget");
      }
    } catch {
      toast.error("Errore di rete");
    } finally {
      setSaving(false);
      setShowUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!confirm(`Eliminare tutto il budget ${year}?`)) return;
    const res = await fetch(`/api/firm/clients/${id}/budget?year=${year}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`Budget ${year} eliminato`);
      loadBudget(year);
    } else {
      toast.error("Errore eliminazione");
    }
  };

  const subtotalRow = (label: string, key: string) => {
    const annualTotal = (() => {
      let sum = 0;
      for (let m = 1; m <= 12; m++)
        sum += computeSubtotals(m)[key as keyof ReturnType<typeof computeSubtotals>];
      return sum;
    })();

    return (
      <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold dark:border-slate-600 dark:bg-slate-800/50">
        <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1.5 text-xs dark:bg-slate-800/50">
          {label}
        </td>
        {MONTHS.map((_, mi) => {
          const val = computeSubtotals(mi + 1)[key as keyof ReturnType<typeof computeSubtotals>];
          return (
            <td
              key={mi}
              className={`font-numeric px-2 py-1.5 text-right text-xs tabular-nums ${val < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
            >
              {formatEUR(val)}
            </td>
          );
        })}
        <td
          className={`font-numeric px-2 py-1.5 text-right text-xs font-bold tabular-nums ${annualTotal < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
        >
          {formatEUR(annualTotal)}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4 p-6">
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
            <h1 className="text-xl font-bold">Budget</h1>
            <p className="text-muted-foreground text-xs">Griglia mensile per anno</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/firm/clients/${id}/budget/varianze?year=${year}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Varianze
          </Link>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Carica Excel
          </Button>
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5 text-red-500" />
              Elimina anno
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full min-w-[900px] text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-semibold dark:bg-slate-800/50">
                  Voce
                </th>
                {MONTHS.map((m) => (
                  <th key={m} className="w-20 px-2 py-2 text-right font-semibold">
                    {m}
                  </th>
                ))}
                <th className="w-24 px-2 py-2 text-right font-bold">Totale</th>
              </tr>
            </thead>
            <tbody>
              {CE_SECTIONS.map((section) => (
                <Fragment key={section.title}>
                  {/* Section header */}
                  <tr className="border-t border-slate-200 bg-slate-100/50 dark:border-slate-700 dark:bg-slate-800/30">
                    <td
                      colSpan={14}
                      className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
                    >
                      {section.title}
                    </td>
                  </tr>
                  {/* Category rows */}
                  {section.categories.map((cat) => (
                    <tr
                      key={cat.key}
                      className="border-t border-slate-100 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/20"
                    >
                      <td className="sticky left-0 z-10 bg-white px-3 py-1 text-xs dark:bg-slate-900">
                        {cat.label}
                      </td>
                      {MONTHS.map((_, mi) => (
                        <td key={mi} className="px-1 py-0.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={gridData[cat.key]?.[mi + 1] || ""}
                            onBlur={(e) => handleCellBlur(cat.key, mi + 1, e.target.value)}
                            className="font-numeric w-full rounded border-0 bg-transparent px-1 py-0.5 text-right text-xs tabular-nums transition-colors outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 dark:focus:bg-blue-900/20"
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td className="font-numeric px-2 py-1 text-right text-xs font-semibold tabular-nums">
                        {formatEUR(rowTotal(cat.key))}
                      </td>
                    </tr>
                  ))}
                  {/* Subtotal row */}
                  {section.subtotalLabel &&
                    subtotalRow(
                      section.subtotalLabel,
                      section.subtotalLabel === "Margine di contribuzione"
                        ? "mdc"
                        : section.subtotalLabel === "EBITDA"
                          ? "ebitda"
                          : section.subtotalLabel === "EBIT"
                            ? "ebit"
                            : section.subtotalLabel === "Utile ante imposte"
                              ? "pretax"
                              : "netIncome",
                    )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
