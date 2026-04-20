# ADR-003: Dual-workspace routing per controller e cliente

## Status

proposed

## Context

V2 introduce due personas con bisogni UI diversi:

- **Controller (commercialista)**: opera su densità alta tipo Excel, con inserimento dati, configurazione piano dei conti, mapping bilancio di verifica, congelamento periodi. Necessita di tabelle dense, form complessi, shortcut da power user.
- **Cliente (imprenditore)**: consuma narrativa e report senza toccare configurazioni. Vede dashboard sintetiche, indicatori con trend, alert, grafici commentati. Non ha accesso a import, mapping, o configurazione avanzata.

L'attuale architettura V1 ha un unico workspace `app/(dashboard)/` che mescola le due esigenze. In V2, separare i flussi riduce il rischio che il cliente veda (o tocchi) funzionalità riservate al controller, e permette di ottimizzare ogni workspace per la sua persona.

## Decision

Introdurre due route group Next.js distinti:

- **`app/(firm)/`** — workspace controller (commercialista). Contiene tutte le route di inserimento, configurazione, import, mapping, congelamento.
- **`app/(client)/`** — workspace cliente (imprenditore). Contiene dashboard narrativa, report, indicatori, alert.

La logica di redirect iniziale sarà basata sull'`userType` dell'utente autenticato: un controller atterra su `/(firm)/dashboard`, un cliente su `/(client)/dashboard`.

L'implementazione effettiva e i dettagli su proxy, permessi e route protette vivranno in un ADR aggiornato o in un ADR dedicato quando Fase 1 partirà.

## Considerazioni di test

<!-- TODO Fase 1: quando cashflow-projection.ts viene modificato per lo scoping
     multi-tenant (scopedQuery), scrivere un test smoke di integrazione minimo:
     - invocare buildDailyProjection con un organizationId reale del DB dev
     - verificare che restituisca un array non vuoto con struttura attesa
       (date in range, campi presenti, totali numerici)
     - NON validare la logica di proiezione (quella va in Fase 3 con unit test)
     - Serve solo a intercettare rotture accidentali delle query interne
       durante l'introduzione del multi-tenant -->

## Consequences

Da dettagliare in Fase 1.
