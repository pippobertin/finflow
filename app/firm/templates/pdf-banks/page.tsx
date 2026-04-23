"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, TestTube, Upload, Copy, Shield, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BankProfile {
  id: string;
  accountingFirmId: string | null;
  bankName: string;
  layoutPatterns: Record<string, unknown>;
  notes: string | null;
  isSystemDefault: boolean;
}

interface TestResult {
  rows: Array<{
    date: string;
    valuta?: string;
    description: string;
    amount: number;
    balance?: number;
  }>;
  totalRows: number;
  warnings: string[];
  rawTextPreview: string;
  stats: { totalLines: number; matchedLines: number; skippedLines: number };
}

const EMPTY_PATTERNS = {
  linePattern: "",
  continuationPattern: null as string | null,
  skipPatterns: ["^\\s*$"],
  dateFormat: "dd/MM/yyyy",
  amountDecimal: ",",
  signConvention: "signed",
};

export default function PdfBanksPage() {
  const [profiles, setProfiles] = useState<BankProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBankName, setEditBankName] = useState("");
  const [editLinePattern, setEditLinePattern] = useState("");
  const [editContinuationPattern, setEditContinuationPattern] = useState("");
  const [editSkipPatterns, setEditSkipPatterns] = useState("");
  const [editDateFormat, setEditDateFormat] = useState("dd/MM/yyyy");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Test dialog
  const [testOpen, setTestOpen] = useState(false);
  const [testProfileId, setTestProfileId] = useState<string | null>(null);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const loadProfiles = useCallback(async () => {
    try {
      const res = await fetch("/api/firm/templates/pdf-banks");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles ?? []);
      }
    } catch {
      toast.error("Errore caricamento profili");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const openCreate = () => {
    setEditId(null);
    setEditBankName("");
    setEditLinePattern(EMPTY_PATTERNS.linePattern);
    setEditContinuationPattern("");
    setEditSkipPatterns(EMPTY_PATTERNS.skipPatterns.join("\n"));
    setEditDateFormat(EMPTY_PATTERNS.dateFormat);
    setEditNotes("");
    setEditOpen(true);
  };

  const openEdit = (p: BankProfile) => {
    const lp = p.layoutPatterns as Record<string, unknown>;
    setEditId(p.id);
    setEditBankName(p.bankName);
    setEditLinePattern((lp.linePattern as string) ?? "");
    setEditContinuationPattern((lp.continuationPattern as string) ?? "");
    setEditSkipPatterns(((lp.skipPatterns as string[]) ?? []).join("\n"));
    setEditDateFormat((lp.dateFormat as string) ?? "dd/MM/yyyy");
    setEditNotes(p.notes ?? "");
    setEditOpen(true);
  };

  const openDuplicate = (p: BankProfile) => {
    const lp = p.layoutPatterns as Record<string, unknown>;
    setEditId(null);
    setEditBankName(p.bankName + " (copia)");
    setEditLinePattern((lp.linePattern as string) ?? "");
    setEditContinuationPattern((lp.continuationPattern as string) ?? "");
    setEditSkipPatterns(((lp.skipPatterns as string[]) ?? []).join("\n"));
    setEditDateFormat((lp.dateFormat as string) ?? "dd/MM/yyyy");
    setEditNotes(p.notes ?? "");
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editBankName.trim() || !editLinePattern.trim()) {
      toast.error("Nome banca e linePattern sono obbligatori");
      return;
    }

    setSaving(true);
    const layoutPatterns = {
      linePattern: editLinePattern,
      continuationPattern: editContinuationPattern || null,
      skipPatterns: editSkipPatterns.split("\n").filter((s) => s.trim()),
      dateFormat: editDateFormat,
      amountDecimal: ",",
      signConvention: "signed",
    };

    try {
      const url = editId
        ? `/api/firm/templates/pdf-banks/${editId}`
        : "/api/firm/templates/pdf-banks";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: editBankName.trim(),
          layoutPatterns,
          notes: editNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Errore nel salvataggio");
        return;
      }

      toast.success(editId ? "Profilo aggiornato" : "Profilo creato");
      setEditOpen(false);
      loadProfiles();
    } catch {
      toast.error("Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminare il profilo "${name}"?`)) return;
    try {
      const res = await fetch(`/api/firm/templates/pdf-banks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Errore nell'eliminazione");
        return;
      }
      toast.success("Profilo eliminato");
      loadProfiles();
    } catch {
      toast.error("Errore di rete");
    }
  };

  const handleTest = async () => {
    if (!testFile || !testProfileId) return;
    setTesting(true);
    setTestResult(null);

    try {
      const formData = new FormData();
      formData.append("file", testFile);
      formData.append("profileId", testProfileId);

      const res = await fetch("/api/firm/templates/pdf-banks/test", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Errore nel test");
        return;
      }

      const data = await res.json();
      setTestResult(data);
      if (data.totalRows === 0) {
        toast.info("Nessuna transazione trovata — verifica i pattern");
      } else {
        toast.success(`${data.totalRows} transazioni trovate`);
      }
    } catch {
      toast.error("Errore di rete");
    } finally {
      setTesting(false);
    }
  };

  const formatEUR = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Template PDF Banche</h1>
          <p className="text-muted-foreground text-sm">
            Profili di parsing per estratti conto PDF delle banche italiane
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nuovo profilo
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Caricamento...</p>}

      {!loading && profiles.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nessun profilo configurato. I profili di sistema verranno creati automaticamente.
          </p>
        </div>
      )}

      {profiles.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-2.5 text-left font-medium">Banca</th>
                <th className="px-4 py-2.5 text-center font-medium">Tipo</th>
                <th className="px-4 py-2.5 text-left font-medium">Formato date</th>
                <th className="px-4 py-2.5 text-left font-medium">Note</th>
                <th className="px-4 py-2.5 text-center font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                >
                  <td className="px-4 py-2 font-medium">{p.bankName}</td>
                  <td className="px-4 py-2 text-center">
                    {p.isSystemDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                        <Shield className="h-3 w-3" /> Sistema
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        <Building2 className="h-3 w-3" /> Studio
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-2 text-xs">
                    {(p.layoutPatterns as Record<string, unknown>).dateFormat as string}
                  </td>
                  <td className="text-muted-foreground max-w-[200px] truncate px-4 py-2 text-xs">
                    {p.notes ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setTestProfileId(p.id);
                          setTestFile(null);
                          setTestResult(null);
                          setTestOpen(true);
                        }}
                      >
                        <TestTube className="mr-1 h-3 w-3" />
                        Test
                      </Button>
                      {p.isSystemDefault ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => openDuplicate(p)}
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          Duplica
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-600"
                            onClick={() => handleDelete(p.id, p.bankName)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifica profilo" : "Nuovo profilo banca"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="bank-name">Nome banca</Label>
              <Input
                id="bank-name"
                value={editBankName}
                onChange={(e) => setEditBankName(e.target.value)}
                placeholder="es. Intesa Sanpaolo"
              />
            </div>
            <div>
              <Label htmlFor="line-pattern">
                Line Pattern{" "}
                <span className="text-muted-foreground text-xs">
                  (regex con gruppi: date, description, amount)
                </span>
              </Label>
              <Textarea
                id="line-pattern"
                value={editLinePattern}
                onChange={(e) => setEditLinePattern(e.target.value)}
                placeholder="(?<date>\d{2}/\d{2}/\d{4})\s+(?<description>.+?)\s{2,}(?<amount>-?[\d.]+,\d{2})"
                rows={3}
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label htmlFor="cont-pattern">
                Continuation Pattern{" "}
                <span className="text-muted-foreground text-xs">
                  (opzionale, per descrizioni multi-riga)
                </span>
              </Label>
              <Input
                id="cont-pattern"
                value={editContinuationPattern}
                onChange={(e) => setEditContinuationPattern(e.target.value)}
                placeholder="^\s{10,}(?<text>.+)$"
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label htmlFor="skip-patterns">
                Skip Patterns <span className="text-muted-foreground text-xs">(uno per riga)</span>
              </Label>
              <Textarea
                id="skip-patterns"
                value={editSkipPatterns}
                onChange={(e) => setEditSkipPatterns(e.target.value)}
                placeholder={"^\\s*$\nData\\s+Valuta\nSALDO\nTOTALE"}
                rows={3}
                className="font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-format">Formato date</Label>
                <Input
                  id="date-format"
                  value={editDateFormat}
                  onChange={(e) => setEditDateFormat(e.target.value)}
                  placeholder="dd/MM/yyyy"
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label>Separatore decimale</Label>
                <Input value="," disabled className="text-muted-foreground text-xs" />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Note</Label>
              <Input
                id="notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Descrizione opzionale..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvataggio..." : editId ? "Aggiorna" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test pattern PDF</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto py-2">
            <div>
              <Label htmlFor="test-file">File PDF di esempio</Label>
              <Input
                id="test-file"
                type="file"
                accept=".pdf"
                onChange={(e) => setTestFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button onClick={handleTest} disabled={testing || !testFile}>
              <Upload className="mr-1.5 h-4 w-4" />
              {testing ? "Analisi in corso..." : "Testa pattern"}
            </Button>

            {testResult && (
              <div className="space-y-3">
                {/* Stats */}
                <div className="flex gap-4 text-xs">
                  <span>
                    Righe totali: <strong>{testResult.stats.totalLines}</strong>
                  </span>
                  <span>
                    Transazioni:{" "}
                    <strong className="text-emerald-600">{testResult.totalRows}</strong>
                  </span>
                  <span>
                    Ignorate: <strong>{testResult.stats.skippedLines}</strong>
                  </span>
                </div>

                {/* Warnings */}
                {testResult.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {testResult.warnings.map((w, i) => (
                      <p key={i}>{w}</p>
                    ))}
                  </div>
                )}

                {/* Preview table */}
                {testResult.rows.length > 0 && (
                  <div className="max-h-72 overflow-auto rounded border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="px-2 py-1.5 text-left">Data</th>
                          <th className="px-2 py-1.5 text-left">Descrizione</th>
                          <th className="px-2 py-1.5 text-right">Importo</th>
                          <th className="px-2 py-1.5 text-right">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testResult.rows.map((r, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="font-numeric px-2 py-1 whitespace-nowrap">{r.date}</td>
                            <td className="max-w-[300px] truncate px-2 py-1">{r.description}</td>
                            <td
                              className={cn(
                                "font-numeric px-2 py-1 text-right whitespace-nowrap",
                                r.amount >= 0 ? "text-emerald-600" : "text-red-600",
                              )}
                            >
                              {formatEUR(r.amount)}
                            </td>
                            <td className="font-numeric text-muted-foreground px-2 py-1 text-right whitespace-nowrap">
                              {r.balance != null ? formatEUR(r.balance) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
