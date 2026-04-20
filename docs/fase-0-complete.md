# Fase 0 — Completata

> Branch: `v2/cdg-integration`
> Data chiusura: 2026-04-20

## Commit chain

| Fase | SHA       | Descrizione                                                                       |
| ---- | --------- | --------------------------------------------------------------------------------- |
| 0.0  | `ea65916` | Multi-schema Prisma setup, dump baseline, ADR-001                                 |
| 0.2  | `9922b39` | Feature flag system + Next.js 16 proxy per legacy route gating                    |
| 0.3  | `aaee298` | Disattivazione codice legacy via feature flag (API 404 + UI guards + test skipIf) |
| 0.4  | `aec232a` | Sidebar pulita (rimosso badge unreconciled count + fetch legacy)                  |
| 0.5  | `23f3fe1` | ADR-002 feature flags strategy + ADR-003 dual-workspace routing placeholder       |
| 0.6  | `5c12359` | Vitest test non-regressione vat-engine (39 test, 5 gruppi)                        |
| 0.7  | `9b53413` | Installazione xlsx 0.18.5 (SheetJS)                                               |

## Stato del codebase a fine Fase 0

- **Feature flags**: 3 flag tutti `false` — `LEGACY_RECONCILIATION`, `LEGACY_FATTURAPA_IMPORT`, `LEGACY_FATTUREINCLOUD`
- **Codice legacy**: su disco, disabilitato a runtime, test skippati via `describe.skipIf`
- **Test suite**: 39 passed (vat-engine), 15 skipped (fatturapa-parser), 0 failed
- **TypeScript**: `tsc --noEmit` pulito
- **Build**: `next build` successo, proxy attivo
- **ADR**: 001 (multi-schema), 002 (feature flags), 003 (dual-workspace routing placeholder)
- **Dipendenze**: xlsx 0.18.5 installato, non ancora importato

## Bug potenziale noto

`isItalianHoliday` in `lib/vat/vat-engine.ts` non riconosce la Domenica di Pasqua come festività. Irrilevante per `nextBusinessDay` (le domeniche sono già non lavorative), ma la funzione è tecnicamente incompleta per altri usi.

**Azione**: aprire ADR-004 in Fase 5 quando il modulo IVA verrà rivisto. Annotato nel test con commento `// BUG POTENZIALE`.

## TODO aperti per fasi successive

| TODO                                                                      | Dove annotato                                                     | Fase target |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------- |
| Smoke test integrazione `buildDailyProjection` con `organizationId` reale | `docs/adr/003-dual-workspace-routing.md` § Considerazioni di test | Fase 1      |
| Unit test completi su `cashflow-projection.ts`                            | Piano di migrazione V2                                            | Fase 3      |
| ADR-004: revisione normativa IVA (aliquote, date, surcharge)              | Test vat-engine + questo documento                                | Fase 5      |

## Osservazioni raccolte in Fase 0

Utili per la pianificazione di Fase 1:

1. **Multi-schema Prisma** già configurato con `prisma.config.ts` e schema in `public`. Lo schema V2 (`v2`) può essere aggiunto come secondo schema senza toccare il primo.
2. **Feature flag system** è hardcoded (`as const`), nessuna env var. Semplice e deterministico per il refactor, ma andrà rimosso a fine Fase 3.
3. **`bank-statements-client.tsx`** contiene una variabile locale con lo stesso nome del badge rimosso dalla sidebar. Non è un problema (è un contesto diverso), ma va tenuto presente durante il refactor Fase 1.
4. **Directory test** funziona con Vitest 4.1.1, alias `@/` configurato, `globals: true`. Pattern di test stabilito.
5. **Format ADR** consolidato con template in `docs/adr/TEMPLATE.md`. Le sezioni Status/Context/Decision/Consequences sono sufficienti; aggiungere "Considerazioni di test" dove rilevante.
6. **Peer dependency warning** pre-esistente: `@tremor/react` richiede React 18, codebase usa React 19. Non bloccante, da risolvere eventualmente con migrazione a libreria chart nativa o upgrade tremor.
