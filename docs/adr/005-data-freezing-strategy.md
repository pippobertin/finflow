# ADR-005: Strategia di congelamento dati (data freezing)

## Status

accepted

## Context

Il controller carica un bilancio di verifica relativo a un periodo chiuso (es. Q3 2025). Una volta confermato, i dati contabili sottostanti (fatture, movimenti bancari, spese) di quel periodo non devono essere modificabili dall'utente CLIENT_OWNER, altrimenti i numeri del CdG perdono coerenza con la contabilita' generale.

### Alternative valutate

1. **Snapshot immutabile (copia dati)**: al momento del freeze, copiare tutti i dati del periodo in tabelle shadow. Rifiutata: duplica storage, complica le query, e il dato originale resta comunque editabile.

2. **Soft-lock a livello di periodo (tabella periodi bloccati)**: una tabella `frozen_period(org_id, start, end)` e un check applicativo su ogni write. Rifiutata: richiede join su ogni operazione di scrittura e non impedisce modifiche dirette via SQL admin.

3. **Flag `is_frozen` per record** (scelta): ogni record ha un Boolean `is_frozen`. Al freeze, un batch UPDATE imposta `is_frozen = true` su tutti i record del periodo. Le API rifiutano PUT/PATCH/DELETE su record frozen con HTTP 423 Locked. Semplice, esplicito, verificabile.

## Decision

### Colonna is_frozen

Aggiunta `is_frozen BOOLEAN DEFAULT false` a 4 tabelle V1: `fin_invoice`, `fin_recurring_expense`, `fin_one_off_expense`, `fin_bank_statement`.

### Semantica

- `is_frozen = NULL` o `false`: record editabile normalmente.
- `is_frozen = true`: record bloccato. Le API restituiscono 423 Locked su tentativi di modifica o cancellazione. L'utente CLIENT_OWNER vede un indicatore visivo (lucchetto) e i form sono disabilitati.

### Chi puo' congelare

Solo il CONTROLLER, tramite l'azione "Conferma periodo" dopo l'upload del bilancio di verifica. Il freeze e' un batch operation che:

1. Seleziona tutti i record con data nel range `[periodStart, periodEnd]` per l'organizzazione.
2. Imposta `is_frozen = true` in una singola transazione.
3. Imposta `isLocked = true` sullo snapshot del bilancio di verifica.

### Chi puo' scongelare

Solo il CONTROLLER, tramite azione esplicita "Sblocca periodo". Lo sblocco rimuove `is_frozen` dai record del periodo e `isLocked` dallo snapshot. Operazione auditata.

### Enforcement

- **API layer**: middleware/guard che verifica `is_frozen` prima di permettere UPDATE/DELETE. Restituisce `{ status: 423, error: "Record congelato" }`.
- **UI layer**: form in read-only mode quando `is_frozen = true`, badge lucchetto sulla riga.
- **Non a livello DB**: nessun trigger o constraint PostgreSQL, il costo di manutenzione non giustifica il beneficio per un'app single-write-path.

## Consequences

- Il freeze e' granulare per record, non per periodo. Questo permette flessibilita' (es. congelare solo le fatture ma non i movimenti bancari di un periodo).
- Il CONTROLLER puo' sempre sbloccare, quindi non c'e' rischio di lock-in accidentale.
- Le query di lettura non sono impattate (nessun overhead).
- In futuro, se servira' un audit log, basta aggiungere `frozenAt`/`frozenBy` alle tabelle.
