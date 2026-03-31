"use client";

import { useState } from "react";
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
import { Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface StepProps {
  onNext: () => void;
  orgData: Record<string, unknown>;
  setOrgData: (d: Record<string, unknown>) => void;
}

export function StepOrganization({ onNext, orgData }: StepProps) {
  const org = (orgData.organization as Record<string, unknown>) ?? {};
  const settings = (org.settings as Record<string, unknown>) ?? {};

  const [name, setName] = useState((org.name as string) ?? "");
  const [vatNumber, setVatNumber] = useState((org.vatNumber as string) ?? "");
  const [email, setEmail] = useState((org.email as string) ?? "");
  const [phone, setPhone] = useState((org.phone as string) ?? "");
  const [vatPeriodicity, setVatPeriodicity] = useState(
    (settings.vatPeriodicity as string) ?? "quarterly",
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Il nome dell'organizzazione è obbligatorio");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "organization",
          data: { name, vatNumber, email, phone, vatPeriodicity },
        }),
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
          <Building2 className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Organizzazione</h2>
          <p className="text-sm text-slate-500">Inserisci i dati della tua azienda</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Nome azienda *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="vatNumber">Partita IVA</Label>
          <Input
            id="vatNumber"
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value)}
            placeholder="IT12345678901"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Telefono</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="vatPeriodicity">Regime IVA</Label>
          <Select value={vatPeriodicity} onValueChange={(v) => v && setVatPeriodicity(v)}>
            <SelectTrigger id="vatPeriodicity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensile</SelectItem>
              <SelectItem value="quarterly">Trimestrale</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Salvataggio..." : "Avanti"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
