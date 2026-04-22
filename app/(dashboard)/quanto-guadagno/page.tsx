"use client";

import { useClientCdg } from "@/lib/hooks/use-client-cdg";
import { NarrativeBox } from "@/components/client/narrative-box";
import { WaterfallChart } from "@/components/client/waterfall-chart";
import { formatEUR } from "@/lib/helpers/format";

function fmtPct(v: number): string {
  return v.toFixed(1).replace(".", ",") + "%";
}

export default function QuantoGuadagnoPage() {
  const { data, isLoading, error } = useClientCdg();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-6 h-[400px] animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Quanto guadagna davvero l&apos;azienda</h1>
        <p className="mt-4 text-sm text-slate-500">Nessun dato disponibile.</p>
      </div>
    );
  }

  const { incomeStatement: ce, ratios } = data;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Quanto guadagna davvero l&apos;azienda</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dal fatturato all&apos;utile, passo dopo passo.
        </p>
      </div>

      {/* Waterfall chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-semibold">Dal ricavo all&apos;utile</h3>
        <p className="mb-2 text-xs text-slate-500">
          I passaggi che trasformano i ricavi nell&apos;utile finale
        </p>
        <WaterfallChart ce={ce} />
      </div>

      {/* Full CE table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <h3 className="text-sm font-semibold">Conto Economico riclassificato</h3>
          <p className="text-xs text-slate-500">
            Periodo: {data.periodStart} – {data.periodEnd}
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-5 py-2.5 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Voce
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Importo
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">
                % Ricavi
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Revenue */}
            <CERow label="A) Ricavi netti" amount={ce.revenue} pct={100} variant="total" />
            {ce.revenueDetail.map((d) => (
              <CERow key={d.cdgCategory} label={d.label} amount={d.amount} indent />
            ))}

            {/* Variable costs */}
            <CERow
              label="B) Costi variabili"
              amount={ce.variableCosts}
              pct={ratios.variableCostRatio}
            />
            {ce.variableCostDetail.map((d) => (
              <CERow key={d.cdgCategory} label={d.label} amount={d.amount} indent />
            ))}

            {/* MdC */}
            <CERow
              label="C) Margine di Contribuzione (A−B)"
              amount={ce.mdc}
              pct={ratios.mdcMargin}
              variant="highlight"
            />

            {/* Fixed costs */}
            <CERow
              label="D) Costi fissi operativi"
              amount={ce.fixedCostsOperating}
              pct={ratios.fixedCostRatio}
            />
            {ce.fixedCostOperatingDetail.map((d) => (
              <CERow key={d.cdgCategory} label={d.label} amount={d.amount} indent />
            ))}

            {/* EBITDA */}
            <CERow
              label="E) EBITDA (C−D)"
              amount={ce.ebitda}
              pct={ratios.ebitdaMargin}
              variant="total"
            />

            {/* Depreciation */}
            <CERow label="F) Ammortamenti" amount={ce.depreciation} />
            {ce.depreciationDetail.map((d) => (
              <CERow key={d.cdgCategory} label={d.label} amount={d.amount} indent />
            ))}

            {/* EBIT */}
            <CERow
              label="G) EBIT (E−F)"
              amount={ce.ebit}
              pct={ratios.ebitMargin}
              variant="highlight"
            />

            {/* Financial */}
            {ce.financialDetail.length > 0 && (
              <>
                <CERow label="Oneri/proventi finanziari" amount={ce.financialNet} />
                {ce.financialDetail.map((d) => (
                  <CERow key={d.cdgCategory} label={d.label} amount={d.amount} indent />
                ))}
              </>
            )}

            {/* Extraordinary */}
            {ce.extraordinaryDetail.length > 0 && (
              <>
                <CERow label="Oneri/proventi straordinari" amount={ce.extraordinaryNet} />
                {ce.extraordinaryDetail.map((d) => (
                  <CERow key={d.cdgCategory} label={d.label} amount={d.amount} indent />
                ))}
              </>
            )}

            {/* Tax */}
            {ce.tax > 0 && <CERow label="Imposte" amount={-ce.tax} />}

            {/* Net Income */}
            <CERow
              label="Utile Netto"
              amount={ce.netIncome}
              pct={ratios.netMargin}
              variant="total"
            />
          </tbody>
        </table>
      </div>

      <NarrativeBox tag="In parole semplici">
        Immagina i ricavi come una torta. Una prima fetta va ai costi variabili (materiali,
        lavorazioni, consulenze dirette). Quello che resta è il margine di contribuzione. Da questo
        si tolgono i costi fissi (affitto, utenze, compensi fissi), ottenendo l&apos;EBITDA.
        Sottraendo ammortamenti si arriva all&apos;EBIT, e dopo oneri finanziari e imposte
        all&apos;utile netto: il guadagno reale del periodo.
      </NarrativeBox>
    </div>
  );
}

function CERow({
  label,
  amount,
  pct,
  variant,
  indent,
}: {
  label: string;
  amount: number;
  pct?: number | null;
  variant?: "total" | "highlight";
  indent?: boolean;
}) {
  return (
    <tr
      className={
        variant === "total"
          ? "bg-indigo-50/50 font-medium dark:bg-indigo-900/10"
          : variant === "highlight"
            ? "bg-slate-50/80 font-medium dark:bg-slate-800/30"
            : "border-b border-slate-50 dark:border-slate-800/50"
      }
    >
      <td
        className={`px-5 py-2 ${indent ? "pl-10 text-slate-500 dark:text-slate-400" : ""} ${variant === "total" ? "font-semibold" : ""}`}
      >
        {label}
      </td>
      <td
        className={`font-numeric px-5 py-2 text-right tabular-nums ${variant === "total" ? "font-semibold" : ""} ${
          amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {formatEUR(amount)}
      </td>
      <td className="font-numeric px-5 py-2 text-right text-xs text-slate-500 tabular-nums">
        {pct != null ? fmtPct(pct) : ""}
      </td>
    </tr>
  );
}
