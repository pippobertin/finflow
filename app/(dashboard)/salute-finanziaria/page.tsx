"use client";

import { useClientCdg } from "@/lib/hooks/use-client-cdg";
import { IndicatorCard } from "@/components/client/indicator-card";
import { NarrativeBox } from "@/components/client/narrative-box";

export default function SaluteFinanziariaPage() {
  const { data, isLoading, error } = useClientCdg();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Indicatori di salute</h1>
        <p className="mt-4 text-sm text-slate-500">Nessun dato disponibile.</p>
      </div>
    );
  }

  const { indicators } = data;
  const okCount = indicators.filter((i) => i.status === "ok").length;
  const warnCount = indicators.filter((i) => i.status === "warn").length;
  const badCount = indicators.filter((i) => i.status === "bad").length;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Indicatori di salute finanziaria</h1>
        <p className="mt-1 text-sm text-slate-500">
          I parametri principali che banche e finanziatori guardano per giudicare un&apos;azienda.
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        {okCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {okCount} ottimo
          </span>
        )}
        {warnCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {warnCount} attenzione
          </span>
        )}
        {badCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {badCount} critico
          </span>
        )}
      </div>

      {/* Indicators grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {indicators.map((ind) => (
          <IndicatorCard key={ind.id} indicator={ind} />
        ))}
      </div>

      <NarrativeBox tag="Come leggere questi indicatori">
        Ogni indicatore ha un semaforo: verde significa che il valore è nella norma, ambra che è da
        tenere d&apos;occhio, rosso che richiede attenzione. Le soglie di riferimento sono visibili
        cliccando sull&apos;icona informazioni (ℹ) accanto a ciascun indicatore. I dati sono
        calcolati dal bilancio di verifica più recente caricato dal tuo commercialista.
      </NarrativeBox>
    </div>
  );
}
