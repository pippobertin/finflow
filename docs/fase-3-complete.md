# Fase 3 — Report finale di chiusura

**Branch:** `v2/cdg-integration`
**Data:** 2026-04-21
**Baseline (pre-Fase 3):** commit `23f3fe1` (V2 Fase 0.5: ADR 002/003)

---

## Riepilogo

La Fase 3 ha completato tre obiettivi:

1. **Schema light** — semplificazione dello schema Invoice/BankStatement, archivio dei dati legacy
2. **Motore CDG** — categorizzazione movimenti, scorporo IVA, CE riclassificato con Golden Test
3. **Pulizia legacy** — rimozione completa del codice V1 sospeso dai feature flag

---

## Block A — Schema Light + Archivio

| Deliverable                                                                                                            | Stato     |
| ---------------------------------------------------------------------------------------------------------------------- | --------- |
| Migration SQL con tabelle archivio (`invoice_legacy_archive`, `bank_statement_legacy_archive`, `invoice_line_archive`) | Applicata |
| Schema Invoice semplificato (rimossi 14 campi XML, `InvoiceLine` → archivio)                                           | Fatto     |
| Schema BankStatement semplificato (`reconciliationStatus` → archivio)                                                  | Fatto     |
| Tutti i riferimenti TS aggiornati (nessun type error)                                                                  | Fatto     |
| `cashflow-projection.ts` riscritto (21 unit test)                                                                      | Fatto     |
| Sanity check pre-drop (conteggi tabelle verificati)                                                                    | Fatto     |
| Bank statements light UI funzionante                                                                                   | Fatto     |

**Commit chain:** `104dda2` → `929941f` → `bcdee1b` → `8f0f60c` → `016ab3b`

---

## Block B — Categorizzazione + IVA

| Deliverable                                                              | Stato |
| ------------------------------------------------------------------------ | ----- |
| `computeVatSplit()` con aliquote IT (22%, 10%, 5%, 4%)                   | Fatto |
| 66 test su vat-engine (golden test scorporo su dati BLM reali)           | Fatto |
| `cdgCategory` su BankStatement (enum `CdgCategory` con 15 categorie)     | Fatto |
| `assignCdgCategory()` con pattern matching descrizione + centri di costo | Fatto |
| API `POST /api/analysis/categorize` per batch categorizzazione           | Fatto |
| Regole keyword-based per costi fissi, variabili, ammortamenti, personale | Fatto |

**Commit chain:** `d02466b` → `fc2de38`

---

## Block C — Motore CE Riclassificato

| Deliverable                                                                              | Stato |
| ---------------------------------------------------------------------------------------- | ----- |
| `computeIncomeStatement()` — cascade Revenue → MdC → EBITDA → EBIT → Utile Netto         | Fatto |
| Separazione FIXED_COST_DEPRECIATION tra EBITDA ed EBIT                                   | Fatto |
| `computeFinancialRatios()` — margini MdC, EBITDA, EBIT, netto                            | Fatto |
| `balance-sheet.ts` — placeholder strutturale (nessuna categoria SP nello schema attuale) | Fatto |
| Snapshot sintetico 2024 da dati BLM (21 righe, isLocked=true)                            | Fatto |
| API `GET /api/analysis/income-statement` + hook React Query                              | Fatto |
| Pagina `/cdg` con tabella CE e ratio card                                                | Fatto |

### Golden Test BLM 2024 (Primary)

| Target                 | Atteso  | Calcolato | Scostamento |
| ---------------------- | ------- | --------- | ----------- |
| Ricavi                 | 348.853 | 348.853   | 0.0000%     |
| MdC                    | 264.549 | 264.549   | 0.0000%     |
| EBITDA                 | 106.659 | 106.659   | 0.0000%     |
| EBIT                   | 92.469  | 92.469    | 0.0000%     |
| Risultato ante imposte | 108.562 | 108.562   | 0.0000%     |
| Imposte                | 7.551   | 7.551     | 0.0000%     |
| Utile Netto            | 101.011 | 101.011   | 0.0000%     |

Tolleranza: +/- 2%. Risultato: **PASS** (0% su tutti i target).

### Golden Test 9m 2025 (Secondary)

| Target | Atteso  | Calcolato | Scostamento |
| ------ | ------- | --------- | ----------- |
| Ricavi | 272.345 | 165.878   | -39.09%     |

Risultato: **FAIL** — causa: snapshot 9m 2025 incompleto (45 conti da upload di test, mancano ~106K di ricavi per servizi). La consistenza interna del motore e stata verificata (i subtotali calcolati corrispondono alle somme delle categorie). Il problema e di completezza dati, non di logica motore.

**Commit:** `15145b6`

---

## Block D — Pulizia Legacy

| Deliverable                                                                                               | Stato     |
| --------------------------------------------------------------------------------------------------------- | --------- |
| Backup pre-distruttivo (`backups/pre-fase3-d-2026-04-21T1401Z.sql`, 508KB)                                | Fatto     |
| DROP tabelle archivio (`invoice_legacy_archive`, `bank_statement_legacy_archive`, `invoice_line_archive`) | Fatto     |
| DROP tabelle V1 (`fin_payment_event`, `fin_dismissed_match`, `fin_connector`)                             | Fatto     |
| DROP enum `ConnectorType`                                                                                 | Fatto     |
| Migration SQL: `prisma/migrations/v2_phase3_d_drop_legacy.sql`                                            | Applicata |
| Schema Prisma aggiornato (rimossi 4 modelli + relazioni)                                                  | Fatto     |
| `lib/feature-flags.ts` eliminato                                                                          | Fatto     |
| `proxy.ts` semplificato (pass-through, nessun gate)                                                       | Fatto     |
| ADR-002 aggiornato a **superseded**                                                                       | Fatto     |

### File eliminati (63 file, -9.659 righe)

**Parser e connettori:**

- `lib/parsers/fatturapa-parser.ts` (503 righe)
- `lib/parsers/__tests__/fatturapa-parser.test.ts` (486 righe)
- `lib/connectors/fattureincloud.ts` (494 righe)
- `lib/connectors/fatturapa-import.ts` (178 righe)
- `lib/validations/fatturapa-import.ts`
- `lib/validations/connector.ts`

**Reconciliation engine:**

- `lib/reconciliation/reconciliation-engine.ts` (1.090 righe)
- `lib/hooks/use-reconciliation.ts` (343 righe)
- `components/reconciliation/` (4 componenti: match-card, manual-match, expense-match-group, pattern-training-dialog)

**Hook e query legacy:**

- `lib/hooks/use-fatturapa-import.ts`
- `lib/hooks/use-connectors.ts`
- `lib/hooks/use-payment-events.ts`
- `lib/queries/connectors.ts`

**Componenti UI:**

- `components/import/fatturapa-*.tsx` (6 componenti)
- `components/import/reconciliation-table.tsx`
- `components/import/reconciliation-result.tsx`
- `components/invoices/payment-events-drawer.tsx`
- `components/bank-statements/bank-statement-table.tsx`
- `components/bank-statements/bank-statement-row-actions.tsx`
- `components/bank-statements/suggestion-detail.tsx`
- `components/onboarding/step-reconciliation.tsx`
- `components/settings/connector-form-dialog.tsx`
- `components/settings/connectors-client.tsx`

**API routes:**

- `app/api/reconciliation/` (6 route)
- `app/api/connectors/` (5 route)
- `app/api/import/fatturapa/route.ts`
- `app/api/payment-events/route.ts`
- `app/api/bank-statements/reconciliation/` (2 route)
- `app/(dashboard)/settings/connectors/` (directory)

**Script:**

- `scripts/bulk-reconcile.ts`
- `scripts/bulk-reconcile-v2.ts`
- `scripts/update-bank-statements.ts`

### File modificati (cleanup riferimenti)

- `components/import/bank-statement-import-client.tsx` — rimosso step riconciliazione
- `components/onboarding/setup-wizard.tsx` — rimosso step riconciliazione
- `components/dashboard/sidebar.tsx` — rimosso commento ADR-002
- `prisma/seed.ts` — rimossi riferimenti Connector
- `lib/hooks/use-bank-statement-import.ts` — rimossi export riconciliazione
- `lib/queries/cashflow-projection.ts` — rimosso commento PaymentEvent
- `lib/vat/__tests__/vat-engine.test.ts` — rimosso commento legacy
- `proxy.ts` — semplificato a pass-through

---

## Stato finale

| Metrica                   | Valore                       |
| ------------------------- | ---------------------------- |
| Build (`next build`)      | PASS                         |
| Test (`vitest run`)       | 117 pass, 0 fail             |
| File test                 | 7 suite                      |
| Tabelle DB eliminate      | 6 (3 archivio + 3 legacy V1) |
| File eliminati            | ~60                          |
| Righe eliminate (Block D) | ~9.659                       |
| ADR aggiornati            | ADR-002 → superseded         |

---

## Prossimi passi (Fase 4+)

1. **Completare snapshot 9m 2025** con BV completo per validare secondary Golden Test
2. **Categorie SP** nel enum `CdgCategory` per attivare `balance-sheet.ts`
3. **Dashboard CDG** avanzata con trend multi-periodo e comparazione budget/consuntivo
4. **Import BV da file** — parser dedicato per bilancio di verifica (oltre all'upload manuale)
5. **Merge su main** quando V2 raggiunge feature parity per BLM
