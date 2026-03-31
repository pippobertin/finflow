"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  orgData: Record<string, unknown>;
}

export function StepBankAccount({ onNext, onBack, orgData }: StepProps) {
  const ba = (orgData.bankAccount as Record<string, unknown>) ?? {};
  const [bankName, setBankName] = useState((ba.bankName as string) ?? "");
  const [iban, setIban] = useState((ba.iban as string) ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bankName.trim()) {
      toast.error("Il nome della banca è obbligatorio");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "bank-account", data: { bankName, iban } }),
      });
      if (!res.ok) throw new Error("Errore nel salvataggio");
      onNext();
    } catch {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <Landmark className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Conto Bancario</h2>
          <p className="text-sm text-slate-500">Il conto principale dell&apos;azienda</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bankName">Nome banca *</Label>
          <Input
            id="bankName"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="es. Intesa Sanpaolo"
            required
          />
        </div>
        <div>
          <Label htmlFor="iban">IBAN</Label>
          <Input
            id="iban"
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            placeholder="IT60X0542811101000000123456"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Indietro
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvataggio..." : "Avanti"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
