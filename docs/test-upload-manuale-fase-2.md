# Test upload manuale — Fase 2

## Prerequisiti

- Dev server avviato: `pnpm dev`
- File Excel: `cowork/Modello CDG settembre 2025.xlsx` (locale, non in repo)
- Utente: `admin@blmproject.com` / `Blm2026!`

## Procedura

### 1. Login e navigazione

Aprire `http://localhost:3000`, fare login con le credenziali admin. Si arriva su `/firm/dashboard`. Cliccare **Clienti** nella sidebar, poi **BLM Project Srl**, poi il bottone **Bilanci di verifica** nella pagina anagrafica.

### 2. Upload del bilancio

Nella lista bilanci (vuota), cliccare **Carica bilancio**. Compilare:

- **Inizio periodo**: `2025-01-01`
- **Fine periodo**: `2025-09-30`
- **Nome foglio Excel**: `1-BV` (precompilato)
- **File**: selezionare `Modello CDG settembre 2025.xlsx`
- **Note**: es. `BV settembre 2025 — test Fase 2`

Cliccare **Carica e analizza**. Attendersi:

- Messaggio verde: **Bilancio caricato con successo**
- Righe importate: **45**
- Totale Dare: **171.187,00**
- Totale Avere: **165.878,00**
- 90 avvisi (conti senza importo, normale)

### 3. Mapping conti

Cliccare **Configura mapping conti**. Si apre la tabella dei 45 conti importati, con sfondo giallo per quelli non ancora mappati. Per ciascun conto, selezionare la categoria CdG dal dropdown. Esempio rapido:

| Conto    | Descrizione                 | Categoria suggerita      |
| -------- | --------------------------- | ------------------------ |
| 55.01.19 | Oneri accessori su acquisti | Costi var. — Materiali   |
| 57.09.01 | Spese telefoniche ordinarie | Costi fissi — Utenze     |
| 61.01.01 | Consulenze amministrative   | Costi fissi — Consulenze |
| 47.11.03 | Prestazioni di servizi      | Ricavi                   |
| 75.03.51 | Oneri finanziari diversi    | Oneri finanziari         |

Dopo aver mappato almeno 5-10 conti, cliccare **Salva**. Il bottone mostra il conteggio dei conti modificati. Verificare che il messaggio "Salvato" appaia.

### 4. Verifica lista bilanci

Tornare alla lista bilanci. Deve apparire una riga con:

- Periodo: gen 2025 — set 2025
- File: Modello CDG settembre 2025.xlsx
- 45 righe
- Stato: **Bozza**

### 5. Test freeze (opzionale)

Cliccare l'icona lucchetto sulla riga dello snapshot. Confermare. Lo stato passa a **Confermato** (verde). Verificare che il bottone elimina scompaia. Cliccare l'icona sblocca per ripristinare lo stato Bozza.
