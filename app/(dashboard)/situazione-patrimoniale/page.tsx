"use client";

import { NarrativeBox } from "@/components/client/narrative-box";

export default function SituazionePatrimonialePage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Situazione patrimoniale</h1>
        <p className="mt-1 text-sm text-slate-500">Cosa possiede l&apos;azienda e cosa deve.</p>
      </div>

      {/* Placeholder — balance sheet engine not yet populated */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800 dark:bg-amber-950/20">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Dati patrimoniali in corso di caricamento
        </p>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
          La situazione patrimoniale sarà disponibile quando il tuo commercialista caricherà il
          bilancio con le categorie dello stato patrimoniale (attivo, passivo, patrimonio netto).
          Per ora il sistema dispone solo del conto economico riclassificato.
        </p>
      </div>

      <NarrativeBox tag="Cosa vedrò qui">
        Questa sezione mostrerà la composizione dell&apos;attivo (cassa, crediti, immobilizzazioni)
        e del passivo (debiti, patrimonio netto), con la posizione finanziaria netta (PFN). Sarà
        disponibile non appena i dati patrimoniali verranno inseriti nel sistema.
      </NarrativeBox>
    </div>
  );
}
