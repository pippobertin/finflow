"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Download, Search, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Pagination } from "@/components/dashboard/pagination";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatEUR } from "@/lib/helpers/format";

// ─── Types ──────────────────────────────────────────────────

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string | null;
  direction: "ACTIVE" | "PASSIVE";
  status: "PENDING" | "PAID";
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  notes: string | null;
}

interface PreviewRow {
  number: string;
  date: string;
  dueDate: string | null;
  direction: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  notes: string | null;
  status: string;
}

interface UploadResult {
  totalRows: number;
  importedRows: number;
  skippedDuplicates: number;
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
}

// ─── Component ──────────────────────────────────────────────

export default function FirmFatturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // ── Invoice list state ──
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // ── Upload dialog state ──
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Preview state ──
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewErrors, setPreviewErrors] = useState<{ row: number; message: string }[]>([]);
  const [parsing, setParsing] = useState(false);

  // ── Load invoices ──
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page), pageSize: "50" });
      if (search) sp.set("search", search);
      if (directionFilter !== "all") sp.set("direction", directionFilter);
      const res = await fetch(`/api/firm/clients/${id}/fatture?${sp}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.data ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {
      toast.error("Errore caricamento fatture");
    } finally {
      setLoading(false);
    }
  }, [id, page, search, directionFilter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // ── Client-side file preview ──
  const handleFileSelect = async (file: File) => {
    setUploadFile(file);
    setPreviewRows(null);
    setPreviewErrors([]);
    setParsing(true);

    try {
      // Parse client-side for preview using the same XLSX lib
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        setPreviewErrors([{ row: 0, message: "Il file non contiene fogli" }]);
        setParsing(false);
        return;
      }

      const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        rawNumbers: true,
      });

      if (raw.length < 2) {
        setPreviewErrors([
          { row: 0, message: "Il file deve contenere almeno intestazione + 1 riga" },
        ]);
        setParsing(false);
        return;
      }

      // Simple preview: parse header and show first 10 data rows
      const header = (raw[0] as unknown[]).map((c) =>
        String(c ?? "")
          .trim()
          .toLowerCase(),
      );
      const dataRows = raw
        .slice(1)
        .filter((r) => r && r.some((c) => c != null && String(c).trim() !== ""));
      setPreviewTotal(dataRows.length);

      const rows: PreviewRow[] = dataRows.slice(0, 10).map((row) => {
        const get = (names: string[]) => {
          const idx = header.findIndex((h) => names.includes(h));
          return idx >= 0 ? row[idx] : null;
        };
        const net = Number(get(["imponibile", "netto", "net amount", "netamount"]) ?? 0);
        const vat = Number(get(["iva", "importo iva", "vat amount", "vatamount", "vat"]) ?? 0);
        return {
          number: String(
            get(["numero", "n.", "nr.", "n. fattura", "numero fattura", "number"]) ?? "",
          ),
          date: String(get(["data", "data fattura", "data emissione", "date"]) ?? ""),
          dueDate: get(["scadenza", "data scadenza", "due date", "duedate"])
            ? String(get(["scadenza", "data scadenza", "due date", "duedate"]))
            : null,
          direction: String(get(["direzione", "tipo", "direction", "type"]) ?? ""),
          netAmount: isNaN(net) ? 0 : net,
          vatAmount: isNaN(vat) ? 0 : vat,
          grossAmount: isNaN(net + vat) ? 0 : net + vat,
          notes: get(["note", "notes", "descrizione"])
            ? String(get(["note", "notes", "descrizione"]))
            : null,
          status: String(get(["stato", "status"]) ?? ""),
        };
      });

      setPreviewRows(rows);
    } catch {
      setPreviewErrors([{ row: 0, message: "Errore nella lettura del file" }]);
    } finally {
      setParsing(false);
    }
  };

  // ── Upload & confirm ──
  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch(`/api/firm/clients/${id}/fatture/upload`, {
        method: "POST",
        body: formData,
      });

      const result: UploadResult = await res.json();

      if (!res.ok && result.importedRows === 0 && result.errors?.length) {
        toast.error(`Errore: ${result.errors[0].message}`);
        return;
      }

      // Build toast message
      const parts: string[] = [];
      if (result.importedRows > 0) parts.push(`${result.importedRows} fatture importate`);
      if (result.skippedDuplicates > 0)
        parts.push(`${result.skippedDuplicates} duplicati ignorati`);
      if (result.errors?.length > 0) parts.push(`${result.errors.length} errori`);

      if (result.importedRows > 0) {
        toast.success(parts.join(", "));
      } else if (result.skippedDuplicates > 0) {
        toast.info(parts.join(", "));
      } else {
        toast.warning(parts.join(", ") || "Nessuna fattura importata");
      }

      // Show error details
      if (result.errors?.length > 0) {
        for (const e of result.errors.slice(0, 3)) {
          toast.error(e.message);
        }
      }

      resetUpload();
      loadInvoices();
    } catch {
      toast.error("Errore di rete");
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadOpen(false);
    setUploadFile(null);
    setPreviewRows(null);
    setPreviewTotal(0);
    setPreviewErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Helpers ──
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  };

  const dirLabel = (dir: string) => (dir === "ACTIVE" ? "Attiva" : "Passiva");

  const statusBadge = (status: string, dueDate: string | null) => {
    if (status === "PAID") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          Pagata
        </span>
      );
    }
    if (dueDate && new Date(dueDate) < new Date()) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-400">
          Scaduta
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
        In attesa
      </span>
    );
  };

  // ── Drag & drop handlers ──
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{total} fatture totali</p>
        <div className="flex items-center gap-2">
          <a
            href={`/api/firm/clients/${id}/fatture/template`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            Scarica template
          </a>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            Carica fatture da Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Cerca per numero o note..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={directionFilter}
          onValueChange={(v) => {
            if (v) {
              setDirectionFilter(v);
              setPage(1);
            }
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte</SelectItem>
            <SelectItem value="ACTIVE">Attive</SelectItem>
            <SelectItem value="PASSIVE">Passive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading && <p className="text-muted-foreground">Caricamento...</p>}

      {!loading && invoices.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <FileSpreadsheet className="text-muted-foreground/40 mx-auto mb-3 h-10 w-10" />
          <p className="text-muted-foreground text-sm">
            Nessuna fattura trovata. Carica un file Excel per importare le fatture del cliente.
          </p>
        </div>
      )}

      {invoices.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-2.5 text-left font-medium">Numero</th>
                  <th className="px-4 py-2.5 text-left font-medium">Data</th>
                  <th className="px-4 py-2.5 text-left font-medium">Scadenza</th>
                  <th className="px-4 py-2.5 text-center font-medium">Tipo</th>
                  <th className="px-4 py-2.5 text-right font-medium">Imponibile</th>
                  <th className="px-4 py-2.5 text-right font-medium">IVA</th>
                  <th className="px-4 py-2.5 text-right font-medium">Totale</th>
                  <th className="px-4 py-2.5 text-center font-medium">Stato</th>
                  <th className="px-4 py-2.5 text-left font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  >
                    <td className="px-4 py-2 font-medium whitespace-nowrap">{inv.number}</td>
                    <td className="font-numeric px-4 py-2 text-xs whitespace-nowrap">
                      {formatDate(inv.date)}
                    </td>
                    <td className="font-numeric text-muted-foreground px-4 py-2 text-xs whitespace-nowrap">
                      {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          inv.direction === "ACTIVE"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                            : "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
                        )}
                      >
                        {dirLabel(inv.direction)}
                      </span>
                    </td>
                    <td className="font-numeric px-4 py-2 text-right whitespace-nowrap">
                      {formatEUR(Number(inv.netAmount))}
                    </td>
                    <td className="font-numeric text-muted-foreground px-4 py-2 text-right whitespace-nowrap">
                      {formatEUR(Number(inv.vatAmount))}
                    </td>
                    <td
                      className={cn(
                        "font-numeric px-4 py-2 text-right font-medium whitespace-nowrap",
                        inv.direction === "ACTIVE"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {formatEUR(Number(inv.grossAmount))}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {statusBadge(inv.status, inv.dueDate)}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2 text-xs text-slate-500">
                      {inv.notes ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              itemLabel="fatture"
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!open) resetUpload();
          else setUploadOpen(true);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carica fatture da Excel</DialogTitle>
            <DialogDescription>
              Importa le fatture del cliente da un file Excel (.xlsx, .xls) o CSV.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Dropzone */}
            {!previewRows && previewErrors.length === 0 && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-slate-300 hover:border-slate-400 dark:border-slate-700",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="text-muted-foreground/40 mb-3 h-10 w-10" />
                <p className="text-sm font-medium">
                  Trascina qui il file Excel oppure{" "}
                  <span className="text-primary">clicca per selezionare</span>
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Formati supportati: .xlsx, .xls, .csv
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </div>
            )}

            {/* Parsing indicator */}
            {parsing && (
              <p className="text-muted-foreground text-center text-sm">
                Lettura del file in corso...
              </p>
            )}

            {/* Preview errors */}
            {previewErrors.length > 0 && (
              <div className="space-y-2">
                {previewErrors.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {e.message}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewErrors([]);
                    setUploadFile(null);
                  }}
                >
                  Riprova con un altro file
                </Button>
              </div>
            )}

            {/* Preview table */}
            {previewRows && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">
                      {previewTotal} righe trovate nel file
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewRows(null);
                      setUploadFile(null);
                      setPreviewTotal(0);
                    }}
                  >
                    Cambia file
                  </Button>
                </div>

                <p className="text-muted-foreground text-xs">
                  Anteprima delle prime {Math.min(10, previewRows.length)} righe
                  {previewTotal > 10 ? ` su ${previewTotal} totali` : ""}:
                </p>

                <div className="max-h-[300px] overflow-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-3 py-2 text-left font-medium">Numero</th>
                        <th className="px-3 py-2 text-left font-medium">Data</th>
                        <th className="px-3 py-2 text-center font-medium">Tipo</th>
                        <th className="px-3 py-2 text-right font-medium">Impon.</th>
                        <th className="px-3 py-2 text-right font-medium">IVA</th>
                        <th className="px-3 py-2 text-right font-medium">Totale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-1.5 whitespace-nowrap">{r.number || "—"}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{r.date || "—"}</td>
                          <td className="px-3 py-1.5 text-center">{r.direction || "—"}</td>
                          <td className="font-numeric px-3 py-1.5 text-right">
                            {r.netAmount ? formatEUR(r.netAmount) : "—"}
                          </td>
                          <td className="font-numeric px-3 py-1.5 text-right">
                            {r.vatAmount ? formatEUR(r.vatAmount) : "—"}
                          </td>
                          <td className="font-numeric px-3 py-1.5 text-right font-medium">
                            {r.grossAmount ? formatEUR(r.grossAmount) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetUpload}>
              Annulla
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !uploadFile || !previewRows}>
              {uploading ? "Importazione..." : "Conferma e importa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
