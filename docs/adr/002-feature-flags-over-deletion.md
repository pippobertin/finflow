# ADR-002: Feature flag per sospensione codice legacy invece di cancellazione

## Status

accepted

## Context

FinFlow V1 contiene codice legacy sostanzioso che in V2 non servirà più nella sua forma attuale:

- **Parser FatturaPA** con estrazione da P7M/CAdES, gestione namespace XML, multi-body lotto, auto-detection direzione attiva/passiva via P.IVA (`lib/parsers/fatturapa-parser.ts`)
- **Connettore FattureInCloud** con autenticazione OAuth, fetch companies, sync bidirezionale fatture (`lib/connectors/fattureincloud.ts`)
- **Reconciliation engine** da 1085 righe con passate multiple (exact match, fuzzy match, pattern-based, multi-invoice), componenti UI correlati, hook, API routes (`lib/reconciliation/reconciliation-engine.ts`, `components/reconciliation/`, `lib/hooks/use-reconciliation.ts`)
- **Test** associati (`lib/parsers/__tests__/fatturapa-parser.test.ts`)

La tentazione tecnica è cancellarlo subito dalla codebase, ma questo genera due rischi operativi:

1. **Rischio di riscrittura**: se durante il refactor delle Fasi 1-3 scopriamo che una porzione di quel codice serve ancora o contiene logica non ovvia da replicare (es. l'algoritmo di fuzzy matching con soglie calibrate sui dati BLM reali, o la gestione P7M che ha edge case scoperti in produzione), dobbiamo riscriverla da zero.
2. **Rischio di manutenzione V1**: `main` resta il ramo V1 in manutenzione per BLM in produzione finché V2 non sostituisce la V1. Il codice deve continuare a funzionare lì e non può scomparire dal branch V2 prima del tempo, altrimenti merge da main verso v2 diventano conflittuali.

## Decision

Il codice legacy viene **sospeso** via feature flag hardcoded in `lib/feature-flags.ts` per tutta la durata delle Fasi 1-3. Tre flag:

```typescript
export const FEATURES = {
  LEGACY_RECONCILIATION: false,
  LEGACY_FATTURAPA_IMPORT: false,
  LEGACY_FATTUREINCLOUD: false,
} as const;
```

**Applicazione stratificata:**

| Layer           | Meccanismo                                                                    | Scope             |
| --------------- | ----------------------------------------------------------------------------- | ----------------- |
| Route di pagina | Proxy Next.js 16 (`proxy.ts`) → redirect a `/overview`                        | `/reconciliation` |
| API handler     | Early return `new Response(null, { status: 404 })` prima di qualsiasi logica  | 11 endpoint       |
| Componenti UI   | Guard condizionale nel genitore che importa (non dentro il componente legacy) | 2 componenti      |
| Test            | `describe.skipIf(!FEATURES.FLAG)` con commento JSDoc                          | 1 test suite      |

**Nessuna override via env var**: i flag governano una transizione architetturale, non feature a rilascio graduale. Esporli come configurazione esterna sarebbe over-engineering — il loro valore cambia solo quando uno sviluppatore modifica il file sorgente, contestualmente a un cambio di fase.

**Cancellazione fisica** dei file sospesi avviene a fine Fase 3, in un commit dedicato, contestualmente al drop delle tabelle DB dismesse (`PaymentEvent`, `DismissedMatch`, `InvoiceLine`, `Connector`) e solo dopo che il golden test BLM ha validato il nuovo motore CDG (EBITDA 2024: 106.659, utile netto: 101.011).

## Consequences

**Positive:**

- Codice recuperabile se durante il refactor scopriamo che serve
- `main` V1 continua a funzionare per BLM in produzione
- Refactor reversibile in caso di problemi: basta riportare i flag a `true`
- I flag offrono un punto di verifica rapido per capire cosa è spento — un `grep FEATURES` mostra tutti i gate

**Negative:**

- La codebase trasporta per diversi mesi codice inattivo che aggiunge rumore alla lettura
- I guard sparsi richiedono disciplina per essere rimossi a fine Fase 3
- Qualsiasi modifica alla sidebar o ad altri file toccati dalla V1 va coordinata con il ramo `main` finché V1 resta attiva

**Note di governance:**

Mantenere in questo ADR l'elenco dei punti del codebase che referenziano i flag (sezione "Lista di gate attivi" in fondo), aggiornandolo a ogni modifica. Così a fine Fase 3 il cleanup è guidato da una lista e non da grep ad hoc.

## Nota tecnica: rename middleware→proxy in Next.js 16

Next.js 16 ha rinominato il file `middleware.ts` in `proxy.ts` e la funzione esportata da `middleware()` a `proxy()`. L'API (`NextRequest`, `NextResponse`, `config.matcher`) resta identica.

La scelta di seguire la nuova convenzione non è una decisione architetturale nostra — è un adeguamento alla versione del framework. Il commento in testa a `proxy.ts` rimanda a questo ADR per contesto. Ref: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.

## Lista di gate attivi

Lista viva — aggiornare ogni volta che si aggiunge o rimuove un guard. A fine Fase 3, questa lista sarà la checklist di cancellazione.

### Definizione flag e routing

| #   | File                   | Tipo                                           |
| --- | ---------------------- | ---------------------------------------------- |
| 1   | `lib/feature-flags.ts` | Definizione flag + `getDisabledRoutes()`       |
| 2   | `proxy.ts`             | Redirect page route disabilitate → `/overview` |

### API routes — early return 404

| #   | File                                        | Handler                  | Flag                      |
| --- | ------------------------------------------- | ------------------------ | ------------------------- |
| 3   | `app/api/reconciliation/route.ts`           | GET, POST                | `LEGACY_RECONCILIATION`   |
| 4   | `app/api/reconciliation/count/route.ts`     | GET                      | `LEGACY_RECONCILIATION`   |
| 5   | `app/api/reconciliation/auto/route.ts`      | POST                     | `LEGACY_RECONCILIATION`   |
| 6   | `app/api/reconciliation/patterns/route.ts`  | GET, POST, PATCH, DELETE | `LEGACY_RECONCILIATION`   |
| 7   | `app/api/import/fatturapa/route.ts`         | POST                     | `LEGACY_FATTURAPA_IMPORT` |
| 8   | `app/api/connectors/route.ts`               | GET, POST                | `LEGACY_FATTUREINCLOUD`   |
| 9   | `app/api/connectors/[id]/route.ts`          | GET, PUT, DELETE         | `LEGACY_FATTUREINCLOUD`   |
| 10  | `app/api/connectors/[id]/sync/route.ts`     | POST                     | `LEGACY_FATTUREINCLOUD`   |
| 11  | `app/api/connectors/[id]/test/route.ts`     | POST                     | `LEGACY_FATTUREINCLOUD`   |
| 12  | `app/api/connectors/fic-companies/route.ts` | POST                     | `LEGACY_FATTUREINCLOUD`   |

### UI guards — rendering condizionale a monte

| #   | File                                            | Cosa nasconde                 | Flag                      |
| --- | ----------------------------------------------- | ----------------------------- | ------------------------- |
| 13  | `app/(dashboard)/import/page.tsx`               | Tab "Fatture XML (FatturaPA)" | `LEGACY_FATTURAPA_IMPORT` |
| 14  | `components/settings/connector-form-dialog.tsx` | Tipo e sezione config FIC     | `LEGACY_FATTUREINCLOUD`   |

### Test — skip condizionale

| #   | File                                             | Meccanismo          | Flag                      |
| --- | ------------------------------------------------ | ------------------- | ------------------------- |
| 15  | `lib/parsers/__tests__/fatturapa-parser.test.ts` | `describe.skipIf()` | `LEGACY_FATTURAPA_IMPORT` |

### Sidebar — rimozione diretta (non guard, codice rimosso)

| #   | File                               | Cosa rimosso                              | Note                                 |
| --- | ---------------------------------- | ----------------------------------------- | ------------------------------------ |
| 16  | `components/dashboard/sidebar.tsx` | Fetch `/api/reconciliation/count` + badge | Commento inline rimanda a questo ADR |
