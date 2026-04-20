"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  vatNumber: string | null;
  email: string | null;
  city: string | null;
  _count: { invoices: number; bankStatements: number; bankAccounts: number };
}

export default function FirmClientsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/firm/clients")
      .then((r) => r.json())
      .then((data) => {
        setOrganizations(data);
        setLoading(false);
      });
  }, []);

  const filtered = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.vatNumber && o.vatNumber.includes(search)),
  );

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clienti</h1>
          <p className="text-muted-foreground text-sm">
            Elenco completo delle organizzazioni gestite dallo studio
          </p>
        </div>
        <Link href="/firm/clients/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo cliente
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Cerca per nome o P.IVA..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-2 text-left font-medium">Nome</th>
              <th className="px-4 py-2 text-left font-medium">P.IVA</th>
              <th className="px-4 py-2 text-left font-medium">Sede</th>
              <th className="px-4 py-2 text-right font-medium">Fatture</th>
              <th className="px-4 py-2 text-right font-medium">Conti</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                  Caricamento...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                  {search ? "Nessun risultato" : "Nessun cliente"}
                </td>
              </tr>
            ) : (
              filtered.map((org) => (
                <tr key={org.id} className="hover:bg-muted/30 border-b last:border-0">
                  <td className="px-4 py-2">
                    <Link
                      href={`/firm/clients/${org.id}/anagrafica`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {org.name}
                    </Link>
                  </td>
                  <td className="font-numeric text-muted-foreground px-4 py-2">
                    {org.vatNumber || "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-2">{org.city || "—"}</td>
                  <td className="font-numeric px-4 py-2 text-right">{org._count.invoices}</td>
                  <td className="font-numeric px-4 py-2 text-right">{org._count.bankAccounts}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
