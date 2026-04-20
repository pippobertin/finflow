# ADR-003: Dual-workspace routing per controller e cliente

## Status

accepted

## Context

V2 introduce due personas con bisogni UI diversi:

- **Controller (commercialista)**: opera su densità alta tipo Excel, con inserimento dati, configurazione piano dei conti, mapping bilancio di verifica, congelamento periodi. Necessita di tabelle dense, form complessi, shortcut da power user.
- **Cliente (imprenditore)**: consuma narrativa e report senza toccare configurazioni. Vede dashboard sintetiche, indicatori con trend, alert, grafici commentati. Non ha accesso a import, mapping, o configurazione avanzata.

L'attuale architettura V1 ha un unico workspace `app/(dashboard)/` che mescola le due esigenze. In V2, separare i flussi riduce il rischio che il cliente veda (o tocchi) funzionalità riservate al controller, e permette di ottimizzare ogni workspace per la sua persona.

## Decision

Due workspace separati con routing basato su `userType`:

- **`app/firm/`** — workspace controller (commercialista). Layout dedicato con `FirmSidebar`, auth guard `getFirmSession()` che verifica `userType === "CONTROLLER"`. Contiene: dashboard, lista clienti, nuovo cliente, anagrafica cliente.
- **`app/(dashboard)/`** — workspace cliente (imprenditore, inalterato da V1). Dashboard narrative, report, indicatori, grafici.

La root page (`app/page.tsx`) legge `session.user.userType` e redirige:

- `CONTROLLER` → `/firm/dashboard`
- altri → `/overview`

Le API controller vivono in `app/api/firm/*` e usano `getFirmSession()` (vedi ADR-004) per scoping multi-tenant.

### Struttura route implementata (Fase 1.3)

```
app/firm/
├── layout.tsx           # CONTROLLER guard + FirmSidebar
├── dashboard/page.tsx   # Server component, stats + lista clienti
└── clients/
    ├── page.tsx         # Client component, ricerca + tabella
    ├── new/page.tsx     # Form creazione organizzazione
    └── [id]/
        └── anagrafica/page.tsx  # Form modifica + conti bancari (read-only)
```

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

- Workspace controller completamente separato — nessun rischio che il cliente veda route `/firm/*`
- Auth guard `getFirmSession()` in ogni API route controller garantisce ownership check
- Il workspace V1 `(dashboard)` resta inalterato, zero rischio di regressioni
- Sidebar controller dedicata (`FirmSidebar`) con navigazione minima (Dashboard, Clienti)
- Pattern estensibile: future pagine controller (import BdV, piano dei conti, congelamento periodi) si aggiungono sotto `app/firm/`
