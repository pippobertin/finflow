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
import { ArrowLeft, Upload, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatEUR } from "@/lib/helpers/format";

interface Movement {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number;
  cdgCategory: string | null;
  costCenter: { id: string; name: string; color: string } | null;
  reference: string | null;
  sourceFile: string | null;
}

interface BankOption {
  bankName: string;
  isSystemDefault: boolean;
}

const CDG_LABELS: Record<string, string> = {
  REVENUE: "Ricavi",
  VAR_COST_MATERIALS: "Mat. variabili",
  VAR_COST_SERVICES: "Servizi var.",
  VAR_COST_DIRECT_LABOR: "Lavoro diretto",
  FIXED_COST_DEPRECIATION: "Ammortamenti",
  FIXED_COST_ADMIN_COMPENSATION: "Compensi amm.",
  FIXED_COST_RENT: "Affitti",
  FIXED_COST_UTILITIES: "Utenze",
  FIXED_COST_INSURANCE: "Assicurazioni",
  FIXED_COST_CONSULTING: "Consulenze",
  FIXED_COST_MARKETING: "Marketing",
  FIXED_COST_GENERAL: "Costi generali",
  FINANCIAL_INCOME: "Prov. finanziari",
  FINANCIAL_EXPENSE: "Oneri finanziari",
  EXTRAORDINARY_INCOME: "Prov. straord.",
  EXTRAORDINARY_EXPENSE: "Oneri straord.",
  TAX_INCOME: "Imposte",
};

export default function FirmMovimentiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBank, setUploadBank] = useState<string>("");
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/firm/clients/${id}/movimenti?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMovements(data.data ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {
      toast.error("Errore caricamento movimenti");
    } finally {
      setLoading(false);
    }
  }, [id, page, search]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  // Load bank options when upload dialog opens
  useEffect(() => {
    if (uploadOpen && bankOptions.length === 0) {
      fetch("/api/firm/templates/pdf-banks")
        .then((r) => r.json())
        .then((data) => {
          const opts = (data.profiles ?? []).map(
            (p: { bankName: string; isSystemDefault: boolean }) => ({
              bankName: p.bankName,
              isSystemDefault: p.isSystemDefault,
            }),
          );
          setBankOptions(opts);
        })
        .catch(() => {});
    }
  }, [uploadOpen, bankOptions.length]);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);

    const isPdf = uploadFile.name.toLowerCase().endsWith(".pdf");

    // For PDF: require bank selection
    if (isPdf && !uploadBank) {
      toast.error("Seleziona una banca per il file PDF");
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      // PDF V1 parser returns Uscite/Entrate columns; CSV uses single Importo column
      const mapping = isPdf
        ? { date: "Data", description: "Descrizione", uscite: "Uscite", entrate: "Entrate" }
        : { date: "Data", description: "Descrizione", amount: "Importo" };
      formData.append("config", JSON.stringify({ mapping }));

      if (isPdf && uploadBank) {
        formData.append("bankName", uploadBank);
      }

      const res = await fetch(`/api/firm/clients/${id}/movimenti/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error ?? "Errore nell'upload");
        return;
      }

      if (result.imported > 0) {
        toast.success(`${result.imported} movimenti importati (${result.duplicates} duplicati)`);
      } else if (result.duplicates > 0) {
        toast.info(`Tutti i ${result.duplicates} movimenti erano già presenti`);
      } else {
        toast.warning(
          "Nessuna riga riconosciuta dal parser. Verifica che il file sia un estratto conto valido.",
        );
      }

      if (result.warnings?.length > 0) {
        for (const w of result.warnings.slice(0, 3)) {
          toast.info(w);
        }
      }

      setUploadOpen(false);
      setUploadFile(null);
      setUploadBank("");
      loadMovements();
    } catch {
      toast.error("Errore di rete");
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  };

  const isPdf = uploadFile?.name.toLowerCase().endsWith(".pdf") ?? false;

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
            <h1 className="text-2xl font-bold">Movimenti Bancari</h1>
            <p className="text-muted-foreground text-sm">{total} movimenti totali</p>
          </div>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-1.5 h-4 w-4" />
          Carica estratto conto
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Cerca per descrizione..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {loading && <p className="text-muted-foreground">Caricamento...</p>}

      {!loading && movements.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nessun movimento trovato. Carica un estratto conto per iniziare.
          </p>
        </div>
      )}

      {movements.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-2.5 text-left font-medium">Data</th>
                  <th className="px-4 py-2.5 text-left font-medium">Descrizione</th>
                  <th className="px-4 py-2.5 text-center font-medium">Categoria CDG</th>
                  <th className="px-4 py-2.5 text-right font-medium">Importo</th>
                  <th className="px-4 py-2.5 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  >
                    <td className="font-numeric px-4 py-2 text-xs whitespace-nowrap">
                      {formatDate(m.date)}
                    </td>
                    <td className="max-w-[350px] truncate px-4 py-2">{m.description}</td>
                    <td className="px-4 py-2 text-center">
                      {m.cdgCategory ? (
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                          {CDG_LABELS[m.cdgCategory] ?? m.cdgCategory}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td
                      className={cn(
                        "font-numeric px-4 py-2 text-right font-medium whitespace-nowrap",
                        m.amount >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {formatEUR(m.amount)}
                    </td>
                    <td className="font-numeric text-muted-foreground px-4 py-2 text-right whitespace-nowrap">
                      {formatEUR(m.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Pagina {page} di {totalPages} ({total} risultati)
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Carica estratto conto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="upload-file">File (CSV o PDF)</Label>
              <Input
                id="upload-file"
                type="file"
                accept=".csv,.pdf,.xlsx"
                onChange={(e) => {
                  setUploadFile(e.target.files?.[0] ?? null);
                  setUploadBank("");
                }}
              />
            </div>

            {isPdf && (
              <div>
                <Label htmlFor="bank-select">Banca</Label>
                <Select value={uploadBank} onValueChange={(v) => v && setUploadBank(v)}>
                  <SelectTrigger id="bank-select">
                    <SelectValue placeholder="Seleziona la banca..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankOptions.map((b) => (
                      <SelectItem key={b.bankName} value={b.bankName}>
                        {b.bankName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground mt-1 text-xs">
                  Il profilo della banca determina come il PDF viene interpretato.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadFile || (isPdf && !uploadBank)}
            >
              {uploading ? "Importazione..." : "Importa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
