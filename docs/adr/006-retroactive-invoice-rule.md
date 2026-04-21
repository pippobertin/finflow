# ADR-006: Regola fatture retroattive in periodo congelato

## Status

accepted

## Context

Dopo che un periodo e' stato congelato (ADR-005), possono arrivare fatture con data nel periodo congelato (es. una fattura datata marzo ricevuta ad aprile, dopo il freeze del Q1). Queste fatture non possono essere ignorate ma non devono alterare i dati gia' congelati.

### Alternative valutate

1. **Rifiutare l'inserimento**: la fattura con data in periodo frozen non puo' essere creata. Rifiutata: impraticabile, le fatture arrivano quando arrivano.

2. **Inserire con warning visivo**: la fattura viene creata normalmente ma con un badge "retroattiva" visibile. Il CdG del periodo congelato non viene ricalcolato. Rifiutata come standalone: non e' chiaro dove finisce la fattura nel CdG.

3. **Inserire e attribuire al primo periodo aperto** (scelta): la fattura viene creata con la sua data originale (`date`), ma ai fini del CdG viene attribuita al primo periodo non congelato. Un campo `cdgPeriodOverride` (futuro, se necessario) puo' tracciare questa riattribuzione. Per ora, la logica e' puramente applicativa nel calcolo CdG: "se il periodo della fattura e' frozen, attribuisci al periodo corrente".

## Decision

### Comportamento inserimento

- Una fattura con `issueDate` che cade in un periodo congelato viene inserita normalmente in `fin_invoice` con `is_frozen = false` (e' un record nuovo, non congelato).
- **Il campo `date` (issueDate) non viene mai modificato.** La fattura conserva la sua data contabile originale (es. 15/09/2025).
- La fattura entra nel cashflow come dato informativo (il cashflow usa le date reali).
- La fattura **non** contribuisce al CE riclassificato del periodo chiuso. Il CE di quel periodo e' alimentato esclusivamente dal bilancio di verifica caricato, non dalla somma delle fatture.

### Distinzione CE vs cashflow

- **CE riclassificato** (Fase 3): alimentato dal bilancio di verifica. Le fatture retroattive vengono escluse dal CE del periodo chiuso ed incluse nel CE del primo periodo aperto. Questa logica verra' implementata nel motore di riclassificazione.
- **Cashflow**: usa le date reali delle fatture. Una fattura retroattiva appare nella posizione corretta del cashflow indipendentemente dallo stato frozen del periodo.

### UI

- La fattura appare nella lista con la sua data originale e un badge "Retroattiva" (arancione).
- Nel report CdG del periodo corrente, appare in una sezione "Competenze di periodi precedenti" con la fattura e la sua data originale.

### Nessun campo aggiuntivo nel DB

Per ora non serve un campo `cdgPeriodOverride` nel DB. La logica di esclusione dal CE e' calcolata a runtime nel motore di riclassificazione (Fase 3) verificando se il periodo della data fattura e' frozen. Se in futuro servira' persistere questa informazione (es. per performance o audit), si aggiungera' il campo.

## Consequences

- La contabilita' del periodo congelato resta immutabile.
- Le fatture retroattive non vengono perse, vengono spostate nel CdG del periodo corrente.
- L'utente ha visibilita' chiara su quali fatture sono retroattive.
- Il calcolo CdG deve verificare lo stato frozen del periodo, aggiungendo una query ma con impatto minimo (il check e' gia' disponibile via `is_frozen` sui record).
- In futuro, una vista "rettifiche di periodo" potra' aggregare tutte le fatture retroattive per periodo di origine.
