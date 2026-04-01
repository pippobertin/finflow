"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  X,
  Upload,
  Link2,
  Unlink,
  FileText,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface SourceFileInfo {
  sourceFile: string;
  minDate: string;
  maxDate: string;
  recordCount: number;
  closingBalance: number | null;
  overlapsQuarter: boolean;
}

interface DataGap {
  type: string;
  period: string;
  label: string;
  daysOverdue: number;
  priority: "high" | "medium" | "low";
  availableFiles: SourceFileInfo[];
}

interface LinkedEc {
  id: string;
  period: string;
  label: string;
  sourceFile: string | null;
  closingBalance: number | null;
}

const DISMISS_KEY = "finflow_data_freshness_dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

const Q_LABELS: Record<string, string> = {
  "1": "Gen-Mar",
  "2": "Apr-Giu",
  "3": "Lug-Set",
  "4": "Ott-Dic",
};

function fmtBal(n: number): string {
  return n.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Detect quarter period from a date string like "2025-12-31" */
function detectPeriodFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q}_${d.getFullYear()}`;
}

/** Period code → human label, e.g. "Q4_2025" → "Q4 2025 (Ott-Dic)" */
function periodToLabel(period: string): string {
  const m = period.match(/^Q(\d)_(\d{4})$/);
  if (!m) return period;
  return `Q${m[1]} ${m[2]} (${Q_LABELS[m[1]] ?? ""})`;
}

/** Check if a file's date range overlaps a quarter */
function fileOverlapsQuarter(f: SourceFileInfo, period: string): boolean {
  const m = period.match(/^Q(\d)_(\d{4})$/);
  if (!m) return false;
  const q = parseInt(m[1]);
  const y = parseInt(m[2]);
  const sm = (q - 1) * 3;
  const qStart = new Date(y, sm, 1);
  const qEnd = new Date(y, sm + 3, 0);
  const fMin = new Date(f.minDate);
  const fMax = new Date(f.maxDate);
  return fMin <= qEnd && fMax >= qStart;
}

export function DataFreshnessBanner() {
  const [gaps, setGaps] = useState<DataGap[]>([]);
  const [linkedEcs, setLinkedEcs] = useState<LinkedEc[]>([]);
  const [allFiles, setAllFiles] = useState<SourceFileInfo[]>([]);
  const [dismissed, setDismissed] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string>>({});
  const [balanceInputs, setBalanceInputs] = useState<Record<string, string>>({});
  // For linked EC editing: key = ec.id, value = true
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(() => {
    fetch("/api/data-freshness")
      .then((r) => r.json())
      .then((data) => {
        const newGaps: DataGap[] = Array.isArray(data.gaps) ? data.gaps : [];
        const newLinked: LinkedEc[] = Array.isArray(data.linkedEcs) ? data.linkedEcs : [];
        const newFiles: SourceFileInfo[] = Array.isArray(data.allFiles) ? data.allFiles : [];
        setGaps(newGaps);
        setLinkedEcs(newLinked);
        setAllFiles(newFiles);
        setEditingIds(new Set());
        if (newGaps.length > 0 || newLinked.length > 0) {
          setDismissed(false);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION) {
      return;
    }
    fetchData();
  }, [fetchData]);

  // Use ec.id as key for edit state (unique per linked EC)
  function editKey(ec: LinkedEc) {
    return `edit_${ec.id}`;
  }

  function handleSelectFile(key: string, file: SourceFileInfo) {
    setSelectedFiles((prev) => ({ ...prev, [key]: file.sourceFile }));
    if (file.closingBalance != null) {
      setBalanceInputs((prev) => ({
        ...prev,
        [key]: fmtBal(file.closingBalance!).replace(/\./g, ""),
      }));
    } else {
      setBalanceInputs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function handleStartEdit(ec: LinkedEc) {
    const key = editKey(ec);
    setEditingIds((prev) => new Set(prev).add(ec.id));
    if (ec.sourceFile) {
      setSelectedFiles((prev) => ({ ...prev, [key]: ec.sourceFile! }));
    }
    if (ec.closingBalance != null) {
      setBalanceInputs((prev) => ({
        ...prev,
        [key]: fmtBal(ec.closingBalance!).replace(/\./g, ""),
      }));
    }
  }

  function handleCancelEdit(ec: LinkedEc) {
    const key = editKey(ec);
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(ec.id);
      return next;
    });
    setSelectedFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setBalanceInputs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  /** Link or re-link an EC. For edit mode, deletes old DataPeriod first. */
  async function handleLink(key: string, fixedPeriod: string | null, oldEcId?: string) {
    const sel = selectedFiles[key];
    if (!sel) {
      toast.error("Seleziona il file dell\u2019EC per questo trimestre");
      return;
    }

    const balStr = balanceInputs[key];
    if (!balStr) {
      toast.error("Inserisci il saldo di chiusura dell\u2019EC");
      return;
    }
    const closingBalance = parseFloat(balStr.replace(/\./g, "").replace(",", "."));
    if (isNaN(closingBalance)) {
      toast.error("Saldo non valido");
      return;
    }

    // Detect period from file's maxDate
    const fileInfo = allFiles.find((f) => f.sourceFile === sel);
    const detectedPeriod = fileInfo ? detectPeriodFromDate(fileInfo.maxDate) : null;
    const period = fixedPeriod ?? detectedPeriod;

    if (!period) {
      toast.error("Impossibile determinare il trimestre");
      return;
    }

    setProcessing(key);
    try {
      // If editing an existing link, delete the old DataPeriod first
      if (oldEcId) {
        await fetch("/api/data-freshness", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: oldEcId }),
        });
      }

      const res = await fetch("/api/data-freshness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, sourceFile: sel, closingBalance }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Errore");
      }
      toast.success(oldEcId ? "EC aggiornato" : "EC collegato al trimestre");
      setSelectedFiles((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setBalanceInputs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore");
    } finally {
      setProcessing(null);
    }
  }

  async function handleUnlink(id: string) {
    setProcessing(id);
    try {
      const res = await fetch("/api/data-freshness", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Errore");
      toast.success("Collegamento rimosso");
      fetchData();
    } catch {
      toast.error("Errore nella rimozione");
    } finally {
      setProcessing(null);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  if (dismissed) return null;

  const ecGaps = gaps.filter((g) => g.type === "EC_QUARTERLY");
  const movementGaps = gaps.filter((g) => g.type === "MOVEMENTS");
  const hasContent = ecGaps.length > 0 || linkedEcs.length > 0 || movementGaps.length > 0;

  if (!hasContent) return null;

  /** Render file picker + balance input for a given state key and period context */
  function renderFilePicker(
    stateKey: string,
    files: SourceFileInfo[],
    contextPeriod: string | null,
    oldEcId?: string,
  ) {
    // Enrich files with overlap info based on selected file's detected period or context period
    const selFileName = selectedFiles[stateKey];
    const selFileInfo = files.find((f) => f.sourceFile === selFileName);
    const activePeriod = selFileInfo ? detectPeriodFromDate(selFileInfo.maxDate) : contextPeriod;

    const enriched = files.map((f) => ({
      ...f,
      overlapsQuarter: activePeriod ? fileOverlapsQuarter(f, activePeriod) : false,
    }));
    enriched.sort((a, b) =>
      a.overlapsQuarter === b.overlapsQuarter ? 0 : a.overlapsQuarter ? -1 : 1,
    );

    const selFile = enriched.find((f) => f.sourceFile === selFileName) ?? null;
    // Detected period from selected file
    const detectedPeriod = selFile ? detectPeriodFromDate(selFile.maxDate) : null;

    if (enriched.length === 0) {
      return (
        <p className="mt-1 text-[10px] text-slate-500">
          Nessun file caricato trovato. Importa l&apos;estratto conto.
        </p>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
          Seleziona il file dell&apos;EC:
        </p>
        <div className="space-y-1">
          {enriched.map((f) => {
            const isSelected = selFileName === f.sourceFile;
            return (
              <label
                key={f.sourceFile}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors",
                  isSelected
                    ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/30"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500",
                )}
              >
                <input
                  type="radio"
                  name={`ec-file-${stateKey}`}
                  checked={isSelected}
                  onChange={() => handleSelectFile(stateKey, f)}
                  className="accent-indigo-600"
                />
                <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium">{f.sourceFile}</span>
                  <span className="ml-2 text-[10px] text-slate-400">
                    {f.minDate} {"→"} {f.maxDate} {"·"} {f.recordCount} mov.
                  </span>
                  {f.overlapsQuarter && (
                    <span className="ml-1 rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      periodo compatibile
                    </span>
                  )}
                </div>
                {f.closingBalance != null && (
                  <span className="font-numeric shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {fmtBal(f.closingBalance)} {"€"}
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {selFile && (
          <div className="mt-1 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
            {/* Show detected period */}
            {detectedPeriod && (
              <p className="mb-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                Trimestre rilevato: {periodToLabel(detectedPeriod)}
              </p>
            )}

            {selFile.closingBalance != null ? (
              <p className="mb-1 text-[10px] text-slate-600 dark:text-slate-400">
                Saldo chiusura rilevato:{" "}
                <span className="font-numeric font-semibold">
                  {fmtBal(selFile.closingBalance)} {"€"}
                </span>
                {" \u2014 "}modifica se necessario, poi conferma.
              </p>
            ) : (
              <p className="mb-1 text-[10px] text-slate-600 dark:text-slate-400">
                Inserisci il saldo di chiusura come riportato nell&apos;EC (ultima pagina,
                &quot;Saldo finale&quot;).
              </p>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Saldo chiusura EC"
                value={balanceInputs[stateKey] ?? ""}
                onChange={(e) =>
                  setBalanceInputs((prev) => ({
                    ...prev,
                    [stateKey]: e.target.value,
                  }))
                }
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-44 rounded-md border bg-transparent px-2 text-sm transition-colors outline-none focus-visible:ring-1"
              />
              <span className="text-xs text-slate-400">{"€"}</span>
              <Button
                size="sm"
                variant="default"
                className="h-8 text-xs"
                disabled={processing === stateKey || !balanceInputs[stateKey]}
                onClick={() =>
                  handleLink(
                    stateKey,
                    oldEcId ? null : contextPeriod, // gaps: use fixed period; edit: detect from file
                    oldEcId,
                  )
                }
              >
                <Link2 className="mr-1 h-3 w-3" />
                {processing === stateKey ? "..." : "Conferma"}
              </Button>
              {oldEcId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => {
                    const ec = linkedEcs.find((e) => e.id === oldEcId);
                    if (ec) handleCancelEdit(ec);
                  }}
                >
                  Annulla
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-2">
      {(ecGaps.length > 0 || linkedEcs.length > 0) && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Estratti Conto Trimestrali
            </p>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-6 w-6 p-0">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-1.5">
            {/* Gaps: quarters needing EC link */}
            {ecGaps.map((gap) => (
              <div
                key={gap.period}
                className={cn(
                  "rounded-md px-3 py-2",
                  gap.priority === "high"
                    ? "bg-red-50 dark:bg-red-950/20"
                    : "bg-amber-50 dark:bg-amber-950/20",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={cn(
                        "h-3.5 w-3.5",
                        gap.priority === "high" ? "text-red-500" : "text-amber-500",
                      )}
                    />
                    <span className="text-xs font-medium">{gap.label}</span>
                    <span className="text-[10px] text-slate-500">
                      (scaduto da {gap.daysOverdue + 7}gg)
                    </span>
                  </div>
                  <Link
                    href="/import"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-7 text-xs",
                    )}
                  >
                    <Upload className="mr-1 h-3 w-3" />
                    Carica EC
                  </Link>
                </div>
                {renderFilePicker(
                  gap.period,
                  gap.availableFiles.length > 0 ? gap.availableFiles : allFiles,
                  gap.period,
                )}
              </div>
            ))}

            {/* Linked ECs */}
            {linkedEcs.map((ec) => {
              const isEditing = editingIds.has(ec.id);
              const key = editKey(ec);

              return (
                <div
                  key={ec.id}
                  className={cn(
                    "rounded-md px-3 py-2",
                    isEditing
                      ? "bg-indigo-50 dark:bg-indigo-950/20"
                      : "bg-emerald-50 dark:bg-emerald-950/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium">{ec.label}</span>
                      {ec.closingBalance != null && (
                        <span className="font-numeric text-[10px] text-emerald-700 dark:text-emerald-400">
                          Saldo: {fmtBal(ec.closingBalance)} {"€"}
                        </span>
                      )}
                      {ec.sourceFile && (
                        <span className="text-[10px] text-slate-400">({ec.sourceFile})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-slate-500 hover:text-indigo-600"
                        disabled={!!processing}
                        onClick={() => (isEditing ? handleCancelEdit(ec) : handleStartEdit(ec))}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        {isEditing ? "Annulla" : "Modifica"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-slate-500 hover:text-red-600"
                        disabled={!!processing}
                        onClick={() => handleUnlink(ec.id)}
                      >
                        <Unlink className="mr-1 h-3 w-3" />
                        Rimuovi
                      </Button>
                    </div>
                  </div>

                  {isEditing && renderFilePicker(key, allFiles, null, ec.id)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {movementGaps.map((gap) => (
        <div
          key={gap.period}
          className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="flex-1 text-xs font-medium">
            Non ci sono movimenti bancari da {gap.daysOverdue + 30} giorni. Importa i movimenti
            aggiornati.
          </p>
          <Link
            href="/import"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}
          >
            <Upload className="mr-1 h-3 w-3" />
            Importa
          </Link>
        </div>
      ))}
    </div>
  );
}
