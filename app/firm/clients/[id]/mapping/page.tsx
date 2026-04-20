"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Check } from "lucide-react";

const CDG_CATEGORIES = [
  { value: "REVENUE", label: "Ricavi" },
  { value: "VAR_COST_MATERIALS", label: "Costi var. — Materiali" },
  { value: "VAR_COST_SERVICES", label: "Costi var. — Servizi" },
  { value: "VAR_COST_DIRECT_LABOR", label: "Costi var. — Lavoro diretto" },
  { value: "FIXED_COST_DEPRECIATION", label: "Costi fissi — Ammortamenti" },
  { value: "FIXED_COST_ADMIN_COMPENSATION", label: "Costi fissi — Compensi amm." },
  { value: "FIXED_COST_RENT", label: "Costi fissi — Affitti" },
  { value: "FIXED_COST_UTILITIES", label: "Costi fissi — Utenze" },
  { value: "FIXED_COST_INSURANCE", label: "Costi fissi — Assicurazioni" },
  { value: "FIXED_COST_CONSULTING", label: "Costi fissi — Consulenze" },
  { value: "FIXED_COST_MARKETING", label: "Costi fissi — Marketing" },
  { value: "FIXED_COST_GENERAL", label: "Costi fissi — Generali" },
  { value: "FINANCIAL_INCOME", label: "Proventi finanziari" },
  { value: "FINANCIAL_EXPENSE", label: "Oneri finanziari" },
  { value: "EXTRAORDINARY_INCOME", label: "Proventi straordinari" },
  { value: "EXTRAORDINARY_EXPENSE", label: "Oneri straordinari" },
  { value: "TAX_INCOME", label: "Imposte" },
] as const;

interface MappingRow {
  accountCode: string;
  accountName: string;
  cdgCategory: string;
  isVatable: boolean;
  vatRate: number | null;
  dirty: boolean;
}

interface SnapshotLine {
  accountCode: string;
  accountName: string;
  cdgCategory: string | null;
}

interface SavedMapping {
  accountCode: string;
  accountName: string;
  cdgCategory: string;
  isVatable: boolean;
  vatRate: string | null;
}

export default function FirmMappingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [rows, setRows] = useState<MappingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/firm/clients/${id}/mapping`).then((r) => r.json()),
      fetch(`/api/firm/clients/${id}/bilanci`).then((r) => r.json()),
    ]).then(([savedMappings, snapshots]) => {
      const mappingMap = new Map<string, SavedMapping>();
      if (Array.isArray(savedMappings)) {
        for (const m of savedMappings as SavedMapping[]) {
          mappingMap.set(m.accountCode, m);
        }
      }

      // Collect unique accounts from all snapshots
      const accountMap = new Map<string, string>();
      if (Array.isArray(snapshots)) {
        for (const snap of snapshots) {
          // Fetch snapshot detail for lines
          fetch(`/api/firm/clients/${id}/bilanci/${snap.id}`)
            .then((r) => r.json())
            .then((detail) => {
              if (detail.lines) {
                for (const line of detail.lines as SnapshotLine[]) {
                  if (!accountMap.has(line.accountCode)) {
                    accountMap.set(line.accountCode, line.accountName);
                  }
                }
                // Merge with saved mappings
                const merged: MappingRow[] = [];
                for (const [code, name] of accountMap) {
                  const saved = mappingMap.get(code);
                  merged.push({
                    accountCode: code,
                    accountName: saved?.accountName || name,
                    cdgCategory: saved?.cdgCategory || "",
                    isVatable: saved?.isVatable || false,
                    vatRate: saved?.vatRate ? Number(saved.vatRate) : null,
                    dirty: false,
                  });
                }
                merged.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
                setRows(merged);
                setLoading(false);
              }
            });
        }
        if (snapshots.length === 0) {
          // No snapshots, show saved mappings only
          const merged: MappingRow[] = Array.from(mappingMap.values()).map((m) => ({
            accountCode: m.accountCode,
            accountName: m.accountName,
            cdgCategory: m.cdgCategory,
            isVatable: m.isVatable,
            vatRate: m.vatRate ? Number(m.vatRate) : null,
            dirty: false,
          }));
          merged.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
          setRows(merged);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
  }, [id]);

  function updateRow(idx: number, field: keyof MappingRow, value: unknown) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value, dirty: true };
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    const dirtyRows = rows.filter((r) => r.dirty && r.cdgCategory);
    if (dirtyRows.length === 0) return;

    setSaving(true);
    const res = await fetch(`/api/firm/clients/${id}/mapping`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mappings: dirtyRows.map((r) => ({
          accountCode: r.accountCode,
          accountName: r.accountName,
          cdgCategory: r.cdgCategory,
          isVatable: r.isVatable,
          vatRate: r.vatRate,
        })),
      }),
    });

    if (res.ok) {
      setRows((prev) => prev.map((r) => ({ ...r, dirty: false })));
      setSaved(true);
    }
    setSaving(false);
  }

  const dirtyCount = rows.filter((r) => r.dirty && r.cdgCategory).length;
  const unmappedCount = rows.filter((r) => !r.cdgCategory).length;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/firm/clients/${id}/bilanci`}
            className="text-muted-foreground mb-1 inline-flex items-center gap-1 text-sm hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Bilanci di verifica
          </Link>
          <h1 className="text-2xl font-bold">Mapping Piano dei Conti</h1>
          <p className="text-muted-foreground text-sm">
            Associa ogni conto contabile a una categoria CdG
            {unmappedCount > 0 && (
              <span className="ml-2 text-amber-600">({unmappedCount} conti da mappare)</span>
            )}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || dirtyCount === 0}>
          {saving ? (
            "Salvataggio..."
          ) : saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Salvato
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salva {dirtyCount > 0 ? `(${dirtyCount})` : ""}
            </>
          )}
        </Button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-2 text-left font-medium">Conto</th>
              <th className="px-4 py-2 text-left font-medium">Descrizione</th>
              <th className="px-4 py-2 text-left font-medium">Categoria CdG</th>
              <th className="px-4 py-2 text-center font-medium">IVA</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                  Caricamento...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                  Nessun conto trovato. Carica prima un bilancio di verifica.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.accountCode}
                  className={`border-b last:border-0 ${
                    !row.cdgCategory ? "bg-amber-50/50" : row.dirty ? "bg-blue-50/50" : ""
                  }`}
                >
                  <td className="font-numeric px-4 py-1.5">{row.accountCode}</td>
                  <td className="px-4 py-1.5">{row.accountName}</td>
                  <td className="px-4 py-1.5">
                    <select
                      value={row.cdgCategory}
                      onChange={(e) => updateRow(idx, "cdgCategory", e.target.value)}
                      className={`w-full rounded border px-2 py-1 text-sm ${
                        !row.cdgCategory ? "border-amber-300" : "border-gray-200"
                      }`}
                    >
                      <option value="">— Seleziona —</option>
                      {CDG_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={row.isVatable}
                      onChange={(e) => updateRow(idx, "isVatable", e.target.checked)}
                      className="rounded"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
