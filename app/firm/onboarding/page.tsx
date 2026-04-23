"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Map,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
  { number: 1, title: "Benvenuto" },
  { number: 2, title: "Studio" },
  { number: 3, title: "Primo cliente" },
  { number: 4, title: "Pronti" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 2 — Studio
  const [displayName, setDisplayName] = useState("");
  const [brandColor, setBrandColor] = useState("#4F46E5");
  const [accentColor, setAccentColor] = useState("#059669");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [studioEmail, setStudioEmail] = useState("");
  const [studioPhone, setStudioPhone] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);

  // Step 3 — Primo cliente
  const [orgName, setOrgName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [granularity, setGranularity] = useState("MONTHLY");
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);

  // Logo upload handler
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      toast.error("Logo troppo grande (max 500KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Step 2 save
  const saveStudio = async () => {
    if (!displayName.trim()) {
      toast.error("Inserisci il nome dello studio");
      return false;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/firm/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "branding",
          data: {
            displayName: displayName.trim(),
            brandColor,
            accentColor,
            logoDataUrl: logoDataUrl || undefined,
            email: studioEmail || undefined,
            phone: studioPhone || undefined,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Errore nel salvataggio");
        return false;
      }
      return true;
    } catch {
      toast.error("Errore di rete");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Step 3 save
  const saveClient = async () => {
    if (!orgName.trim()) {
      toast.error("Inserisci il nome dell'organizzazione");
      return false;
    }
    if (vatNumber && !/^IT\d{11}$/.test(vatNumber) && !/^\d{11}$/.test(vatNumber)) {
      toast.error("Partita IVA non valida (11 cifre, con o senza prefisso IT)");
      return false;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/firm/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName.trim(),
          vatNumber: vatNumber || undefined,
          email: orgEmail || undefined,
          address: address || undefined,
          city: city || undefined,
          province: province || undefined,
          zipCode: zipCode || undefined,
          cdgGranularity: granularity,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Errore nella creazione del cliente");
        return false;
      }
      const data = await res.json();
      setCreatedClientId(data.id);
      return true;
    } catch {
      toast.error("Errore di rete");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Step 4 complete
  const completeOnboarding = async () => {
    setSaving(true);
    try {
      await fetch("/api/firm/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "complete" }),
      });
      router.push("/firm/dashboard");
    } catch {
      toast.error("Errore di rete");
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step === 2) {
      const ok = await saveStudio();
      if (!ok) return;
    }
    if (step === 3) {
      const ok = await saveClient();
      if (!ok) return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Stepper */}
      <div className="mx-auto mt-8 w-full max-w-xl px-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    step > s.number
                      ? "bg-emerald-500 text-white"
                      : step === s.number
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900"
                        : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                  )}
                >
                  {step > s.number ? <Check className="h-4 w-4" /> : s.number}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-xs font-medium",
                    step >= s.number
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-400 dark:text-slate-500",
                  )}
                >
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-0.5 w-12 sm:w-20",
                    step > s.number ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto mt-8 w-full max-w-xl flex-1 px-6 pb-12">
        <div className="rounded-xl border bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Step 1: Benvenuto */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #22D3EE)" }}
              >
                F
              </div>
              <h1 className="text-3xl font-bold">Benvenuto in Finflow</h1>
              <p className="mx-auto max-w-md text-slate-600 dark:text-slate-400">
                Finflow è il tuo strumento di controllo di gestione per i clienti del tuo studio. In
                pochi minuti configuriamo il tuo studio, carichiamo il primo cliente, e siamo
                operativi. Pronto?
              </p>
              <div className="flex flex-col items-center gap-3">
                <Button size="lg" onClick={() => setStep(2)}>
                  Iniziamo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link
                  href="/firm/aiuto/cose-finflow"
                  target="_blank"
                  className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Scopri di più
                </Link>
              </div>
            </div>
          )}

          {/* Step 2: Configura studio */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Parliamo del tuo studio</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Queste informazioni appariranno ai tuoi clienti quando accederanno alla loro
                  dashboard. Puoi cambiarle in ogni momento dalla sezione Branding.
                </p>
              </div>

              <div>
                <Label htmlFor="display-name">Nome studio visibile *</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Es. Studio Mezzelani"
                  maxLength={60}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand-color">Colore primario</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      id="brand-color"
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border"
                    />
                    <span className="font-mono text-sm text-slate-500">{brandColor}</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="accent-color">Colore accento</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      id="accent-color"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border"
                    />
                    <span className="font-mono text-sm text-slate-500">{accentColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Logo (opzionale)</Label>
                {logoDataUrl ? (
                  <div className="mt-1 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoDataUrl}
                      alt="Logo preview"
                      className="h-12 w-12 rounded-lg border object-contain"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLogoDataUrl(null);
                        if (logoRef.current) logoRef.current.value = "";
                      }}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Rimuovi
                    </Button>
                  </div>
                ) : (
                  <div
                    className="mt-1 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-4 hover:border-indigo-400 hover:bg-indigo-50/50"
                    onClick={() => logoRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-500">Carica PNG o SVG (max 500KB)</span>
                  </div>
                )}
                <input
                  ref={logoRef}
                  type="file"
                  accept=".png,.svg,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studio-email">Email studio</Label>
                  <Input
                    id="studio-email"
                    type="email"
                    value={studioEmail}
                    onChange={(e) => setStudioEmail(e.target.value)}
                    placeholder="studio@esempio.it"
                  />
                </div>
                <div>
                  <Label htmlFor="studio-phone">Telefono (opzionale)</Label>
                  <Input
                    id="studio-phone"
                    type="tel"
                    value={studioPhone}
                    onChange={(e) => setStudioPhone(e.target.value)}
                    placeholder="+39 02 1234567"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Primo cliente */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">Aggiungi il tuo primo cliente</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Creiamo insieme l&apos;anagrafica del primo cliente che vuoi gestire su Finflow.
                  Potrai aggiungerne altri in ogni momento.
                </p>
              </div>

              <div>
                <Label htmlFor="org-name">Nome organizzazione *</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Es. BLM Group S.p.A."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vat-number">Partita IVA</Label>
                  <Input
                    id="vat-number"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="IT01234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="org-email">Email contatto</Label>
                  <Input
                    id="org-email"
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    placeholder="info@azienda.it"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="address">Indirizzo</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Via Roma 1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Città</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="province">Prov.</Label>
                    <Input
                      id="province"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">CAP</Label>
                    <Input
                      id="zip"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Granularità CDG</Label>
                <Select value={granularity} onValueChange={(v) => v && setGranularity(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensile</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestrale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 4: Prossimi passi */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="mt-3 text-xl font-bold">Setup completato</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Il tuo studio e il tuo primo cliente sono pronti. Ecco le tre cose che ti
                  consiglio di fare adesso.
                </p>
              </div>

              <div className="space-y-3">
                {createdClientId && (
                  <>
                    <ActionCard
                      icon={FileSpreadsheet}
                      title="Carica il primo bilancio di verifica"
                      description="Importa il bilancio di verifica esportato da ProOffice in formato Excel."
                      href={`/firm/clients/${createdClientId}/bilanci/upload`}
                    />
                    <ActionCard
                      icon={Map}
                      title="Mappa il piano dei conti"
                      description="Associa ogni conto contabile a una delle 17 categorie CDG per il conto economico riclassificato."
                      href={`/firm/clients/${createdClientId}/mapping`}
                    />
                    <ActionCard
                      icon={UserPlus}
                      title="Invita l'imprenditore"
                      description="Crea un utente per il tuo cliente: avrà accesso alla sua dashboard con numeri e indicatori."
                      href={`/firm/clients/${createdClientId}/utenti`}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 && step < 4 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={saving}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Indietro
              </Button>
            ) : (
              <div />
            )}

            {step === 4 ? (
              <div className="flex flex-col items-end gap-2">
                <Button onClick={completeOnboarding} disabled={saving}>
                  {saving ? "Un momento..." : "Vai alla dashboard"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link href="/firm/aiuto" className="text-xs text-slate-400 hover:underline">
                  Apri il manuale completo
                </Link>
              </div>
            ) : step > 1 ? (
              <Button onClick={handleNext} disabled={saving}>
                {saving ? "Salvataggio..." : step === 3 ? "Crea cliente e continua" : "Avanti"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Action card for step 4 ───────────────────────────────────

function ActionCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
        <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </Link>
  );
}
