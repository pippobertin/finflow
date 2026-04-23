"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Sparkles, CheckCircle2, X, Play, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatEUR } from "@/lib/helpers/format";

const CDG_CATEGORIES = [
  { value: "REVENUE", label: "Ricavi" },
  { value: "VAR_COST_MATERIALS", label: "Mat. variabili" },
  { value: "VAR_COST_SERVICES", label: "Servizi var." },
  { value: "VAR_COST_DIRECT_LABOR", label: "Lavoro diretto" },
  { value: "FIXED_COST_DEPRECIATION", label: "Ammortamenti" },
  { value: "FIXED_COST_ADMIN_COMPENSATION", label: "Compensi amm." },
  { value: "FIXED_COST_RENT", label: "Affitti" },
  { value: "FIXED_COST_UTILITIES", label: "Utenze" },
  { value: "FIXED_COST_INSURANCE", label: "Assicurazioni" },
  { value: "FIXED_COST_CONSULTING", label: "Consulenze" },
  { value: "FIXED_COST_MARKETING", label: "Marketing" },
  { value: "FIXED_COST_GENERAL", label: "Costi generali" },
  { value: "FINANCIAL_INCOME", label: "Prov. finanziari" },
  { value: "FINANCIAL_EXPENSE", label: "Oneri finanziari" },
  { value: "EXTRAORDINARY_INCOME", label: "Prov. straord." },
  { value: "EXTRAORDINARY_EXPENSE", label: "Oneri straord." },
  { value: "TAX_INCOME", label: "Imposte" },
];

interface Suggestion {
  description: string;
  normalizedDescription: string;
  avgAmount: number;
  occurrences: number;
  sampleIds: string[];
  suggestedCdgCategory: string | null;
  suggestedVatRate: number | null;
  confidence: number;
}

interface PatternRule {
  id: string;
  descriptionRegex: string;
  cdgCategory: string;
  vatRate: number | null;
  priority: number;
  isActive: boolean;
  matchCount: number;
}

type Tab = "suggestions" | "rules";

export default function PatternPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>("suggestions");

  // Suggestions tab state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [categoryOverrides, setCategoryOverrides] = useState<Map<number, string>>(new Map());
  const [vatOverrides, setVatOverrides] = useState<Map<number, number | null>>(new Map());
  const [confirming, setConfirming] = useState(false);

  // Rules tab state
  const [rules, setRules] = useState<PatternRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [applying, setApplying] = useState(false);

  // Edit dialog
  const [editRule, setEditRule] = useState<PatternRule | null>(null);
  const [editRegex, setEditRegex] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editVatRate, setEditVatRate] = useState("");
  const [editPriority, setEditPriority] = useState("100");
  const [saving, setSaving] = useState(false);

  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/firm/clients/${id}/movimenti/suggestions`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      }
    } catch {
      toast.error("Errore caricamento suggerimenti");
    } finally {
      setLoadingSuggestions(false);
    }
  }, [id]);

  const loadRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const res = await fetch(`/api/firm/clients/${id}/movimenti/patterns`);
      if (res.ok) {
        const data = await res.json();
        setRules(data.patterns ?? []);
      }
    } catch {
      toast.error("Errore caricamento regole");
    } finally {
      setLoadingRules(false);
    }
  }, [id]);

  useEffect(() => {
    if (tab === "suggestions") loadSuggestions();
    else loadRules();
  }, [tab, loadSuggestions, loadRules]);

  const getCategory = (idx: number, s: Suggestion) =>
    categoryOverrides.get(idx) ?? s.suggestedCdgCategory ?? "";

  const getVat = (idx: number, s: Suggestion) =>
    vatOverrides.has(idx) ? vatOverrides.get(idx) : s.suggestedVatRate;

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => {
    const validIndices = suggestions
      .map((s, i) => (getCategory(i, s) ? i : -1))
      .filter((i) => i >= 0);
    setSelected(new Set(validIndices));
  };

  /** Escape special regex chars, keeping it simple for auto-generated patterns */
  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const handleConfirmSelected = async () => {
    if (selected.size === 0) return;
    setConfirming(true);

    let created = 0;
    for (const idx of selected) {
      const s = suggestions[idx];
      const cat = getCategory(idx, s);
      if (!cat) continue;

      const vat = getVat(idx, s);
      const regex = escapeRegex(s.normalizedDescription);

      try {
        const res = await fetch(`/api/firm/clients/${id}/movimenti/patterns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descriptionRegex: regex,
            cdgCategory: cat,
            vatRate: vat ?? null,
          }),
        });
        if (res.ok) created++;
      } catch {
        // continue with others
      }
    }

    if (created > 0) {
      toast.success(`${created} pattern creati. Applica per categorizzare i movimenti.`);
      setSelected(new Set());
      setCategoryOverrides(new Map());
      setVatOverrides(new Map());
      loadSuggestions();
    } else {
      toast.error("Nessun pattern creato");
    }
    setConfirming(false);
  };

  const handleConfirmSingle = async (idx: number) => {
    const s = suggestions[idx];
    const cat = getCategory(idx, s);
    if (!cat) {
      toast.error("Seleziona una categoria");
      return;
    }

    const vat = getVat(idx, s);
    const regex = escapeRegex(s.normalizedDescription);

    try {
      const res = await fetch(`/api/firm/clients/${id}/movimenti/patterns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descriptionRegex: regex,
          cdgCategory: cat,
          vatRate: vat ?? null,
        }),
      });
      if (res.ok) {
        toast.success("Pattern creato");
        loadSuggestions();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Errore");
      }
    } catch {
      toast.error("Errore di rete");
    }
  };

  const handleApplyAll = async () => {
    setApplying(true);
    try {
      const res = await fetch(`/api/firm/clients/${id}/movimenti/patterns/apply`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.categorized > 0) {
          toast.success(`${data.categorized} movimenti categorizzati`);
          loadRules();
        } else {
          toast.info("Nessun movimento da categorizzare");
        }
      } else {
        toast.error("Errore nell'applicazione");
      }
    } catch {
      toast.error("Errore di rete");
    } finally {
      setApplying(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/firm/clients/${id}/movimenti/patterns/${ruleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Pattern disattivato");
        loadRules();
      }
    } catch {
      toast.error("Errore di rete");
    }
  };

  const openEditDialog = (rule: PatternRule) => {
    setEditRule(rule);
    setEditRegex(rule.descriptionRegex);
    setEditCategory(rule.cdgCategory);
    setEditVatRate(rule.vatRate != null ? String(rule.vatRate) : "");
    setEditPriority(String(rule.priority));
  };

  const handleSaveEdit = async () => {
    if (!editRule) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/firm/clients/${id}/movimenti/patterns/${editRule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descriptionRegex: editRegex,
          cdgCategory: editCategory,
          vatRate: editVatRate ? parseFloat(editVatRate) : null,
          priority: parseInt(editPriority) || 100,
        }),
      });
      if (res.ok) {
        toast.success("Pattern aggiornato");
        setEditRule(null);
        loadRules();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Errore");
      }
    } catch {
      toast.error("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  const categoryLabel = (value: string) =>
    CDG_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <div className="space-y-6 p-6">
      {/* Actions */}
      {tab === "rules" && (
        <div className="flex items-center justify-end">
          <Button onClick={handleApplyAll} disabled={applying || rules.length === 0}>
            <Play className="mr-1.5 h-4 w-4" />
            {applying ? "Applicazione..." : "Applica tutto"}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border p-1">
        <button
          onClick={() => setTab("suggestions")}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "suggestions"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <Sparkles className="mr-1.5 inline-block h-4 w-4" />
          Suggerimenti
        </button>
        <button
          onClick={() => setTab("rules")}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "rules"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Regole ({rules.length})
        </button>
      </div>

      {/* SUGGESTIONS TAB */}
      {tab === "suggestions" && (
        <>
          {loadingSuggestions && <p className="text-muted-foreground">Analisi in corso...</p>}

          {!loadingSuggestions && suggestions.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Sparkles className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">
                Nessun gruppo di movimenti non categorizzati trovato.
              </p>
            </div>
          )}

          {suggestions.length > 0 && (
            <>
              {/* Bulk actions */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Seleziona tutti con categoria
                </Button>
                {selected.size > 0 && (
                  <Button size="sm" onClick={handleConfirmSelected} disabled={confirming}>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {confirming ? "Creazione..." : `Conferma ${selected.size} selezionati`}
                  </Button>
                )}
              </div>

              {/* Suggestion cards */}
              <div className="space-y-3">
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-lg border p-4 transition-colors",
                      selected.has(idx) && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selected.has(idx)}
                        onChange={() => toggleSelect(idx)}
                        className="mt-1"
                      />

                      <div className="min-w-0 flex-1">
                        {/* Description */}
                        <p className="truncate text-sm font-medium">{s.description}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {s.occurrences} movimenti · Media{" "}
                          <span className="font-numeric">{formatEUR(s.avgAmount)}</span>
                        </p>

                        {/* Category + VAT selectors */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Select
                            value={getCategory(idx, s)}
                            onValueChange={(v) => {
                              if (v) {
                                setCategoryOverrides((prev) => {
                                  const next = new Map(prev);
                                  next.set(idx, v);
                                  return next;
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-48 text-xs">
                              <SelectValue placeholder="Categoria CDG..." />
                            </SelectTrigger>
                            <SelectContent>
                              {CDG_CATEGORIES.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={getVat(idx, s) != null ? String(getVat(idx, s)) : "none"}
                            onValueChange={(v) => {
                              if (!v) return;
                              setVatOverrides((prev) => {
                                const next = new Map(prev);
                                next.set(idx, v === "none" ? null : parseFloat(v));
                                return next;
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 w-28 text-xs">
                              <SelectValue placeholder="IVA..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No IVA</SelectItem>
                              <SelectItem value="4">4%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="10">10%</SelectItem>
                              <SelectItem value="22">22%</SelectItem>
                            </SelectContent>
                          </Select>

                          {s.confidence > 0 && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                s.confidence >= 0.7
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                  : s.confidence >= 0.4
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                              )}
                            >
                              {Math.round(s.confidence * 100)}% match
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleConfirmSingle(idx)}
                          title="Conferma"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSuggestions((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          title="Ignora"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* RULES TAB */}
      {tab === "rules" && (
        <>
          {loadingRules && <p className="text-muted-foreground">Caricamento...</p>}

          {!loadingRules && rules.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Nessuna regola configurata. Usa i suggerimenti per creare pattern.
              </p>
            </div>
          )}

          {rules.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-4 py-2.5 text-left font-medium">Regex</th>
                    <th className="px-4 py-2.5 text-center font-medium">Categoria</th>
                    <th className="px-4 py-2.5 text-center font-medium">IVA</th>
                    <th className="px-4 py-2.5 text-center font-medium">Priorità</th>
                    <th className="font-numeric px-4 py-2.5 text-right font-medium">Match</th>
                    <th className="px-4 py-2.5 text-center font-medium">Stato</th>
                    <th className="px-4 py-2.5 text-right font-medium">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr
                      key={r.id}
                      className={cn("border-b last:border-0", !r.isActive && "opacity-50")}
                    >
                      <td className="max-w-[250px] truncate px-4 py-2 font-mono text-xs">
                        {r.descriptionRegex}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                          {categoryLabel(r.cdgCategory)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center text-xs">
                        {r.vatRate != null ? `${r.vatRate}%` : "—"}
                      </td>
                      <td className="font-numeric px-4 py-2 text-center text-xs">{r.priority}</td>
                      <td className="font-numeric px-4 py-2 text-right text-xs">{r.matchCount}</td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            r.isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {r.isActive ? "Attivo" : "Disattivato"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditDialog(r)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500"
                            onClick={() => handleDeleteRule(r.id)}
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
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editRule !== null} onOpenChange={(open) => !open && setEditRule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Pattern</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-regex">Regex descrizione</Label>
              <Input
                id="edit-regex"
                value={editRegex}
                onChange={(e) => setEditRegex(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Categoria CDG</Label>
              <Select value={editCategory} onValueChange={(v) => v && setEditCategory(v)}>
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CDG_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-vat">Aliquota IVA (%)</Label>
                <Input
                  id="edit-vat"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={editVatRate}
                  onChange={(e) => setEditVatRate(e.target.value)}
                  placeholder="Nessuna"
                />
              </div>
              <div>
                <Label htmlFor="edit-priority">Priorità</Label>
                <Input
                  id="edit-priority"
                  type="number"
                  step="1"
                  min="1"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                />
                <p className="text-muted-foreground mt-1 text-xs">Più basso = più prioritario</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRule(null)}>
              Annulla
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
