"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Building2, FileSpreadsheet, BarChart3 } from "lucide-react";

interface BankAccount {
  id: string;
  bankName: string | null;
  iban: string | null;
}

interface OrganizationDetail {
  id: string;
  name: string;
  vatNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  zipCode: string | null;
  cdgGranularity: string | null;
  cashThresholdEur: string | null;
  bankAccounts: BankAccount[];
}

export default function AnagraficaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/firm/clients/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Non trovato");
        return r.json();
      })
      .then((data) => {
        setOrg(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const fd = new FormData(e.currentTarget);
    const rawThreshold = (fd.get("cashThresholdEur") as string)?.trim();
    const body = {
      name: fd.get("name") as string,
      vatNumber: (fd.get("vatNumber") as string) || null,
      email: (fd.get("email") as string) || null,
      phone: (fd.get("phone") as string) || null,
      address: (fd.get("address") as string) || null,
      city: (fd.get("city") as string) || null,
      province: (fd.get("province") as string) || null,
      zipCode: (fd.get("zipCode") as string) || null,
      cdgGranularity: fd.get("cdgGranularity") as string,
      cashThresholdEur: rawThreshold ? parseFloat(rawThreshold.replace(",", ".")) : null,
    };

    try {
      const res = await fetch(`/api/firm/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Errore durante il salvataggio" });
      } else {
        setMessage({ type: "success", text: "Dati aggiornati con successo" });
        // Update local state with the saved values
        setOrg((prev) =>
          prev
            ? {
                ...prev,
                ...body,
                cashThresholdEur:
                  body.cashThresholdEur != null ? String(body.cashThresholdEur) : null,
              }
            : prev,
        );
      }
    } catch {
      setMessage({ type: "error", text: "Errore di rete" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-muted-foreground">Organizzazione non trovata.</p>
        <Link href="/firm/clients" className={buttonVariants({ variant: "outline" })}>
          Torna alla lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/firm/clients" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <p className="text-muted-foreground text-sm">Anagrafica</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/firm/clients/${id}/cdg`} className={buttonVariants({ variant: "outline" })}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Controllo di Gestione
          </Link>
          <Link
            href={`/firm/clients/${id}/bilanci`}
            className={buttonVariants({ variant: "outline" })}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Bilanci di verifica
          </Link>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">
              Nome organizzazione <span className="text-red-500">*</span>
            </Label>
            <Input id="name" name="name" required defaultValue={org.name} />
          </div>
          <div>
            <Label htmlFor="vatNumber">Partita IVA</Label>
            <Input id="vatNumber" name="vatNumber" defaultValue={org.vatNumber ?? ""} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={org.email ?? ""} />
          </div>
          <div>
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={org.phone ?? ""} />
          </div>
          <div>
            <Label htmlFor="cdgGranularity">Granularità CdG</Label>
            <Select name="cdgGranularity" defaultValue={org.cdgGranularity ?? "MONTHLY"}>
              <SelectTrigger id="cdgGranularity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Mensile</SelectItem>
                <SelectItem value="QUARTERLY">Trimestrale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cashThresholdEur">Soglia attenzione cassa (€)</Label>
            <Input
              id="cashThresholdEur"
              name="cashThresholdEur"
              type="number"
              step="0.01"
              min="0"
              placeholder="5000 (default)"
              defaultValue={org.cashThresholdEur ?? ""}
              className="font-numeric"
            />
            <p className="mt-1 text-xs text-slate-500">
              Vuoto = default 5000€. Zero = soglia disabilitata.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="address">Indirizzo</Label>
            <Input id="address" name="address" defaultValue={org.address ?? ""} />
          </div>
          <div>
            <Label htmlFor="city">Città</Label>
            <Input id="city" name="city" defaultValue={org.city ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province">Prov.</Label>
              <Input
                id="province"
                name="province"
                maxLength={2}
                defaultValue={org.province ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="zipCode">CAP</Label>
              <Input id="zipCode" name="zipCode" maxLength={5} defaultValue={org.zipCode ?? ""} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvataggio..." : "Salva modifiche"}
          </Button>
        </div>
      </form>

      {/* Bank Accounts (read-only for now) */}
      {org.bankAccounts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Conti bancari</h2>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-2 text-left font-medium">Banca</th>
                  <th className="px-4 py-2 text-left font-medium">IBAN</th>
                </tr>
              </thead>
              <tbody>
                {org.bankAccounts.map((ba) => (
                  <tr key={ba.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="text-muted-foreground h-4 w-4" />
                        {ba.bankName || "—"}
                      </div>
                    </td>
                    <td className="font-numeric text-muted-foreground px-4 py-2">
                      {ba.iban || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
