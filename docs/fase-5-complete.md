# Fase 5 — Budget, Preconsuntivo, IVA V2, Scadenziario Potenziato

## Completamento

Data: 2026-04-22

## Riepilogo Blocchi

### Blocco A — MonthlyBudget

| Commit | Descrizione                                                                     |
| ------ | ------------------------------------------------------------------------------- |
| A1     | Schema `MonthlyBudget` in finflow + migration SQL                               |
| A2     | Parser Excel budget (formato CDG + 12 colonne mensili)                          |
| A3     | Query layer CRUD + 4 API routes (GET, DELETE, POST upload, POST confirm, PATCH) |
| A4     | UI griglia budget controller (17 categorie × 12 mesi) + link anagrafica         |
| A5     | Test parser su Excel BLM (288 righe, 14 categorie matchate)                     |

**Schema**: `finflow.monthly_budget` con unique constraint `(organization_id, year, month, cdg_category)`

**Parser**: Dual-format automatico — rileva CDG Model (colonna annuale → /12) vs 12 colonne mensili. Mappatura codici 100-800 su CdgCategory enum.

### Blocco B — Varianze + Preconsuntivo

| Commit | Descrizione                                              |
| ------ | -------------------------------------------------------- |
| B1     | Engine varianza budget + 15 unit test                    |
| B2     | Query layer + API varianze/preconsuntivo (firm + client) |
| B3     | UI varianze controller + previsione-anno cliente         |

**Engine**: Funzioni pure `computeBudgetVariance()` e `computePreconsuntivo()` in `lib/analysis/budget-variance.ts`. Riutilizza `computeIncomeStatement()` per cascade CE completa.

**Varianza**: Budget YTD vs Consuntivo YTD, varianza assoluta e percentuale, favorabilità per voce CE.

**Preconsuntivo**: Mesi effettivi 1..boundary + budget mesi (boundary+1)..12 = proiezione anno completo.

**UI Client**: Pagina `/previsione-anno` con KPI cards, tabella CE a 3 colonne (Effettivo/Budget/Proiezione), narrative deterministica.

### Blocco C — IVA V2

| Commit | Descrizione                                                                           |
| ------ | ------------------------------------------------------------------------------------- |
| C1     | Schema VatSnapshot enhancement (sourceType, label, surchargeAmount, creditCarriedOut) |
| C2     | Engine IVA V2 + query + API (firm GET/POST, firm PATCH, client GET)                   |
| C3     | UI gestione IVA controller                                                            |

**V2 Adapter**: `normalizeV2VatSources()` mergia movimenti bancari (per cdgCategory → ACTIVE/PASSIVE) con fatture in formato unificato per `calculateVatForYear()`.

**UI**: Tabella periodi con IVA a debito/credito, saldo, riporto, importo da versare, scadenza, stato (Pagata/Da pagare/Scaduta/A credito). Azioni: Ricalcola e Segna pagata.

### Blocco D — F24, Prestiti, Scadenziario

| Commit | Descrizione                                               |
| ------ | --------------------------------------------------------- |
| D1     | ADR-009 + schema F24Schedule/LoanSchedule + migration SQL |
| D2     | API CRUD F24/Loan + scadenziario enhancement (7 fonti)    |
| D3     | Documentazione fase completata                            |

**ADR-009**: Modelli dedicati vs overload ExpectedPayable — campi specifici (codiceTributo, principal/interest), lifecycle diverso, query performance.

**Scadenziario**: Ora aggrega 7 fonti: invoice_active, invoice_passive, recurring_expense, expected_payable, vat, f24, loan. Tutte le nuove fonti try-catch wrapped.

## Nuove Tabelle

| Tabella          | Schema  | Migration                              |
| ---------------- | ------- | -------------------------------------- |
| `monthly_budget` | finflow | `prisma/migration-fase5-budget.sql`    |
| `f24_schedule`   | finflow | `prisma/migration-fase5-f24-loans.sql` |
| `loan_schedule`  | finflow | `prisma/migration-fase5-f24-loans.sql` |

## Colonne Aggiunte

| Tabella            | Colonne                                                  | Migration                        |
| ------------------ | -------------------------------------------------------- | -------------------------------- |
| `fin_vat_snapshot` | source_type, label, surcharge_amount, credit_carried_out | `prisma/migration-fase5-vat.sql` |

## Nuovi ADR

- **ADR-009**: Modelli dedicati F24Schedule e LoanSchedule

## API Routes Aggiunti

### Controller (Firm)

| Route                                         | Metodi        | Descrizione                   |
| --------------------------------------------- | ------------- | ----------------------------- |
| `/api/firm/clients/[id]/budget`               | GET, DELETE   | Lista/cancella budget annuale |
| `/api/firm/clients/[id]/budget/upload`        | POST          | Upload Excel budget           |
| `/api/firm/clients/[id]/budget/confirm`       | POST          | Conferma righe budget         |
| `/api/firm/clients/[id]/budget/[recordId]`    | PATCH         | Edit cella budget             |
| `/api/firm/clients/[id]/budget/varianze`      | GET           | Varianze budget vs consuntivo |
| `/api/firm/clients/[id]/budget/preconsuntivo` | GET           | Preconsuntivo anno            |
| `/api/firm/clients/[id]/iva`                  | GET, POST     | Lista/ricalcola IVA           |
| `/api/firm/clients/[id]/iva/[snapshotId]`     | PATCH         | Segna pagata/riapri           |
| `/api/firm/clients/[id]/f24`                  | GET, POST     | Lista/crea F24                |
| `/api/firm/clients/[id]/f24/[scheduleId]`     | PATCH, DELETE | Edit/cancella F24             |
| `/api/firm/clients/[id]/loans`                | GET, POST     | Lista/crea prestiti           |
| `/api/firm/clients/[id]/loans/[loanId]`       | PATCH, DELETE | Edit/cancella prestiti        |

### Client

| Route                       | Metodi | Descrizione                         |
| --------------------------- | ------ | ----------------------------------- |
| `/api/client/preconsuntivo` | GET    | Preconsuntivo cliente (trustedOnly) |
| `/api/client/iva`           | GET    | IVA cliente (readonly)              |
| `/api/client/scadenze`      | GET    | Scadenziario 7 fonti                |

## Pagine UI

| Pagina                               | Tipo       | Descrizione                      |
| ------------------------------------ | ---------- | -------------------------------- |
| `/firm/clients/[id]/budget`          | Controller | Griglia budget mensile editabile |
| `/firm/clients/[id]/budget/varianze` | Controller | Varianze budget vs consuntivo    |
| `/firm/clients/[id]/iva`             | Controller | Gestione liquidazioni IVA        |
| `/previsione-anno`                   | Client     | Proiezione anno con narrative    |

## File Engine/Analysis

| File                                    | Funzioni                                            |
| --------------------------------------- | --------------------------------------------------- |
| `lib/analysis/budget-variance.ts`       | `computeBudgetVariance()`, `computePreconsuntivo()` |
| `lib/parsers/cdg-budget-parser.ts`      | `parseBudgetExcel()` — dual format                  |
| `lib/vat/vat-engine.ts`                 | `normalizeV2VatSources()` (nuovo)                   |
| `lib/queries/budget.ts`                 | CRUD budget                                         |
| `lib/queries/budget-variance.ts`        | Query varianze + preconsuntivo                      |
| `lib/queries/vat-snapshots.ts`          | `recalculateVatSnapshotsV2()` (nuovo)               |
| `lib/hooks/use-client-preconsuntivo.ts` | React Query hook                                    |

## Test

- 15 unit test per budget variance engine (vitest) — tutti verdi
- Parser testato su Excel BLM: 288 righe, 14 categorie, Revenue=272,345
- TypeScript `tsc --noEmit` clean (esclusi test file pre-esistenti)
