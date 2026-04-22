# ADR-007: Soglie indicatori finanziari per il workspace cliente

## Status

accepted

## Context

Il workspace cliente (Fase 4, Blocco A) presenta indicatori di salute finanziaria con semafori tricolore (verde/ambra/rosso). Servono soglie pragmatiche per l'MVP, derivate dal brief CDG e dal wireframe `Dashboard_CDG.html`.

Gli indicatori sono calcolati a partire dal CE riclassificato (Fase 3) e, dove disponibile, dallo stato patrimoniale.

## Decision

### Indicatori CE-based (disponibili subito)

| Indicatore                   | Verde (ok) | Ambra (warn) | Rosso (bad) | Formula                        |
| ---------------------------- | ---------- | ------------ | ----------- | ------------------------------ |
| Margine di Contribuzione %   | ≥ 30%      | 15% – 30%    | < 15%       | MdC / Ricavi × 100             |
| EBITDA Margin %              | ≥ 15%      | 5% – 15%     | < 5%        | EBITDA / Ricavi × 100          |
| Margine Netto %              | ≥ 5%       | 0% – 5%      | < 0%        | Utile Netto / Ricavi × 100     |
| Incidenza Costi Variabili %  | ≤ 60%      | 60% – 80%    | > 80%       | Costi Var. / Ricavi × 100      |
| Incidenza Costi Fissi %      | ≤ 30%      | 30% – 50%    | > 50%       | Costi Fissi Op. / Ricavi × 100 |
| Margine di Sicurezza (BEP) % | ≥ 20%      | 10% – 20%    | < 10%       | (Ricavi − BEP) / Ricavi × 100  |

### Indicatori SP-based (quando balance-sheet sarà implementato)

| Indicatore                  | Verde (ok) | Ambra (warn) | Rosso (bad) | Formula                                       |
| --------------------------- | ---------- | ------------ | ----------- | --------------------------------------------- |
| Rapporto di Indebitamento   | ≤ 2        | 2 – 4        | > 4         | Passività / Patrimonio Netto                  |
| Liquidità Corrente          | ≥ 1.5      | 1 – 1.5      | < 1         | Attivo Corrente / Passivo Corrente            |
| Liquidità Secca (Acid Test) | ≥ 0.8      | 0.5 – 0.8    | < 0.5       | (Attivo Corrente − Scorte) / Passivo Corrente |

### Formato dei semafori

- **Verde (ok)**: badge `#d1fae5` con testo `#065f46`, meter fill brand gradient
- **Ambra (warn)**: badge `#fef3c7` con testo `#92400e`, meter fill `#b45309`→`#d97706`
- **Rosso (bad)**: badge `#fee2e2` con testo `#991b1b`, meter fill `#b91c1c`→`#dc2626`

### Punto di Pareggio (BEP)

Formula: `BEP = Costi Fissi Totali / (MdC / Ricavi)` dove MdC/Ricavi è il margine di contribuzione percentuale.

Margine di sicurezza: `(Ricavi − BEP) / Ricavi × 100`

### Testo narrativo

Il box "In breve" è generato server-side con logica deterministica (no AI). Templates:

- Se EBITDA margin > 30%: "L'azienda ha una marginalità operativa molto alta…"
- Se EBITDA margin 15-30%: "L'azienda ha una buona marginalità operativa…"
- Se EBITDA margin < 15%: "La marginalità operativa è contenuta…"

Pattern simili per trend YoY e composizione costi. I template sono in `lib/analysis/client-indicators.ts`.

## Consequences

- Le soglie sono configurabili in un unico file (`lib/analysis/client-indicators.ts`), modificabili senza migrazioni
- Non sono personalizzabili per cliente nell'MVP (tutti vedono le stesse soglie)
- In futuro il controller potrà sovrascrivere le soglie per singolo cliente (Fase 5+)
- Gli indicatori SP-based sono disabilitati finché `balance-sheet.ts` non ha dati reali
