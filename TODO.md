# FinFlow — Riepilogo sessione 26 marzo 2026

## Cosa è stato fatto

### 1. Dettaglio Finanziario: dati reali EC + proiezioni

**File modificati:**

- `app/api/analysis/financial-detail/route.ts` — riscrittura completa
- `components/financial-detail/financial-detail-client.tsx` — riscrittura completa

**Logica implementata:**

- Mesi "Effettivo" (con dati bancari): totali da entrate/uscite bancarie reali
- Mesi "Previsione" (senza dati bancari): totali da fatture, spese ricorrenti, IVA
- SALDO RIPORTATO a cascata mese dopo mese
- Badge "Effettivo" / "Previsione" sotto l'header dei mesi
- Banner ambra se nessun dato bancario per l'anno
- Drill-down con badge "Riconciliata" per transazioni bancarie

**Date fatture:** ora usano la data di cassa (paidAt > expectedCollectionDate > dueDate > date), non più la data di emissione. Fatture non pagate appaiono solo nei mesi di previsione.

### 2. Riconciliazione bulk fatture ↔ movimenti bancari

**Script creati:**

- `scripts/bulk-reconcile.ts` — v1, usa il motore standard
- `scripts/bulk-reconcile-v2.ts` — v2 enhanced: OVERDUE incluse, no limite temporale, multi-fattura

**Risultati della riconciliazione:**

- 432 fatture con paidAt fittizio (24-25/Mar) resettate
- 190 match applicati (v1) + 35 match applicati (v2) = **225 totali, 236 fatture aggiornate**
- Ogni fattura ora ha `paidAt` = data reale del movimento bancario

**Endpoint creato:**

- `app/api/bank-statements/reconciliation/bulk-reset/route.ts` — endpoint per reset + ri-riconciliazione (usabile via API)

### 3. Altre modifiche (pre-esistenti, committate insieme)

- Phase 2: PaymentEvent, VatSnapshot, migration SQL
- Cashflow projection migliorato
- Overview con forecast/decomposition chart
- UI polish: sidebar, navbar, KPI cards, chart tooltip
- Validazioni e hook aggiornati

---

## Cosa resta da fare

### Priorità alta

- [ ] **Pagamenti parziali**: 15 movimenti bancari sono acconti/parziali (es. MARKETING 360 ha pagato 2.000€ su 11.518€). Servono PaymentEvent o riconciliazione manuale
- [ ] **Incassi senza fattura**: 12 movimenti bancari reali senza fattura corrispondente (REGIONE MARCHE contributi FESR, INVITALIA, FONDO COMPETITIVITA', ecc.). Decidere se creare fatture pro-forma o gestirli come "entrate extra"
- [ ] **15 fatture OVERDUE**: scadute e realmente non incassate. Verificare se sollecitare i clienti

### Priorità media

- [ ] Aggiungere nel financial-detail un indicatore visivo per distinguere fatture pagate vs previsione nel drill-down
- [ ] Gestione anno diverso dal corrente nel calcolo opening balance (attualmente reverse-calculation funziona solo per l'anno con dati bancari)
- [ ] Pulizia script `scripts/bulk-reconcile*.ts` (sono usa e getta, si possono rimuovere)

### Fatture ACTIVE non pagate rimaste (32)

Queste compaiono nel primo mese di previsione (Aprile) come incassi attesi:

- T.S. GOLDONI SRL 4.343€, ARTIMEC 12.200€, SCATOLIFICIO LUCARINI 12.200€
- REGIONE MARCHE 15.092€ + 14.784€, CFM ELETTRONICA 12.200€
- BANJO SAS 400€ + 488€ + 488€, EREMO 732€, EcoCostruzioni 8.540€
- F.I.P.I.L.L. 8.540€, DON GIUSEPPE MONTICELLI 12.291€, EASY PLAST 915€
- E altre di importo minore (Opere Caritative, APPEAL, AUSER, PROAI, ESCOMARCHE, ecc.)

### Movimenti bancari in entrata non riconciliati (27)

I più rilevanti:

- FONDO COMPETITIVITA' 116.859,55€ (Ott 2025)
- ISPRING NORD 24.246€ (Lug 2025)
- REGIONE MARCHE 3 bonifici (23.070€ Mar + 12.825€ Set 2025)
- INVITALIA 14.400€ (Feb 2025)
