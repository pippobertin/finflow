const glossaryEntries = [
  {
    term: "Ricavi netti",
    definition: "Somma delle fatture emesse, escludendo l'IVA. È il fatturato dell'azienda.",
  },
  {
    term: "Costi variabili",
    definition:
      "Costi che crescono insieme al fatturato (materiali, consulenze esterne, manodopera diretta).",
  },
  {
    term: "Margine di contribuzione (MdC)",
    definition:
      "Ricavi meno costi variabili. È ciò che resta per coprire i costi fissi e generare utile.",
  },
  {
    term: "Costi fissi",
    definition:
      "Costi che l'azienda sostiene comunque, indipendentemente dal fatturato (affitto, utenze, compensi fissi, assicurazioni).",
  },
  {
    term: "EBITDA",
    definition:
      "Margine operativo lordo. Misura il guadagno prodotto dalla sola attività caratteristica, prima di ammortamenti, imposte e oneri finanziari.",
  },
  {
    term: "EBIT",
    definition:
      "Risultato operativo. È l'EBITDA meno gli ammortamenti. Indica quanto guadagna l'azienda dalla sua attività.",
  },
  {
    term: "Utile netto",
    definition:
      "Ciò che rimane dopo aver pagato tutti i costi, gli oneri finanziari e le imposte. È il guadagno reale del periodo.",
  },
  {
    term: "BEP / Punto di pareggio",
    definition:
      "Break Even Point: soglia minima di fatturato necessaria per coprire tutti i costi. Sopra si guadagna, sotto si perde.",
  },
  {
    term: "Margine di sicurezza",
    definition:
      "Di quanto i ricavi superano il punto di pareggio, espresso in percentuale. Più è alto, più l'azienda è stabile.",
  },
  {
    term: "ROI",
    definition:
      "Return on Investment: redditività degli investimenti. Misura quanto rende il capitale messo in azienda.",
  },
  {
    term: "ROE",
    definition:
      "Return on Equity: redditività del capitale proprio. Misura quanto rende il capitale dei soci.",
  },
  {
    term: "PFN — Posizione finanziaria netta",
    definition:
      "Debiti verso banche meno liquidità. Quando è negativa, significa che la cassa supera i debiti bancari.",
  },
  {
    term: "Ammortamenti",
    definition:
      "Quote annuali di costo di beni durevoli (macchinari, attrezzature, software). Non rappresentano un'uscita di cassa effettiva nell'anno.",
  },
  {
    term: "Margine di contribuzione %",
    definition:
      "Il margine di contribuzione espresso come percentuale dei ricavi. Indica quanta parte del fatturato resta dopo i costi variabili.",
  },
  {
    term: "Liquidità corrente",
    definition:
      "Rapporto tra attività correnti (cassa, crediti) e passività correnti (debiti a breve). Indica la capacità di pagare i debiti a breve.",
  },
  {
    term: "Rapporto di indebitamento",
    definition:
      "Rapporto tra debiti totali e patrimonio netto. Misura quanto l'azienda dipende dal capitale di terzi.",
  },
];

export default function GlossarioPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Piccolo glossario</h1>
        <p className="mt-1 text-sm text-slate-500">
          I termini tecnici usati nella dashboard, tradotti in italiano semplice.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Termine
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Significato
              </th>
            </tr>
          </thead>
          <tbody>
            {glossaryEntries.map((entry) => (
              <tr
                key={entry.term}
                className="border-b border-slate-50 last:border-b-0 dark:border-slate-800/50"
              >
                <td className="px-5 py-3 align-top font-semibold whitespace-nowrap">
                  {entry.term}
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{entry.definition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
