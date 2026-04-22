# ADR-009: Modelli dedicati per F24 e Rate Finanziamento

## Status

accepted

## Context

Lo scadenziario FinFlow aggrega attualmente 5 fonti: fatture attive/passive (da Invoice), pagamenti attesi (da ExpectedPayable), rate IVA (da VatSnapshot). Due ulteriori fonti ricorrenti — versamenti F24 (imposte e contributi) e rate di finanziamento — sono necessarie per completare il quadro degli impegni finanziari.

Si è valutato se estendere il modello ExpectedPayable con campi opzionali (codiceTributo, principal, interest) oppure creare modelli dedicati.

## Decision

### Modelli dedicati: F24Schedule e LoanSchedule

**F24Schedule** — Scadenze fiscali periodiche (F24):

- `periodLabel`: etichetta periodo ("Gennaio 2026", "Acconto IRPEF")
- `codiceTributo`: codice tributo opzionale (es. "2001", "3800")
- `amount`: importo da versare
- `dueDate`: data scadenza
- `isPaid` / `paidDate`: stato pagamento

**LoanSchedule** — Piano rate finanziamenti:

- `loanName`: nome del finanziamento
- `bankName`: banca erogante
- `totalAmount`: importo totale
- `installment`: rata periodica
- `principal` / `interest`: quota capitale e interessi (opzionali)
- `frequency`: periodicità (MONTHLY default)
- `startDate` / `endDate`: finestra temporale
- `dayOfMonth`: giorno del mese per la rata

### Rationale

1. **Campi specifici**: F24 ha codice tributo; prestiti hanno split capitale/interessi, frequenza, durata. Questi campi non hanno senso in ExpectedPayable.
2. **Lifecycle diverso**: F24 sono inseriti manualmente dal controller per periodo; le rate sono generate automaticamente dalla definizione del prestito.
3. **Query performance**: lo scadenziario filtra per tipo di fonte. Modelli separati evitano WHERE complessi.
4. **Coerenza**: segue il pattern di VatSnapshot (modello dedicato per IVA).

### Integrazione nello scadenziario

Il route `app/api/client/scadenze/route.ts` aggrega tutte le fonti. F24 e Loan vengono espansi come item con `type: "f24"` e `type: "loan"` rispettivamente. Wrappati in try-catch per gestire il caso tabella mancante (identico al pattern VatSnapshot).

## Consequences

- Due nuove tabelle: `finflow.f24_schedule`, `finflow.loan_schedule`
- FK verso `public.fin_organization` (cross-schema, pattern collaudato)
- Lo scadenziario supporta 7 fonti totali: invoice_active, invoice_passive, expected_payable, vat, f24, loan
- Il controller gestisce F24 e prestiti da pagine dedicate
