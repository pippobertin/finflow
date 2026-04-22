import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listFirmOrganizations, getFirmStats, getLateBalanceClients } from "@/lib/queries/firm";
import { Building2, FileText, Users, AlertTriangle, CheckCircle2, Upload } from "lucide-react";

export default async function FirmDashboardPage() {
  const session = await auth();
  if (!session?.user?.accountingFirmId) redirect("/login");

  const accountingFirmId = session.user.accountingFirmId;
  const [organizations, stats, lateClients] = await Promise.all([
    listFirmOrganizations(accountingFirmId),
    getFirmStats(accountingFirmId),
    getLateBalanceClients(accountingFirmId),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Studio</h1>
        <p className="text-muted-foreground text-sm">Panoramica del portafoglio clienti</p>
      </div>

      {/* Late balance alert */}
      <LateBalanceAlert clients={lateClients} />

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

function LateBalanceAlert({
  clients,
}: {
  clients: {
    orgId: string;
    orgName: string;
    lastPeriodEnd: string | null;
    daysLate: number;
    severity: "amber" | "red";
    neverUploaded: boolean;
  }[];
}) {
  if (clients.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Tutti i bilanci sono aggiornati
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">
            Nessun cliente con bilancio in ritardo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 border-b border-amber-200 px-4 py-3 dark:border-amber-900/50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Bilanci da caricare
        </h2>
      </div>
      <div className="divide-y divide-amber-100 dark:divide-amber-900/30">
        {clients.map((client) => (
          <div key={client.orgId} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  client.severity === "red" ? "bg-red-500" : "bg-amber-500"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {client.orgName}
                </p>
                <p className="text-xs text-slate-500">
                  {client.neverUploaded
                    ? "Mai caricato"
                    : `Ultimo bilancio: ${client.lastPeriodEnd}`}
                  {" · "}
                  <span
                    className={`font-semibold ${
                      client.severity === "red" ? "text-red-600" : "text-amber-600"
                    }`}
                  >
                    {client.daysLate} giorni
                  </span>
                </p>
              </div>
            </div>
            <Link
              href={`/firm/clients/${client.orgId}/bilanci/upload`}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-indigo-600 shadow-sm transition-colors hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-700"
            >
              <Upload className="h-3 w-3" />
              Carica
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
