# Fase 4 — Workspace Cliente + White-Label — Complete

## Status: COMPLETE

Data completamento: 2026-04-22

## Panoramica

Fase 4 costruisce il workspace completo per il cliente imprenditore e il white-label per lo studio commercialista. Tre blocchi:

- **Blocco A**: Workspace narrativo (8 pagine CE-based + engine indicatori)
- **Blocco B**: Workspace operativo (cassa, scadenze, fatture, movimenti)
- **Blocco C**: White-label branding + alert bilanci in ritardo

## Blocco A — Workspace Narrativo

### Pagine create

| Route                      | Contenuto                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `/dashboard`               | KPI hero (ricavi, EBITDA, utile, BEP), narrative box "In breve", top 4 indicatori, quick links |
| `/andamento`               | Grafico ricavi vs margini + tabella riassuntiva                                                |
| `/quanto-guadagno`         | Waterfall chart CE riclassificato + tabella completa                                           |
| `/dove-vanno-i-soldi`      | Doughnut composizione costi + barra orizzontale costi fissi                                    |
| `/punto-pareggio`          | KPI BEP + grafico confronto ricavi vs BEP                                                      |
| `/situazione-patrimoniale` | Placeholder (engine SP non ancora popolato)                                                    |
| `/salute-finanziaria`      | Griglia completa 6 indicatori con semafori + summary bar                                       |
| `/glossario`               | 16 termini finanziari italiani (server component)                                              |

### Engine e infrastruttura

- `lib/analysis/client-indicators.ts` — BEP, 6 indicatori con semafori (ADR-007), narrative deterministica
- `lib/hooks/use-client-cdg.ts` — React Query hook per CE + indicatori
- `app/api/client/cdg/route.ts` — API con `getClientSession()` + `trustedOnly: true`
- `components/client/` — 6 componenti riusabili (KpiHeroGrid, WaterfallChart, IndicatorCard, NarrativeBox, SemaphoreBadge)
- `components/client/client-sidebar.tsx` — Sidebar con 4 sezioni nav

### ADR prodotti

- **ADR-007**: Soglie semaforo indicatori CE (ok/warn/bad per 6+3 metriche)
- **ADR-008**: Visibilità dati workspace cliente (`isTrusted` flag)

### Fix critico (A3)

- Aggiunta colonna `is_trusted` su `TrialBalanceSnapshot` (default `false`)
- Client workspace mostra solo snapshot con `isTrusted=true`
- Empty state informativo se nessuno snapshot trusted esiste
- Migration: `prisma/migration-fase4-trusted.sql` (eseguita su dev DB)

## Blocco B — Workspace Operativo

### Pagine create

| Route        | Contenuto                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/cassa`     | Saldo attuale + proiezione 30/60/90gg con delta, grafico area proiezione, prossimi 10 movimenti previsti                                                                                          |
| `/scadenze`  | Calendario unificato pagamenti raggruppato per mese. Fonti: fatture pending, spese ricorrenti, payable attesi, IVA. Filtri per tipo e orizzonte (30/60/90/180gg). KPI incassi/uscite/flusso netto |
| `/fatture`   | Tabella paginata con filtri direzione/stato/ricerca. Form 5 campi per nuova fattura (tipo, data, scadenza, imponibile, IVA). Azione "Segna pagata" inline                                         |
| `/movimenti` | Lista read-only estratto conto con badge categoria CDG e centro di costo. Link a importazione. Paginazione + ricerca                                                                              |

### API endpoints

| Route                          | Metodo         | Descrizione                                               |
| ------------------------------ | -------------- | --------------------------------------------------------- |
| `/api/client/cassa`            | GET            | Posizione di cassa + milestones + chart data + next items |
| `/api/client/scadenze`         | GET            | Calendario unificato scadenze (aggregazione multi-fonte)  |
| `/api/client/fatture`          | GET/POST/PATCH | Lista, creazione, mark paid                               |
| `/api/client/movimenti`        | GET            | Lista movimenti bancari                                   |
| `/api/client/movimenti/upload` | POST           | Upload estratto conto (CSV/PDF)                           |

### Hook React Query

- `use-client-cassa.ts`, `use-client-scadenze.ts`, `use-client-fatture.ts`, `use-client-movimenti.ts`

## Blocco C — White-Label + Alert

### White-label branding

- **Schema**: Aggiunta colonna `branding JSONB DEFAULT '{}'` su `AccountingFirm`
- **Migration**: `prisma/migration-fase4-branding.sql` (eseguita su dev DB)
- **API**: `GET/POST /api/firm/branding` — lettura/salvataggio configurazione
- **Pagina**: `/firm/branding` — form con upload logo (data URL), color picker brand/accent, nome visibile, anteprima live
- **Sidebar firm**: Aggiunto link "Branding" con icona Palette

### Iniezione CSS server-side

- `app/(dashboard)/layout.tsx` legge `AccountingFirm.branding` via join `Organization → AccountingFirm`
- Emette `<style>:root { --brand: #xxx; --accent: #yyy; }</style>` inline nel `<head>`
- Zero flash of unstyled content (tutto server-side)
- Logo e nome studio passati a `ClientSidebar` via props
- Footer "powered by FinFlow" nel workspace cliente

### Alert bilanci in ritardo

- `getLateBalanceClients()` in `lib/queries/firm.ts`
- Logica: per ogni org dello studio, trova ultimo snapshot locked. >45gg = ambra, >75gg = rosso. Nessuno snapshot + org >30gg = rosso
- Blocco "Bilanci da caricare" in cima a `/firm/dashboard` con max 5 clienti
- Indicatore severità (pallino rosso/ambra), nome cliente, ultimo bilancio, giorni ritardo
- Link diretto a `/firm/clients/[id]/bilanci/upload`
- Se nessun ritardo: messaggio positivo "Tutti i bilanci sono aggiornati" con icona verde

## Commit chain

| Hash      | Messaggio                                                                       |
| --------- | ------------------------------------------------------------------------------- |
| `ceade27` | V2 Fase 4.A1: workspace cliente narrativo — 8 pagine + engine + routing         |
| `40e399d` | V2 Fase 4.A2: test unit per client-indicators engine                            |
| `3ba74f8` | V2 Fase 4.A3a: ADR-008 client-data-visibility                                   |
| `dc0a45c` | V2 Fase 4.A3b: isTrusted schema + migration                                     |
| `5d77b14` | V2 Fase 4.A3c: trustedOnly query fix                                            |
| `e939344` | V2 Fase 4.B1: workspace cliente operativo — cassa, scadenze, fatture, movimenti |
| `df1287d` | V2 Fase 4.C1: white-label branding + late balance alert                         |

## File creati/modificati

### Nuovi (Fase 4 totale)

- 12 pagine sotto `app/(dashboard)/` (8 narrative + 4 operative)
- 1 pagina `app/firm/branding/`
- 6 API routes sotto `app/api/client/`
- 1 API route `app/api/firm/branding/`
- 6 componenti `components/client/`
- 5 hooks `lib/hooks/use-client-*.ts`
- 1 engine `lib/analysis/client-indicators.ts`
- 1 test `lib/analysis/__tests__/client-indicators.test.ts`
- 2 ADR (`007`, `008`)
- 2 migration SQL (`migration-fase4-trusted.sql`, `migration-fase4-branding.sql`)

### Modificati

- `prisma/schema.prisma` — `isTrusted` su TrialBalanceSnapshot, `branding` su AccountingFirm
- `lib/queries/income-statement.ts` — `trustedOnly` option
- `lib/queries/firm.ts` — `getLateBalanceClients()`
- `app/(dashboard)/layout.tsx` — branding CSS injection + footer
- `app/firm/dashboard/page.tsx` — late balance alert block
- `app/page.tsx` — CLIENT_OWNER redirect
- `components/client/client-sidebar.tsx` — sezione Operativo
- `components/firm/firm-sidebar.tsx` — link Branding

## Migrazioni da eseguire su produzione

```sql
-- 1. isTrusted flag (ADR-008)
ALTER TABLE "finflow"."trial_balance_snapshot"
  ADD COLUMN "is_trusted" BOOLEAN NOT NULL DEFAULT false;

-- 2. Branding JSON field
ALTER TABLE "finflow"."accounting_firm"
  ADD COLUMN IF NOT EXISTS "branding" JSONB DEFAULT '{}';
```

## Test

- 9 test unit per client-indicators engine (BEP, indicatori, narrative)
- Build Next.js: OK (0 errori)
- ESLint: OK (0 errori nuovi)
- TypeScript: OK (errori residui solo in test pre-esistenti cashflow-projection)

## TODO per fasi successive

### Fase 5 — Budget & Scadenziario Raffinato

- [ ] Budget annuale per centro di costo con confronto consuntivo
- [ ] Scadenziario con notifiche push/email per scadenze imminenti
- [ ] Engine IVA rinnovato con split payment e regime forfettario
- [ ] Dashboard comparativa multi-periodo (anno su anno)

### Fase 6 — Affinamenti Operativi

- [ ] Parser PDF bancari potenziati (più banche supportate)
- [ ] Pattern detector avanzato per categorizzazione automatica movimenti
- [ ] White-label dominio personalizzato (es. studio-blm.finflow.app)
- [ ] Bottone "Conferma e rendi visibile" nella pagina bilanci (elimina gestione manuale isTrusted)
- [ ] Situazione patrimoniale completa (engine SP da TrialBalanceLine)
- [ ] Export PDF/Excel dei report CE e indicatori
