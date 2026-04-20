# ADR-004: Pattern scopedQuery per multi-tenant

## Status

accepted

## Context

V2 introduce due livelli di scoping:

- **CLIENT_OWNER**: vede solo dati della propria `organizationId` (comportamento V1, già implementato).
- **CONTROLLER**: vede dati di tutte le Organization appartenenti al proprio `accountingFirmId`.

Servono garanzie che nessuna query API dimentichi il filtro tenant.

### Alternative valutate

1. **Prisma Client Extension (`$allModels`)**: intercetta ogni query e inietta il filtro automaticamente. Rifiutata: troppo implicita, difficile da debuggare, rischio di conflitto con `PrismaPg` adapter, e non distingue tra contesto controller/client senza threading manuale del contesto.

2. **Helper wrapper su PrismaClient**: crea un proxy che pre-filtra. Stessi problemi di (1) ma in userland.

3. **Auth guard tipizzato + funzioni query esplicite** (scelta): il guard di autenticazione restituisce il contesto tenant tipizzato, le funzioni query lo accettano come parametro obbligatorio. Il type system impedisce di passare il contesto sbagliato.

## Decision

### Due auth guard separati

- `getAuthSession()` (invariato V1): restituisce `{ organizationId }`. Usato da tutte le route client e dalle route V1 esistenti.
- `getFirmSession()` (nuovo V2): restituisce `{ accountingFirmId }`. Usato dalle route controller in `app/api/firm/`. Rifiuta utenti non-CONTROLLER con 403.

### Convenzione per le nuove query

Le query controller vivono in `lib/queries/firm.ts` e accettano `accountingFirmId` come primo parametro. Le query client esistenti (`lib/queries/*.ts`) restano invariate.

### Enforcement

- **Compile-time**: i return type dei due guard sono distinti (`ClientAuthResult` vs `FirmAuthResult`). Passare `accountingFirmId` dove serve `organizationId` o viceversa è un errore di tipo.
- **Runtime**: `getFirmSession()` verifica `userType === "CONTROLLER"` e presenza di `accountingFirmId`, altrimenti 403.
- **Convention**: le API route in `app/api/firm/` usano `getFirmSession()`, tutte le altre usano `getAuthSession()`. Una lint rule potrà enforcare questo in futuro.

## Consequences

- Zero modifiche alle 35+ API route esistenti (backward compatible).
- Le nuove route controller hanno un guard dedicato che rende impossibile dimenticare lo scoping.
- Il costo è avere due guard separati, ma la chiarezza supera la duplicazione minima.
- In Fase 3, quando le query V1 verranno refactorate, si potrà eventualmente unificare i guard in un singolo `getSession()` polimorfico, ma non è necessario ora.
