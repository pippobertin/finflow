"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Lock, Trash2, ArrowLeft } from "lucide-react";

interface Snapshot {
  id: string;
  periodStart: string;
  periodEnd: string;
  sourceFilename: string;
  isLocked: boolean;
  uploadedAt: string;
  notes: string | null;
  uploadedBy: { name: string | null; email: string };
  _count: { lines: number };
}

export default function FirmBilanciPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/firm/clients/${id}/bilanci`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSnapshots(data);
        setLoading(false);
      });
  }, [id]);

  async function handleDelete(snapshotId: string) {
    if (!confirm("Eliminare questo bilancio di verifica?")) return;
    const res = await fetch(`/api/firm/clients/${id}/bilanci/${snapshotId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
    } else {
      const data = await res.json();
      alert(data.error || "Errore durante l'eliminazione");
    }
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "short",
    });

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/firm/clients/${id}/anagrafica`}
            className="text-muted-foreground mb-1 inline-flex items-center gap-1 text-sm hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Anagrafica
          </Link>
          <h1 className="text-2xl font-bold">Bilanci di Verifica</h1>
          <p className="text-muted-foreground text-sm">
            Carica e gestisci i bilanci di verifica per il controllo di gestione
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/firm/clients/${id}/mapping`}
            className={buttonVariants({ variant: "outline" })}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Mapping conti
          </Link>
          <Link href={`/firm/clients/${id}/bilanci/upload`} className={buttonVariants()}>
            <Upload className="mr-2 h-4 w-4" />
            Carica bilancio
          </Link>
        </div>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-2 text-left font-medium">Periodo</th>
              <th className="px-4 py-2 text-left font-medium">File</th>
              <th className="px-4 py-2 text-right font-medium">Righe</th>
              <th className="px-4 py-2 text-left font-medium">Caricato da</th>
              <th className="px-4 py-2 text-left font-medium">Data upload</th>
              <th className="px-4 py-2 text-center font-medium">Stato</th>
              <th className="px-4 py-2 text-right font-medium">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                  Caricamento...
                </td>
              </tr>
            ) : snapshots.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                  Nessun bilancio caricato
                </td>
              </tr>
            ) : (
              snapshots.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 border-b last:border-0">
                  <td className="font-numeric px-4 py-2">
                    {fmt(s.periodStart)} — {fmt(s.periodEnd)}
                  </td>
                  <td className="px-4 py-2 text-indigo-600">
                    <Link href={`/firm/clients/${id}/bilanci/${s.id}`} className="hover:underline">
                      {s.sourceFilename}
                    </Link>
                  </td>
                  <td className="font-numeric px-4 py-2 text-right">{s._count.lines}</td>
                  <td className="text-muted-foreground px-4 py-2">
                    {s.uploadedBy.name || s.uploadedBy.email}
                  </td>
                  <td className="text-muted-foreground font-numeric px-4 py-2">
                    {new Date(s.uploadedAt).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {s.isLocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                        <Lock className="h-3 w-3" />
                        Confermato
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        Bozza
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {!s.isLocked && (
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-muted-foreground hover:text-red-600"
                        title="Elimina"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
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
