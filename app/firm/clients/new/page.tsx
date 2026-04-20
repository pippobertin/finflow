"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      vatNumber: (fd.get("vatNumber") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      address: (fd.get("address") as string) || undefined,
      city: (fd.get("city") as string) || undefined,
      province: (fd.get("province") as string) || undefined,
      zipCode: (fd.get("zipCode") as string) || undefined,
      cdgGranularity: fd.get("cdgGranularity") as string,
    };

    try {
      const res = await fetch("/api/firm/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Errore durante il salvataggio");
        setSaving(false);
        return;
      }

      const org = await res.json();
      router.push(`/firm/clients/${org.id}/anagrafica`);
    } catch {
      setError("Errore di rete");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/firm/clients" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nuovo cliente</h1>
          <p className="text-muted-foreground text-sm">Crea una nuova organizzazione</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">
              Nome organizzazione <span className="text-red-500">*</span>
            </Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="vatNumber">Partita IVA</Label>
            <Input id="vatNumber" name="vatNumber" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div>
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>
          <div>
            <Label htmlFor="cdgGranularity">Granularità CdG</Label>
            <Select name="cdgGranularity" defaultValue="MONTHLY">
              <SelectTrigger id="cdgGranularity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Mensile</SelectItem>
                <SelectItem value="QUARTERLY">Trimestrale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="address">Indirizzo</Label>
            <Input id="address" name="address" />
          </div>
          <div>
            <Label htmlFor="city">Città</Label>
            <Input id="city" name="city" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province">Prov.</Label>
              <Input id="province" name="province" maxLength={2} />
            </div>
            <div>
              <Label htmlFor="zipCode">CAP</Label>
              <Input id="zipCode" name="zipCode" maxLength={5} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Salvataggio..." : "Crea cliente"}
          </Button>
          <Link href="/firm/clients" className={buttonVariants({ variant: "outline" })}>
            Annulla
          </Link>
        </div>
      </form>
    </div>
  );
}
