# Fase 2 — Report finale (Checkpoint C)

Data chiusura: 21 aprile 2026

## Commit chain

| #   | Hash      | Messaggio                                                                      |
| --- | --------- | ------------------------------------------------------------------------------ |
| 2.1 | `761b0fb` | Schema Prisma TrialBalance + mapping piano dei conti + is_frozen su tabelle V1 |
| 2.2 | `88321f0` | ADR-005/006 freezing + parser bilancio di verifica con 13 test                 |
| 2.3 | `78b8427` | API routes bilanci/mapping + 3 pagine controller + query scoped                |
| 2.4 | `c59d986` | frozen-guard helper + freeze/unfreeze API + 423 su 4 route V1                  |
| 2.5 | `0c6df76` | Guida test upload manuale + validazione programmatic parser su file BLM reale  |
| 2.6 | (questo)  | Chiusura Fase 2 — report e documento di stato                                  |

Branch: `v2/cdg-integration` — tutti pushati.

## Checklist di verifica

| Check                                                                         | Stato |
| ----------------------------------------------------------------------------- | ----- |
| `tsc --noEmit` pulito                                                         | OK    |
| `vitest run` — 52 passed, 15 skipped, 0 failed                                | OK    |
| Schema Prisma: enum `cdg_category` in schema `finflow`                        | OK    |
| Schema Prisma: 3 tabelle create in `finflow`                                  | OK    |
| Schema Prisma: `is_frozen` su 4 tabelle V1                                    | OK    |
| Migration SQL applicata con `prisma db execute`                               | OK    |
| Parser BLM reale: 45 conti, Dare 171.187, Avere 165.878                       | OK    |
| API routes bilanci: GET list, POST upload, GET detail, DELETE                 | OK    |
| API routes mapping: GET list, PUT bulk upsert                                 | OK    |
| API freeze/unfreeze: POST congela, DELETE scongela                            | OK    |
| Frozen guard su 4 route V1 (423 Locked)                                       | OK    |
| Pagina bilanci: lista, upload wizard, badge stato                             | OK    |
| Pagina mapping: dropdown 17 categorie, checkbox IVA, salva dirty-only         | OK    |
| Test manuale utente: upload + mapping + persistenza + freeze                  | OK    |
| ADR-005 (freezing strategy) scritto e accepted                                | OK    |
| ADR-006 (fatture retroattive) scritto, chiarito (interpretazione A), accepted | OK    |
| Git push                                                                      | OK    |

## Stato DB dopo test manuale

| Entita                         | Count |
| ------------------------------ | ----- |
| `trial_balance_snapshot`       | 1     |
| `trial_balance_line`           | 45    |
| `chart_of_accounts_mapping`    | 17    |
| `fin_invoice` frozen           | 233   |
| `fin_bank_statement` frozen    | 153   |
| `fin_recurring_expense` frozen | 5     |
| `fin_one_off_expense` frozen   | 0     |

L'utente ha caricato il BV settembre 2025, mappato 17 conti a categorie CdG, e confermato il periodo (freeze) congelando 233 fatture + 153 movimenti bancari + 5 spese ricorrenti nel range gen-set 2025.

## Cosa e' stato fatto

### Schema Prisma (Fase 2.1)

- Enum `CdgCategory` con 17 valori in schema `finflow` (senza prefisso `fin_`, coerente con la convenzione V2)
- Model `TrialBalanceSnapshot` in `finflow`: period start/end, uploaded_by, source_filename, is_locked, created_at, updated_at
- Model `TrialBalanceLine` in `finflow`: account_code, account_name, debit/credit/balance (DECIMAL 15,2), cdg_category (nullable FK a enum)
- Model `ChartOfAccountsMapping` in `finflow`: UNIQUE(organization_id, account_code), cdg_category (NOT NULL), is_vatable, vat_rate
- Colonna `is_frozen BOOLEAN DEFAULT false` aggiunta a `fin_invoice`, `fin_bank_statement`, `fin_recurring_expense`, `fin_one_off_expense`
- Migration SQL generata con `prisma migrate diff` (workaround P4002), applicata con `prisma db execute`
- Correzione pre-applicazione: enum spostato da `public` a `finflow`, rimosso prefisso `fin_`

### ADR (Fase 2.2)

- **ADR-005**: strategia freezing — flag `is_frozen` per record, batch update su freeze, 423 Locked su mutazioni, CONTROLLER-only freeze/unfreeze
- **ADR-006**: fatture retroattive — `issueDate` mai modificata, fattura esclusa dal CE del periodo chiuso, inclusa nel CE del primo periodo aperto. Distinzione CE vs cashflow esplicitata.

### Parser Excel (Fase 2.2)

- `lib/parsers/cdg-trial-balance-parser.ts` — SheetJS, colonne A (codice), C (descrizione), D (dare), E (avere)
- Filtro per account code regex `^\d{2}\.\d{2}\.\d{2}$`
- Gestisce numeri con spazi (migliaia), formato italiano `1.234,56`, celle formula
- 13 test vitest: basic parsing, row filtering, number parsing, custom sheet, error handling, integrazione file BLM reale
- Test programmatic su file BLM: 45 conti, 90 warnings (conti a zero), totali verificati

### API routes (Fase 2.3)

- `POST /api/firm/clients/[id]/bilanci` — upload Excel via FormData, parse, crea snapshot + lines
- `GET /api/firm/clients/[id]/bilanci` — lista snapshots con uploadedBy e \_count
- `GET /api/firm/clients/[id]/bilanci/[snapshotId]` — dettaglio con lines
- `DELETE /api/firm/clients/[id]/bilanci/[snapshotId]` — elimina (423 se locked)
- `GET /api/firm/clients/[id]/mapping` — lista mappings
- `PUT /api/firm/clients/[id]/mapping` — bulk upsert mappings (transaction)
- Query functions aggiunte a `lib/queries/firm.ts`: listFirmSnapshots, getFirmSnapshot, createFirmSnapshot, deleteFirmSnapshot, listFirmMappings, upsertFirmMappings

### Freezing (Fase 2.4)

- `POST /api/firm/clients/[id]/bilanci/[snapshotId]/freeze` — congela periodo (batch UPDATE su 4 tabelle + lock snapshot)
- `DELETE /api/firm/clients/[id]/bilanci/[snapshotId]/freeze` — scongela periodo
- `lib/helpers/frozen-guard.ts` — `checkFrozen(model, id, orgId)` e `checkBulkFrozen(model, ids, orgId)` riutilizzabili
- Guard applicato a 4 route V1: `invoices/[id]` PATCH/DELETE, `bank-statements/[id]` PATCH, `expenses/recurring/[id]` PUT/DELETE, `expenses/one-off/[id]` PUT/DELETE

### Pagine controller (Fase 2.3, 2.4)

- `/firm/clients/[id]/bilanci` — lista snapshots, badge Confermato/Bozza, azioni freeze/unfreeze/elimina
- `/firm/clients/[id]/bilanci/upload` — wizard upload con periodo, sheet name, note, drag-to-upload
- `/firm/clients/[id]/mapping` — editor mapping con dropdown 17 categorie CdG, checkbox IVA, conteggio dirty, salvataggio batch
- Link "Bilanci di verifica" aggiunto alla pagina anagrafica

## Golden Test — stato a fine Fase 2

Il CE riclassificato **non e' ancora calcolato** — e' obiettivo di Fase 3. I dati di input sono pronti:

- Bilancio di verifica BLM 9 mesi 2025 caricato: 45 conti con importo
- 17 conti mappati a categorie CdG dall'utente
- Meccanismo freeze operativo (233 fatture + 153 movimenti congelati)

Il golden test obiettivo resta: **EBITDA 2024 pari a 106.659 +/- 2%** su bilancio BLM 2024 (da caricare in Fase 3 prima del test). Il BV 2024 sara' caricato dal file Excel del commercialista, il motore di riclassificazione aggreghera' i saldi per categoria CdG e calcolera' l'EBITDA.

## Bug noti e tech debt

### P4002 Prisma introspection (ereditato da Fase 0)

`prisma migrate dev` fallisce perche' il DB contiene `finflow.scadenze_bandi_documenti_formazione` che referenzia `auth.users`. Workaround consolidato: `prisma migrate diff --from-schema --to-schema --script`. Da risolvere quando si pulisce lo schema finflow da tabelle legacy non-FinFlow.

### Shell expansion `!` in reset-password.ts (risolto in Fase 1)

Script `scripts/reset-password.ts` ha guard `compareSync` pre-scrittura. Il bug e' documentato in `docs/fase-1-complete.md`.

### Bulk operations non guardate da frozen-guard

Le route bulk (`bulk-delete`, `bulk-status`, `reconciliation`) non hanno ancora il frozen-guard. Le singole route [id] sono guardate (PATCH/PUT/DELETE). Le bulk vanno protette in Fase 3 o al bisogno.

### isItalianHoliday — Pasqua non riconosciuta

La funzione `isItalianHoliday` nel modulo VAT non calcola la Domenica di Pasqua (e il Lunedi dell'Angelo). Usa solo festivita' a data fissa. Non impatta il CdG ma e' un debito tecnico per il calcolo scadenze IVA.

## TODO aperti per Fase 3

- [ ] Motore CE riclassificato: aggrega saldi BV per categoria CdG → margine contribuzione, EBITDA, EBIT, utile netto
- [ ] Motore stato patrimoniale (se richiesto)
- [ ] Batteria indicatori finanziari (ROE, ROI, ROS, indice liquidita', ecc.)
- [ ] Scorporo IVA automatico su righe BV
- [ ] Proiezione cashflow su nuovo paradigma (saldi BV + fatture non frozen)
- [ ] Migrazione Invoice light (riduzione campi)
- [ ] Semplificazione BankStatement
- [ ] Categorizzazione movimenti bancari
- [ ] Drop tabelle legacy a fine fase
- [ ] Protezione frozen-guard sulle route bulk
- [ ] Caricamento BV 2024 per golden test EBITDA
- [ ] Completamento mapping conti (17 su 45 mappati, i restanti 28 vanno mappati prima del calcolo CE)
- [ ] Fix isItalianHoliday per Pasqua (tech debt)
- [ ] Pulizia tabelle non-FinFlow dallo schema `finflow` (tech debt P4002)
