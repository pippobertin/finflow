"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Palette, Upload, X, Check } from "lucide-react";

interface BrandingData {
  logoDataUrl?: string;
  brandColor?: string;
  accentColor?: string;
  displayName?: string;
}

async function fetchBranding(): Promise<{ branding: BrandingData; firmName: string }> {
  const res = await fetch("/api/firm/branding");
  if (!res.ok) throw new Error("Errore nel caricamento del branding");
  return res.json();
}

export default function BrandingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["firm-branding"],
    queryFn: fetchBranding,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  return <BrandingForm initialBranding={data?.branding ?? {}} firmName={data?.firmName ?? ""} />;
}

function BrandingForm({
  initialBranding,
  firmName,
}: {
  initialBranding: BrandingData;
  firmName: string;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<BrandingData>(initialBranding);
  const [previewLogo, setPreviewLogo] = useState<string | null>(
    initialBranding.logoDataUrl || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: async (branding: BrandingData) => {
      const res = await fetch("/api/firm/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Errore nel salvataggio");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["firm-branding"] });
      toast.success("Branding salvato con successo");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Il file deve essere un&apos;immagine (PNG, SVG, JPG)");
      return;
    }

    if (file.size > 500_000) {
      toast.error("Il logo non deve superare i 500KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewLogo(dataUrl);
      setForm((f) => ({ ...f, logoDataUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setPreviewLogo(null);
    setForm((f) => ({ ...f, logoDataUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(form);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Branding dello studio</h1>
        <p className="text-muted-foreground text-sm">
          Personalizza il workspace dei tuoi clienti con il tuo logo e i tuoi colori
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        {/* Logo */}
        <section className="rounded-xl border p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Upload className="h-4 w-4" />
            Logo dello studio
          </h2>
          <div className="flex items-center gap-6">
            {previewLogo ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewLogo}
                  alt="Logo preview"
                  className="h-20 w-20 rounded-xl border object-contain p-1"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-0.5 text-white shadow-sm hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400">
                <Palette className="h-8 w-8" />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                {previewLogo ? "Cambia logo" : "Carica logo"}
              </label>
              <p className="mt-1 text-xs text-slate-500">PNG, SVG o JPG. Max 500KB.</p>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="rounded-xl border p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-4 w-4" />
            Colori
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Colore primario (--brand)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.brandColor || "#0b4d8a"}
                  onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                  className="h-10 w-10 cursor-pointer rounded-lg border"
                />
                <input
                  type="text"
                  value={form.brandColor || "#0b4d8a"}
                  onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                  placeholder="#0b4d8a"
                  className="font-numeric w-28 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Sidebar, bottoni, link attivi</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Colore accento (--accent)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.accentColor || "#0e7c66"}
                  onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                  className="h-10 w-10 cursor-pointer rounded-lg border"
                />
                <input
                  type="text"
                  value={form.accentColor || "#0e7c66"}
                  onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                  placeholder="#0e7c66"
                  className="font-numeric w-28 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Gradiente logo, dettagli secondari</p>
            </div>
          </div>
        </section>

        {/* Display name */}
        <section className="rounded-xl border p-6">
          <h2 className="mb-4 text-sm font-semibold">Nome visibile</h2>
          <input
            type="text"
            value={form.displayName ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder={firmName || "Nome studio"}
            maxLength={60}
            className="w-full max-w-md rounded-lg border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Mostrato nella sidebar del workspace cliente. Max 60 caratteri.
            {form.displayName ? ` (${form.displayName.length}/60)` : ""}
          </p>
        </section>

        {/* Preview */}
        <section className="rounded-xl border p-6">
          <h2 className="mb-4 text-sm font-semibold">Anteprima</h2>
          <div
            className="flex items-center gap-3 rounded-xl border bg-slate-50 p-4"
            style={{ borderColor: `${form.brandColor || "#0b4d8a"}30` }}
          >
            {previewLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewLogo} alt="Logo" className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${form.brandColor || "#0b4d8a"}, ${form.accentColor || "#0e7c66"})`,
                }}
              >
                {(form.displayName || firmName || "F")[0]}
              </div>
            )}
            <span
              className="text-lg font-bold"
              style={{
                background: `linear-gradient(135deg, ${form.brandColor || "#0b4d8a"}, ${form.accentColor || "#0e7c66"})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {form.displayName || firmName || "FinFlow"}
            </span>
          </div>
        </section>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={save.isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {save.isPending ? "Salvataggio..." : "Salva branding"}
          </button>
          {save.isSuccess && <span className="text-sm text-emerald-600">Salvato!</span>}
        </div>
      </form>
    </div>
  );
}
