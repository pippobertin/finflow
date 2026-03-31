# Riconciliazione V2 — Istruzioni Implementazione

> Questo file contiene il piano approvato per migliorare il motore di riconciliazione.
> Per avviare: "Implementa le modifiche descritte in RECONCILIATION-V2.md, partendo dalla Fase 1"

---

## Problema

La riconciliazione attuale (`lib/reconciliation/reconciliation-engine.ts`) ha 4 difetti:

1. **Regex rotte**: `extractCounterpartFromDescription` richiede "DA " (2+ spazi) ma le banche italiane reali usano "DA:" (con due punti). Esempio reale dall'EC dell'utente: `BONIFICO A VOSTRO FAVORE BONIFICO SEPA DA: SINSERVICE SRL PER: FATTURA NUM.59 DEL 15/01/2025`. Il pattern attuale non estrae nulla.
2. **`extractInvoiceRefs`** non matcha "FATTURA NUM.59" perché il regex gestisce solo "N." non "NUM."
3. **Pass 2** propone match al 45% basati solo sull'importo — quasi tutti sbagliati.
4. **Nessun match spese ricorrenti**: commissioni bancarie, canoni, mutui restano non riconciliati.
5. **Pattern hardcoded**: non SaaS-ready. Serve un sistema dove l'utente può insegnare i pattern della propria banca.

---

## Fase 1 — Fix Regex + Demote Pass 2

### 1.1 Fix `extractCounterpartFromDescription`

**File**: `lib/reconciliation/reconciliation-engine.ts` righe 59-73

Sostituire i 3 pattern con 7, accettando anche `customPatterns?: RegExp[]` come primo parametro opzionale:

```typescript
function extractCounterpartFromDescription(
  description: string,
  customPatterns?: RegExp[],
): string | null {
  // Custom patterns first
  if (customPatterns) {
    for (const re of customPatterns) {
      const match = description.match(re);
      if (match && match[1]?.trim().length > 2) return match[1].trim();
    }
  }

  const BUILTIN: RegExp[] = [
    /\bDA:\s*(.+?)\s+PER:/i, // "DA: NAME PER:" (Intesa, BPM)
    /\bDA\s{2,}(.+?)\s{1,}PER\b/i, // "DA  NAME PER" (UniCredit)
    /\bDA\s{2,}(.+?)\s{1,}(?:TRN|$)/i, // "DA  NAME TRN..." o fine stringa
    /\bA[:\s]\s*(.{4,}?)\s+(?:PER|TRN)\b/i, // "A: NAME PER:" (uscite)
    /SDD\s+da\s+IT\w+\s+(?:DLL\s+)?(.+?)\s+mandato/i, // SEPA DD
    /\bORD(?:INANTE)?:\s*(.+?)(?:\s+(?:BEN|PER|TRN)|$)/i, // "ORD: NAME"
    /\bBEN(?:EFICIARIO)?:\s*(.+?)(?:\s+(?:PER|TRN|CAUS)|$)/i, // "BEN: NAME"
  ];

  for (const re of BUILTIN) {
    const match = description.match(re);
    if (match && match[1]?.trim().length > 2) return match[1].trim();
  }
  return null;
}
```

### 1.2 Fix `extractInvoiceRefs`

**File**: `lib/reconciliation/reconciliation-engine.ts` righe 83-92

Cambiare il regex da:

```
/\bF(?:ATT(?:URA)?|TT?)\.?\s*(?:N\.?\s*)?(\d+)/gi
```

a:

```
/\bF(?:ATT(?:URA)?|TT?)\.?\s*(?:N(?:UM|R)?\.?\s*)?(\d+)/gi
```

Aggiungere anche supporto `customPatterns?: RegExp[]` (stessa logica di 1.1).

### 1.3 Boost Pass 1 con invoice ref

**File**: `lib/reconciliation/reconciliation-engine.ts`, dentro `matchDirection`, Pass 1

Attualmente Pass 1 usa solo `counterpartScore`. Aggiungere:

- Estrarre `invoiceRefs` dalla descrizione del movimento
- Per ogni fattura candidata, verificare se `matchesInvoiceNumber(inv.number, refs)`
- Se match fattura trovato → score += 0.5
- Condizione di accettazione: `score >= 0.3 OR invoiceRefMatch`
- Confidenza: se invoiceRefMatch → 95, altrimenti `min(100, score * 100 + 30)`

### 1.4 Demote Pass 2

**File**: `lib/reconciliation/reconciliation-engine.ts` righe 484-512

- Confidenza: 45 → 25
- Aggiungere esclusione keyword non-fattura:

```typescript
const NON_INVOICE_KEYWORDS = [
  "commissione",
  "commissioni",
  "canone",
  "imposta",
  "bollo",
  "interessi",
  "rata mutuo",
  "competenze",
  "spese tenuta",
  "tassa",
  "addebito",
  "recupero spese",
  "f24",
  "tribut",
  "stipend",
  "salari",
  "contribut",
];
// Se bsDescription.toLowerCase() contiene una di queste → skip Pass 2
```

---

## Fase 2 — Schema + RecurringExpense Matching

### 2.1 Schema Prisma

**File**: `prisma/schema.prisma`

**BankStatement** — aggiungere 2 campi + 1 relazione:

```prisma
reconciledExpenseId   String?  @map("reconciled_expense_id")
reconciledType        String?  @map("reconciled_type")  // "INVOICE" | "EXPENSE" | "IGNORED"

reconciledExpense RecurringExpense? @relation(fields: [reconciledExpenseId], references: [id], onUpdate: NoAction, map: "fk_bank_statement_expense")
```

**RecurringExpense** — aggiungere relazione inversa:

```prisma
bankStatements BankStatement[]
```

**BankProfile** — aggiungere:

```prisma
descriptionPatterns Json? @map("description_patterns")
```

### 2.2 Migration SQL

**Nuovo file**: `prisma/migration-reconciliation-v2.sql`

```sql
-- Reconciliation V2 Migration — eseguire su Supabase SQL Editor

ALTER TABLE public.fin_bank_profile
  ADD COLUMN IF NOT EXISTS description_patterns JSONB;

ALTER TABLE public.fin_bank_statement
  ADD COLUMN IF NOT EXISTS reconciled_expense_id TEXT
    REFERENCES public.fin_recurring_expense(id) ON UPDATE NO ACTION,
  ADD COLUMN IF NOT EXISTS reconciled_type TEXT;

-- Backfill reconciledType per dati esistenti
UPDATE public.fin_bank_statement
  SET reconciled_type = CASE
    WHEN reconciled_invoice_id IS NOT NULL THEN 'INVOICE'
    WHEN is_reconciled = true THEN 'IGNORED'
    ELSE NULL
  END
  WHERE is_reconciled = true AND reconciled_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_bank_statement_expense
  ON public.fin_bank_statement(reconciled_expense_id)
  WHERE reconciled_expense_id IS NOT NULL;
```

Dopo la migration: `npx prisma generate` + restart dev server.

### 2.3 Pattern Loader

**File**: `lib/reconciliation/reconciliation-engine.ts` — nuova funzione in cima

```typescript
interface DescriptionPatterns {
  counterpartPatterns: Array<{ label: string; regex: string; flags?: string; sample: string }>;
  invoiceRefPatterns: Array<{ label: string; regex: string; flags?: string; sample: string }>;
}

async function loadCustomPatterns(organizationId: string): Promise<{
  counterpartPatterns: RegExp[];
  invoiceRefPatterns: RegExp[];
}> {
  const profiles = await prisma.bankProfile.findMany({
    where: { bankAccount: { organizationId }, descriptionPatterns: { not: null } },
    select: { descriptionPatterns: true },
  });
  const cp: RegExp[] = [],
    ip: RegExp[] = [];
  for (const p of profiles) {
    const dp = p.descriptionPatterns as DescriptionPatterns | null;
    if (!dp) continue;
    for (const r of dp.counterpartPatterns ?? []) {
      try {
        cp.push(new RegExp(r.regex, r.flags ?? "i"));
      } catch {}
    }
    for (const r of dp.invoiceRefPatterns ?? []) {
      try {
        ip.push(new RegExp(r.regex, r.flags ?? "gi"));
      } catch {}
    }
  }
  return { counterpartPatterns: cp, invoiceRefPatterns: ip };
}
```

Chiamare `loadCustomPatterns(organizationId)` all'inizio di `findMatchesEnhanced` e passare i risultati a `extractCounterpartFromDescription` e `extractInvoiceRefs`.

### 2.4 Nuovo Pass 1.5: RecurringExpense matching

**File**: `lib/reconciliation/reconciliation-engine.ts`, dentro `matchDirection`, dopo Pass 1

Solo per outflow (importi negativi):

1. Query `RecurringExpense` dell'org
2. Per ogni movimento non matchato: confrontare importo (±5%) + `counterpartScore(bs.description, expense.counterpart ?? expense.name)` >= 0.4
3. Match type: `"expense"`, pass: `1.5`, confidenza: `min(100, score*100+20)`

Estendere `EnhancedMatch`:

```typescript
export interface EnhancedMatch {
  // ...campi esistenti...
  type: "single" | "multi" | "expense";
  pass: 1 | 1.5 | 2 | 3;
  recurringExpenseId?: string;
  recurringExpenseName?: string;
}
```

### 2.5 Aggiornare `confirmMatchesEnhanced`

Per match `"expense"`:

```typescript
await tx.bankStatement.update({
  where: { id: match.bankStatementId },
  data: {
    isReconciled: true,
    reconciledExpenseId: match.recurringExpenseId,
    reconciledType: "EXPENSE",
    reconciledAt: new Date(),
  },
});
```

Per match invoice: aggiungere `reconciledType: "INVOICE"`.

---

## Fase 3 — UI Updates

### 3.1 match-card.tsx

**File**: `components/reconciliation/match-card.tsx`

Quando `type === "expense"`: badge viola "Spesa Ricorrente" + nome spesa al posto della lista fatture.

### 3.2 reconciliation-client.tsx

**File**: `components/reconciliation/reconciliation-client.tsx`

- Aggiornare interfaccia `Suggestion` con `recurringExpenseId?`, `recurringExpenseName?`, `type: "single"|"multi"|"expense"`
- Passare nuovi campi a `MatchCard`
- Nel confirm payload: gestire expense (no invoiceIds, ma `recurringExpenseId`)
- Aggiungere bottone "Addestra Pattern" nella tab "Non riconciliati"

### 3.3 API route

**File**: `app/api/reconciliation/route.ts`

- `action: "ignore"`: aggiungere `reconciledType: "IGNORED"`
- Il confirm delega a `confirmMatchesEnhanced` che gestisce già expense

---

## Fase 4 — Pattern Training Wizard (SaaS-ready)

### 4.1 Dialog

**Nuovo file**: `components/reconciliation/pattern-training-dialog.tsx`

1. Mostra descrizione movimento con highlight di ciò che i pattern estraggono
2. Se estrazione vuota/sbagliata → l'utente seleziona la porzione testo = controparte
3. Sistema genera regex: testo prima della selezione come ancora, `(.+?)` per la cattura, testo dopo come chiusura
4. Test live su altri movimenti non riconciliati: "Pattern matcha N di M"
5. Salva su `BankProfile.descriptionPatterns`

Stesso flusso per numero fattura.

### 4.2 API pattern

**Nuovo file**: `app/api/reconciliation/patterns/route.ts`

- GET: carica pattern org
- POST: aggiunge pattern (con validazione regex + lunghezza max 200 char)
- DELETE: rimuove pattern

**Nuovo file**: `app/api/reconciliation/patterns/test/route.ts`

- POST `{ regex, type }`: testa regex su movimenti non riconciliati
- Ritorna `{ matches, total, samples[] }`

---

## Riepilogo file

### Da creare

| File                                                    | Fase |
| ------------------------------------------------------- | ---- |
| `prisma/migration-reconciliation-v2.sql`                | 2    |
| `components/reconciliation/pattern-training-dialog.tsx` | 4    |
| `app/api/reconciliation/patterns/route.ts`              | 4    |
| `app/api/reconciliation/patterns/test/route.ts`         | 4    |

### Da modificare

| File                                                  | Fase | Modifiche                                                                                               |
| ----------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------- |
| `lib/reconciliation/reconciliation-engine.ts`         | 1+2  | Fix regex, pattern loader, Pass 1 boost, Pass 1.5 expense, demote Pass 2, extend types, confirm expense |
| `prisma/schema.prisma`                                | 2    | +campi BankStatement, +relazione RecurringExpense, +campo BankProfile                                   |
| `components/reconciliation/match-card.tsx`            | 3    | Tipo "expense" con badge viola                                                                          |
| `components/reconciliation/reconciliation-client.tsx` | 3    | Nuovi campi, bottone Train, gestione expense                                                            |
| `app/api/reconciliation/route.ts`                     | 3    | reconciledType su ignore                                                                                |

## Ordine

**Fase 1 → 2 → 3 → 4** (ogni fase deployabile)

Fase 1 non richiede migration. Fasi 2+ richiedono migration SQL su Supabase + `npx prisma generate`.

## Verifica

1. **Fase 1**: ri-eseguire riconciliazione → "DA: SINSERVICE SRL PER: FATTURA NUM.59" matchato con confidenza > 90%
2. **Fase 2**: movimenti tipo "COMMISSIONI" / "CANONE CC" matchati a spese ricorrenti
3. **Pass 2**: confidenza 25%, keyword non-fattura escluse
4. **Fase 4**: utente seleziona testo → regex generato → test su altri movimenti → salva
