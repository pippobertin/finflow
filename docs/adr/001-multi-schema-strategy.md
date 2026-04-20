# ADR-001: Multi-schema strategy per la coesistenza V1/V2

## Status

accepted

## Context

FinFlow V2 richiede un refactor profondo del modello dati (da invoice-centric a chart-of-accounts-centric). Il progetto Supabase è unico per lo sviluppo; la produzione gira su Vercel con variabili d'ambiente separate. Non esiste un database di sviluppo dedicato — il DB Supabase È l'ambiente dev.

Serviva un modo per far coesistere V1 e V2 durante le fasi 1-3 senza rischio di corruzione dei dati BLM esistenti.

## Decision

Multi-schema nello stesso database PostgreSQL:

- **Schema `public`**: contiene tutte le tabelle V1 con prefisso `fin_*` (23 tabelle). Non viene toccato durante il refactor. È la baseline operativa.
- **Schema `finflow`**: contiene le nuove entità V2 senza prefisso. Vuoto fino alla Fase 1, popolato progressivamente nelle fasi successive.

Prisma configurato con `schemas = ["public", "finflow"]`. Ogni modello usa `@@schema()` esplicito.

V1 e V2 non fanno join cross-schema. I dati migrano da public a finflow con script dedicati, validati su report CSV prima del commit.

## Consequences

**Positive:**

- Zero rischio di toccare dati V1 durante lo sviluppo V2
- Rollback triviale: basta droppare lo schema `finflow`
- Nessun secondo progetto Supabase da mantenere sincronizzato
- Prisma gestisce nativamente multi-schema da v5.9+

**Negative:**

- Il dump di backup deve coprire entrambi gli schema
- I test devono specificare esplicitamente quale schema usano
- A fine Fase 3, la dismissione di `public.fin_*` richiede un'operazione coordinata

**Timeline dismissione `public.fin_*`:**
A fine Fase 3, dopo il golden test BLM (EBITDA 2024: 106.659, utile netto: 101.011), le tabelle dismesse (`fin_payment_event`, `fin_dismissed_match`, `fin_invoice_line`, `fin_connector`) vengono droppate. Le tabelle migrate (`fin_invoice`, `fin_bank_statement`, `fin_recurring_expense`) vengono rinominate/spostate nello schema `finflow`. Richiede backup fresco dello stesso giorno + approvazione esplicita.

**Nota operativa backup:**
Il dump di Fase 0 (`scripts/dump-fin-tables.mjs`) copre schema DDL + dati delle tabelle `fin_*` ma non cattura trigger, RLS policies, sequences o altri oggetti DB. Prima della dismissione di Fase 3, eseguire un backup completo via Supabase Dashboard (tab Database > Backups) o via Supabase CLI (`supabase db dump`) se disponibile. Lo script Node resta utile come backup rapido delle sole tabelle `fin_*`.
