import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listFirmOrganizations, getFirmStats } from "@/lib/queries/firm";
import { Building2, FileText, Users } from "lucide-react";

export default async function FirmDashboardPage() {
  const session = await auth();
  if (!session?.user?.accountingFirmId) redirect("/login");

  const accountingFirmId = session.user.accountingFirmId;
  const [organizations, stats] = await Promise.all([
    listFirmOrganizations(accountingFirmId),
    getFirmStats(accountingFirmId),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Studio</h1>
        <p className="text-muted-foreground text-sm">Panoramica del portafoglio clienti</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Clienti</p>
              <p className="font-numeric text-2xl font-bold">{stats.orgCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Fatture totali</p>
              <p className="font-numeric text-2xl font-bold">{stats.invoiceCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Azioni rapide</p>
              <Link
                href="/firm/clients/new"
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                + Nuovo cliente
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Client list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Clienti</h2>
          <Link href="/firm/clients" className="text-sm text-indigo-600 hover:underline">
            Vedi tutti
          </Link>
        </div>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-2 text-left font-medium">Nome</th>
                <th className="px-4 py-2 text-left font-medium">P.IVA</th>
                <th className="px-4 py-2 text-right font-medium">Fatture</th>
                <th className="px-4 py-2 text-right font-medium">Movimenti</th>
              </tr>
            </thead>
            <tbody>
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                    Nessun cliente.{" "}
                    <Link href="/firm/clients/new" className="text-indigo-600 hover:underline">
                      Crea il primo
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
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
                    <td className="font-numeric px-4 py-2 text-right">{org._count.invoices}</td>
                    <td className="font-numeric px-4 py-2 text-right">
                      {org._count.bankStatements}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
