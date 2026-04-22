# ADR-008: Visibilità dati nel workspace cliente

## Status

accepted

## Context

Il workspace cliente mostra dati finanziari (CE riclassificato, indicatori, grafici) derivati dai TrialBalanceSnapshot caricati dal controller. Non tutti gli snapshot contengono dati affidabili: quelli con mapping incompleto o in fase di test producono numeri errati (segni invertiti, categorie mancanti, valori aggregati assurdi).

Mostrare al cliente imprenditore dati sbagliati è peggio che non mostrare nulla: un EBITDA di -329.379 con semaforo "Ottimo" distrugge la credibilità dello strumento. Il cliente non ha il contesto tecnico per distinguere uno snapshot provvisorio da uno validato.

## Decision

### Flag `isTrusted` su TrialBalanceSnapshot

Aggiunta colonna `is_trusted BOOLEAN DEFAULT false` sulla tabella `finflow.trial_balance_snapshot`.

Il flag è impostato dal controller (commercialista) dopo aver completato il mapping del piano dei conti e verificato che i totali del CE riclassificato corrispondono alle attese. Default `false` = invisibile ai clienti.

### Regole di visibilità

| Workspace                | Vede snapshot con isTrusted=false | Vede snapshot con isTrusted=true |
| ------------------------ | --------------------------------- | -------------------------------- |
| Controller (`/firm/*`)   | Sì (tutti)                        | Sì (tutti)                       |
| Cliente (`/dashboard/*`) | **No**                            | Sì                               |

### Implementazione

- `getIncomeStatement()` e `listSnapshots()` accettano `options.trustedOnly?: boolean`
- L'API `/api/client/cdg` passa `trustedOnly: true`
- L'API `/api/firm/clients/[id]/cdg` non passa il flag (vede tutto)
- Se nessuno snapshot trusted esiste, il cliente vede un empty state informativo

### Empty state

Quando non ci sono snapshot trusted, la dashboard mostra:

> "Il commercialista sta preparando i dati della tua azienda. Non appena il bilancio di verifica sarà caricato e validato, qui vedrai la sintesi completa."

Niente numeri a zero, niente numeri errati.

### Migrazione

```sql
ALTER TABLE "finflow"."trial_balance_snapshot"
  ADD COLUMN "is_trusted" BOOLEAN NOT NULL DEFAULT false;
```

Il controller segna manualmente gli snapshot come trusted dopo la validazione (per ora via query SQL, in futuro via bottone UI nella pagina bilanci).

## Consequences

- **Positivo**: il cliente non vede mai dati sbagliati. La credibilità dell'applicazione è preservata.
- **Positivo**: il controller mantiene piena visibilità per il debug e il mapping iterativo.
- **Negativo**: un cliente nuovo non vede nulla finché il controller non valida almeno uno snapshot. Questo è intenzionale: meglio nulla che dati errati.
- **Futuro**: aggiungere un bottone "Conferma e rendi visibile al cliente" nella pagina `/firm/clients/[id]/bilanci` dopo il mapping. Per ora il flag si gestisce a mano (migration SQL o script).
