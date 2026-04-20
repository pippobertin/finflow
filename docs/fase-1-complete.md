# Fase 1 — Report finale (Checkpoint 3)

## Commit chain

| #   | Hash      | Messaggio                                                        |
| --- | --------- | ---------------------------------------------------------------- |
| 1.1 | `41e51d8` | Schema Prisma multi-tenant + migration SQL applicata             |
| 1.2 | `50e02a0` | ADR-004 scoped query + NextAuth V2 fields + getFirmSession guard |
| 1.3 | `bc17ff3` | Dual-workspace routing + 4 pagine controller minime              |
| 1.4 | `d02eaba` | Script idempotente migrazione dati BLM (eseguito su DB dev)      |

Branch: `v2/cdg-integration` — 4 commit non pushati.

## Checklist di verifica

| Check                                                              | Stato |
| ------------------------------------------------------------------ | ----- |
| `tsc --noEmit` pulito                                              | OK    |
| `vitest run` — 39 passed, 15 skipped, 0 failed                     | OK    |
| Login admin@blmproject.com → redirect `/firm/dashboard`            | OK    |
| Dashboard mostra "BLM Project Srl" come unico cliente              | OK    |
| Link anagrafica `/firm/clients/<id>/anagrafica` carica (HTTP 200)  | OK    |
| API `/api/firm/clients` restituisce 1 org con 543 fatture, 1 conto | OK    |
| DB: `accounting_firm` ha 1 riga "Studio BLM"                       | OK    |
| DB: `fin_organization` ha `accounting_firm_id` popolato            | OK    |
| DB: admin → `user_type=CONTROLLER`, `accounting_firm_id` popolato  | OK    |
| DB: viewer → `user_type=CLIENT_OWNER`, `accounting_firm_id=NULL`   | OK    |
| ADR-003 aggiornato ad "accepted" con struttura route               | OK    |
| ADR-004 creato (scoped query pattern)                              | OK    |
| Script migrazione idempotente (dry-run default, --apply)           | OK    |

## Cosa è stato fatto

### Schema Prisma (Fase 1.1)

- Enum `UserType` (CONTROLLER, CLIENT_OWNER, CLIENT_ADMIN_BANK_ONLY)
- Enum `CdgGranularity` (MONTHLY, QUARTERLY)
- Model `AccountingFirm` in schema `finflow` (con relation a Organization, User, ClientGroup)
- Model `ClientGroup` in schema `finflow`
- Colonne V2 su `Organization`: `accountingFirmId`, `clientGroupId`, `cdgGranularity`
- Colonne V2 su `User`: `userType`, `accountingFirmId`
- FK cross-schema `public` → `finflow` verificate funzionanti
- Migration SQL generata con `prisma migrate diff` (workaround per P4002)

### Auth e scoping (Fase 1.2)

- NextAuth callbacks (authorize, jwt, session) propagano `userType`, `accountingFirmId`, `clientGroupId`
- `getFirmSession()` — guard per API controller: verifica `userType === "CONTROLLER"` e presenza di `accountingFirmId`
- `lib/queries/firm.ts` — 5 funzioni scoped: `listFirmOrganizations`, `getFirmOrganization`, `getFirmStats`, `createFirmOrganization`, `updateFirmOrganization`

### Dual-workspace routing (Fase 1.3)

- Root page (`app/page.tsx`) redirige per `userType`
- Login redirige a `/` (hub) invece che direttamente a `/overview`
- Layout firm (`app/firm/layout.tsx`) con guard CONTROLLER
- Sidebar controller (`components/firm/firm-sidebar.tsx`)
- 3 API routes: `/api/firm/stats`, `/api/firm/clients`, `/api/firm/clients/[id]`
- 4 pagine: dashboard (server), clients (client + search), new (form), anagrafica (form + bank accounts read-only)

### Migrazione dati BLM (Fase 1.4)

- Script `scripts/migrate-blm-v2.ts` — idempotente, dry-run default
- "Studio BLM" creato come AccountingFirm
- "BLM Project Srl" agganciata via `accountingFirmId`
- admin@blmproject.com → CONTROLLER + accountingFirmId
- viewer@blmproject.com → CLIENT_OWNER (senza link firm)
- VAT corretto: `IT02652950425` (non il placeholder del seed template)

## Anomalie note

### P4002 Prisma introspection (tech debt)

`prisma migrate dev` fallisce con P4002 perché il DB contiene `finflow.scadenze_bandi_documenti_formazione` che referenzia `auth.users` (tabella di un altro progetto). Workaround: `prisma migrate diff --from-schema --to-schema --script`. Da risolvere quando si pulisce lo schema finflow da tabelle legacy non-FinFlow.

### Button `asChild` non supportato

Il componente Button di questo progetto usa `@base-ui/react/button` che non espone `asChild`. Pattern corretto: `<Link className={buttonVariants({ variant, size })}>`. Corretto in tutte le pagine firm.

## TODO aperti per Fase 2

- [ ] Conti bancari in anagrafica: attualmente read-only, in Fase 2 serve CRUD
- [ ] `ClientGroup` non ancora usato — nessuna UI per creare/assegnare gruppi
- [ ] Cashflow smoke test (annotato in ADR-003) per verifica non-regressione dopo scoping
- [ ] Import bilancio di verifica (xlsx installato in 0.7, parser da scrivere)
- [ ] Mapping piano dei conti → categorie CdG
- [ ] Feature flag `LEGACY_RECONCILIATION` ancora false — da riattivare quando riconciliazione V2 è pronta
- [ ] Pulizia tabelle non-FinFlow dallo schema `finflow` (tech debt P4002)

## Golden test BLM

Login `admin@blmproject.com` / `Password123!` → `/firm/dashboard` → "BLM Project Srl" (543 fatture, 723 movimenti, 1 conto) → click → `/firm/clients/<id>/anagrafica` con dati editabili. **VERIFIED.**
