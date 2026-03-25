# Istruzioni Sviluppo — Import Fatture da Cassetto Fiscale

## Obiettivo

Implementare l'importazione automatica delle fatture elettroniche (attive e passive) dal formato FatturaPA XML, così come scaricato dal portale "Fatture e Corrispettivi" dell'Agenzia delle Entrate (Cassetto Fiscale).

## Flusso Utente Previsto

1. L'utente accede al portale Fatture e Corrispettivi (https://ivaservizi.agenziaentrate.gov.it/portale/) tramite SPID o CIE
2. Scarica in bulk le fatture attive e/o passive come file ZIP
3. Nella pagina `/import` di FinFlow, carica il file ZIP
4. Il sistema estrae, parsa e importa le fatture nel database

> **Nota**: Non esiste un'API pubblica REST per accedere programmaticamente al Cassetto Fiscale. L'accesso richiede autenticazione interattiva SPID/CIE. Eventuali integrazioni automatiche richiederebbero accreditamento SDI (Sistema di Interscambio) o servizi terzi a pagamento.

---

## Formato FatturaPA XML

### Specifiche

- **Versione schema**: 1.2.2 (vigente da ottobre 2020)
- **Namespace XML**: `http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2`
- **Schema XSD ufficiale**: https://www.fatturapa.gov.it/export/documenti/fatturapa/v1.2.2/Schema_del_file_xml_FatturaPA_v1.2.2.xsd
- **Documentazione**: https://www.fatturapa.gov.it/it/norme-e-regole/documentazione-fattura-elettronica/formato-fatturapa/

### Struttura XML Principale

```xml
<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12"
  xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>01234567890</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>00001</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>0000000</CodiceDestinatario>
    </DatiTrasmissione>

    <CedentePrestatore>         <!-- Fornitore / chi emette -->
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>01234567890</IdCodice>
        </IdFiscaleIVA>
        <CodiceFiscale>ABCDEF12G34H567I</CodiceFiscale>
        <Anagrafica>
          <Denominazione>Nome Azienda Srl</Denominazione>
        </Anagrafica>
        <RegimeFiscale>RF01</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>Via Roma 1</Indirizzo>
        <CAP>40100</CAP>
        <Comune>Bologna</Comune>
        <Provincia>BO</Provincia>
        <Nazione>IT</Nazione>
      </Sede>
    </CedentePrestatore>

    <CessionarioCommittente>    <!-- Cliente / chi riceve -->
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>09876543210</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica>
          <Denominazione>Altra Azienda Srl</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>...</Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>

  <FatturaElettronicaBody>      <!-- Può ripetersi (fattura lotto) -->
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>2025-01-15</Data>
        <Numero>1/2025</Numero>
        <ImportoTotaleDocumento>1220.00</ImportoTotaleDocumento>
        <Causale>Servizi di consulenza</Causale>
      </DatiGeneraliDocumento>
      <DatiOrdineAcquisto>...</DatiOrdineAcquisto>
    </DatiGenerali>

    <DatiBeniServizi>
      <DettaglioLinee>            <!-- Una per riga fattura -->
        <NumeroLinea>1</NumeroLinea>
        <Descrizione>Consulenza IT</Descrizione>
        <Quantita>1.00</Quantita>
        <PrezzoUnitario>1000.00</PrezzoUnitario>
        <PrezzoTotale>1000.00</PrezzoTotale>
        <AliquotaIVA>22.00</AliquotaIVA>
      </DettaglioLinee>
      <DatiRiepilogo>             <!-- Riepilogo per aliquota IVA -->
        <AliquotaIVA>22.00</AliquotaIVA>
        <ImponibileImporto>1000.00</ImponibileImporto>
        <Imposta>220.00</Imposta>
        <EsigibilitaIVA>I</EsigibilitaIVA>
      </DatiRiepilogo>
    </DatiBeniServizi>

    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>  <!-- TP02 = completo -->
      <DettaglioPagamento>
        <ModalitaPagamento>MP05</ModalitaPagamento>     <!-- Bonifico -->
        <DataScadenzaPagamento>2025-03-15</DataScadenzaPagamento>
        <ImportoPagamento>1220.00</ImportoPagamento>
        <IBAN>IT60X0542811101000000123456</IBAN>
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>
```

---

## XPath per Estrazione Dati

Tutti i percorsi sono relativi alla root `FatturaElettronica`. Il namespace prefix `p:` va gestito dal parser.

### Dati Cedente (Fornitore)

| Campo          | XPath                                                             |
| -------------- | ----------------------------------------------------------------- |
| P.IVA          | `//CedentePrestatore/DatiAnagrafici/IdFiscaleIVA/IdCodice`        |
| Codice Fiscale | `//CedentePrestatore/DatiAnagrafici/CodiceFiscale`                |
| Denominazione  | `//CedentePrestatore/DatiAnagrafici/Anagrafica/Denominazione`     |
| Nome + Cognome | `//CedentePrestatore/DatiAnagrafici/Anagrafica/Nome` + `/Cognome` |

### Dati Cessionario (Cliente)

| Campo         | XPath                                                              |
| ------------- | ------------------------------------------------------------------ |
| P.IVA         | `//CessionarioCommittente/DatiAnagrafici/IdFiscaleIVA/IdCodice`    |
| Denominazione | `//CessionarioCommittente/DatiAnagrafici/Anagrafica/Denominazione` |

### Dati Documento

| Campo          | XPath                                            |
| -------------- | ------------------------------------------------ |
| Tipo documento | `//DatiGeneraliDocumento/TipoDocumento`          |
| Numero fattura | `//DatiGeneraliDocumento/Numero`                 |
| Data emissione | `//DatiGeneraliDocumento/Data`                   |
| Importo totale | `//DatiGeneraliDocumento/ImportoTotaleDocumento` |
| Divisa         | `//DatiGeneraliDocumento/Divisa`                 |
| Causale        | `//DatiGeneraliDocumento/Causale`                |

### Dati Pagamento

| Campo    | XPath                                                      |
| -------- | ---------------------------------------------------------- |
| Modalità | `//DatiPagamento/DettaglioPagamento/ModalitaPagamento`     |
| Scadenza | `//DatiPagamento/DettaglioPagamento/DataScadenzaPagamento` |
| Importo  | `//DatiPagamento/DettaglioPagamento/ImportoPagamento`      |
| IBAN     | `//DatiPagamento/DettaglioPagamento/IBAN`                  |

### Importi e IVA

| Campo           | XPath                               |
| --------------- | ----------------------------------- |
| Imponibile      | `//DatiRiepilogo/ImponibileImporto` |
| Imposta (IVA)   | `//DatiRiepilogo/Imposta`           |
| Aliquota IVA    | `//DatiRiepilogo/AliquotaIVA`       |
| Righe dettaglio | `//DettaglioLinee` (array)          |

---

## Codici TipoDocumento

| Codice   | Descrizione                                           | Uso comune       |
| -------- | ----------------------------------------------------- | ---------------- |
| **TD01** | Fattura                                               | Il più comune    |
| **TD02** | Acconto/anticipo su fattura                           |                  |
| **TD03** | Acconto/anticipo su parcella                          |                  |
| **TD04** | Nota di credito                                       | Storno/rettifica |
| **TD05** | Nota di debito                                        |                  |
| **TD06** | Parcella                                              | Professionisti   |
| TD07     | Fattura semplificata                                  |                  |
| TD08     | NC semplificata                                       |                  |
| TD09     | ND semplificata                                       |                  |
| TD16     | Integrazione reverse charge interno                   |                  |
| TD17     | Integrazione/autofattura acquisti servizi estero      |                  |
| TD18     | Integrazione acquisti beni intracomunitari            |                  |
| TD19     | Integrazione/autofattura acquisti beni art. 17 c.2    |                  |
| TD20     | Autofattura regolarizzazione                          |                  |
| TD21     | Autofattura splafonamento                             |                  |
| TD22     | Estrazione beni da deposito IVA                       |                  |
| TD23     | Estrazione beni da deposito IVA con versamento        |                  |
| TD24     | Fattura differita (art. 21 c.4 lett. a)               |                  |
| TD25     | Fattura differita (art. 21 c.4 terzo periodo lett. b) |                  |
| TD26     | Cessione beni ammortizzabili / passaggi interni       |                  |
| TD27     | Fattura autoconsumo / cessioni gratuite               |                  |
| TD28     | Acquisti da San Marino con IVA                        |                  |

### Mapping verso FinFlow

Per l'import, i tipi rilevanti sono:

- **Fatture attive (emesse da noi)**: TD01, TD02, TD03, TD06, TD24, TD25 — `direction: "ACTIVE"`
- **Note di credito attive**: TD04 emessa da noi — `direction: "ACTIVE"`, importo negativo
- **Fatture passive (ricevute)**: TD01, TD02, TD03, TD06, TD24, TD25 — `direction: "PASSIVE"`
- **Note di credito passive**: TD04 ricevuta — `direction: "PASSIVE"`, importo negativo
- **Autofatture/integrazioni** (TD16-TD28): generalmente ignorabili per il cashflow

---

## Codici ModalitaPagamento

| Codice   | Descrizione                                |
| -------- | ------------------------------------------ |
| MP01     | Contanti                                   |
| MP02     | Assegno                                    |
| MP03     | Assegno circolare                          |
| MP04     | Contanti presso Tesoreria                  |
| **MP05** | **Bonifico** (il più comune)               |
| MP06     | Vaglia cambiario                           |
| MP07     | Bollettino bancario                        |
| MP08     | Carta di pagamento                         |
| MP09     | RID                                        |
| MP10     | RID utenze                                 |
| MP11     | RID veloce                                 |
| **MP12** | **RIBA** (Ricevuta bancaria)               |
| MP13     | MAV                                        |
| MP14     | Quietanza erario                           |
| MP15     | Giroconto su conti di contabilità speciale |
| MP16     | Domiciliazione bancaria                    |
| MP17     | Domiciliazione postale                     |
| MP18     | Bollettino di c/c postale                  |
| MP19     | SEPA Direct Debit                          |
| MP20     | SEPA Direct Debit CORE                     |
| MP21     | SEPA Direct Debit B2B                      |
| MP22     | Trattenuta su somme già riscosse           |
| MP23     | PagoPA                                     |

---

## Struttura ZIP dal Cassetto Fiscale

### Download Bulk

Dal portale Fatture e Corrispettivi, sezione "Consultazione" → "Fatture elettroniche":

- Si possono selezionare fatture per periodo (trimestre/anno)
- Il download produce un file **ZIP** contenente file XML (o XML.P7M)

### Contenuto ZIP

```
fatture_emesse_2025_Q1.zip
├── IT01234567890_00001.xml
├── IT01234567890_00002.xml.p7m
├── IT01234567890_00003.xml
└── ...
```

### Convenzione Nomi File SDI

```
{IdPaese}{IdCodice}_{Progressivo}.xml[.p7m]
```

- `IdPaese` + `IdCodice` = P.IVA del trasmittente
- `Progressivo` = alfanumerico (5 caratteri, base 36: 0-9, a-z)
- `.p7m` = busta CAdES (firma digitale) — va "sbucciata" per ottenere l'XML interno

### Gestione File P7M

I file `.xml.p7m` sono buste PKCS#7 (CAdES-BES) contenenti l'XML firmato digitalmente.

Per estrarre l'XML:

```typescript
// Approccio 1: Cercare i marker XML dentro il binario P7M
function extractXmlFromP7m(buffer: Buffer): string {
  const content = buffer.toString("binary");
  const xmlStart = content.indexOf("<?xml");
  const xmlEnd = content.lastIndexOf("</p:FatturaElettronica>");
  if (xmlStart === -1 || xmlEnd === -1) {
    // Fallback: cercare senza namespace prefix
    const altEnd = content.lastIndexOf("</FatturaElettronica>");
    if (xmlStart !== -1 && altEnd !== -1) {
      return content.substring(xmlStart, altEnd + "</FatturaElettronica>".length);
    }
    throw new Error("XML non trovato nel file P7M");
  }
  return content.substring(xmlStart, xmlEnd + "</p:FatturaElettronica>".length);
}

// Approccio 2: Usare libreria ASN.1 per parsing corretto
// npm: pkijs, asn1js, o node-forge
```

> **Nota**: L'approccio 1 (ricerca marker) funziona nella maggior parte dei casi ma non è formalmente corretto. Per un'implementazione production-grade, usare una libreria PKCS#7.

---

## Determinazione Attiva vs Passiva

Per capire se una fattura è **attiva** (emessa da noi) o **passiva** (ricevuta da fornitore), confrontare la P.IVA dell'organizzazione con cedente e cessionario:

```typescript
function determineDirection(
  xml: ParsedFattura,
  organizationVatId: string, // es. "03927890982"
): "ACTIVE" | "PASSIVE" {
  const cedenteVat = xml.cedentePrestatore.idFiscaleIVA.idCodice;
  const cessionarioVat = xml.cessionarioCommittente.idFiscaleIVA?.idCodice;

  if (cedenteVat === organizationVatId) {
    return "ACTIVE"; // Noi siamo il cedente → fattura emessa
  }
  if (cessionarioVat === organizationVatId) {
    return "PASSIVE"; // Noi siamo il cessionario → fattura ricevuta
  }

  throw new Error(
    `P.IVA organizzazione (${organizationVatId}) non trovata in cedente (${cedenteVat}) né cessionario (${cessionarioVat})`,
  );
}
```

---

## Mapping XML → Modello Invoice FinFlow

```typescript
interface InvoiceFromXml {
  // Da DatiGeneraliDocumento
  number: string; // Numero
  date: Date; // Data
  grossAmount: number; // ImportoTotaleDocumento (o somma DatiRiepilogo)
  netAmount: number; // Somma ImponibileImporto da DatiRiepilogo
  vatAmount: number; // Somma Imposta da DatiRiepilogo
  vatRate: number; // AliquotaIVA prevalente (o media ponderata)

  // Derivati
  direction: "ACTIVE" | "PASSIVE";
  counterpart: string; // Denominazione dell'altra parte
  counterpartVatId: string; // P.IVA dell'altra parte

  // Da DatiPagamento
  dueDate: Date | null; // DataScadenzaPagamento
  paymentMethod: string | null; // ModalitaPagamento (MP05, etc.)
  iban: string | null;

  // Metadati
  status: "PENDING"; // Default all'import
  description: string | null; // Causale
  xmlFileName: string; // Nome file originale per tracciabilità
}
```

### Calcolo Importi

Se `ImportoTotaleDocumento` è presente, usarlo come `grossAmount`. Altrimenti:

```typescript
// Somma dai riepiloghi IVA
const netAmount = datiRiepilogo.reduce((sum, r) => sum + r.imponibileImporto, 0);
const vatAmount = datiRiepilogo.reduce((sum, r) => sum + r.imposta, 0);
const grossAmount = netAmount + vatAmount;
```

### Gestione Note di Credito

Se `TipoDocumento === "TD04"`:

- L'importo deve essere **negativo** nel database
- `grossAmount = -Math.abs(importoTotaleDocumento)`

### Gestione Scadenze Multiple

Una fattura può avere più `DettaglioPagamento` (rate):

- Opzione A: Prendere la prima/ultima scadenza come `dueDate`
- Opzione B: Creare una invoice per ciascuna rata (più preciso per il cashflow)
- **Raccomandazione**: Opzione A per semplicità, con nota nelle `description` se ci sono rate multiple

---

## Implementazione Tecnica

### Libreria XML Consigliata

**`fast-xml-parser`** (già usata in molti progetti Node.js):

```bash
pnpm add fast-xml-parser
```

```typescript
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true, // IMPORTANTE: rimuove prefissi namespace (p:, ds:, etc.)
  isArray: (name) => {
    // Elementi che possono ripetersi
    return [
      "DettaglioLinee",
      "DatiRiepilogo",
      "DettaglioPagamento",
      "Causale",
      "FatturaElettronicaBody", // Fattura lotto
    ].includes(name);
  },
});

const parsed = parser.parse(xmlString);
const fattura = parsed.FatturaElettronica;
```

> **Attenzione**: `removeNSPrefix: true` è fondamentale. Senza questa opzione, tutti gli elementi avranno il prefisso `p:` e gli XPath non funzioneranno.

### Gestione ZIP

```bash
pnpm add jszip
# oppure usare la API nativa di Node.js (DecompressionStream) se disponibile
```

```typescript
import JSZip from "jszip";

async function extractInvoicesFromZip(zipBuffer: Buffer): Promise<Map<string, string>> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const invoices = new Map<string, string>(); // filename → xml content

  for (const [filename, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    const buffer = await file.async("nodebuffer");

    if (filename.endsWith(".xml.p7m") || filename.endsWith(".p7m")) {
      // Estrarre XML dalla busta P7M
      const xml = extractXmlFromP7m(buffer);
      invoices.set(filename, xml);
    } else if (filename.endsWith(".xml")) {
      invoices.set(filename, buffer.toString("utf-8"));
    }
  }

  return invoices;
}
```

### Flusso Import Completo

```
Upload ZIP
    ↓
Estrai file da ZIP (JSZip)
    ↓
Per ogni file:
    ├── Se .p7m → estrai XML
    ├── Se .xml → usa direttamente
    └── Altrimenti → ignora
    ↓
Parsa XML (fast-xml-parser)
    ↓
Determina ACTIVE/PASSIVE (confronto P.IVA)
    ↓
Mappa a InvoiceFromXml
    ↓
Preview (mostra tabella all'utente)
    ↓
Conferma utente
    ↓
Salva in DB (Prisma createMany)
    ↓
Report: N fatture importate, N errori, N duplicate
```

### Deduplicazione

Prima di inserire, verificare duplicati su:

- `organizationId` + `number` + `counterpartVatId` + `date`

```typescript
const existing = await prisma.invoice.findFirst({
  where: {
    organizationId,
    number: invoiceData.number,
    counterpartVatId: invoiceData.counterpartVatId,
    date: invoiceData.date,
  },
});
if (existing) {
  // Skippa o chiedi all'utente
}
```

### Validazione

Verifiche da fare su ogni XML:

1. `TipoDocumento` è tra quelli supportati (TD01-TD06, TD24, TD25)
2. `ImportoTotaleDocumento` o `DatiRiepilogo` presenti
3. P.IVA organizzazione trovata in cedente o cessionario
4. `Data` è una data valida
5. `Numero` è presente e non vuoto

---

## Modifiche Schema Prisma

Per supportare il campo `counterpartVatId` (utile per deduplicazione e matching):

```prisma
model Invoice {
  // ... campi esistenti ...
  counterpartVatId  String?   @map("counterpart_vat_id")
  xmlFileName       String?   @map("xml_file_name")
  paymentMethod     String?   @map("payment_method")
}
```

SQL corrispondente:

```sql
ALTER TABLE "public"."fin_invoice"
  ADD COLUMN "counterpart_vat_id" TEXT,
  ADD COLUMN "xml_file_name" TEXT,
  ADD COLUMN "payment_method" TEXT;

CREATE INDEX "idx_invoice_dedup"
  ON "public"."fin_invoice"("organization_id", "number", "counterpart_vat_id", "date");
```

---

## UI: Nuova Tab in /import

Aggiungere una terza tab nella pagina Import esistente:

- **Tab "Fatture XML"** (o "Cassetto Fiscale")
- Step 1: Upload file ZIP
- Step 2: Parsing e anteprima (tabella con tutte le fatture estratte)
- Step 3: Selezione (checkbox per includere/escludere singole fatture, evidenziare duplicati)
- Step 4: Conferma import
- Step 5: Report risultati

---

## Note per Sviluppo Futuro

### Possibile Integrazione Diretta SDI

Per un'integrazione diretta con il Sistema di Interscambio (senza download manuale):

1. **Accreditamento come intermediario** presso l'Agenzia delle Entrate
2. Canale di ricezione: **Web Service (SOAP)** o **SFTP** o **PEC**
3. Protocollo: SOAP con mutua autenticazione TLS (certificati rilasciati da AdE)
4. Il canale SDI riceve le fatture passive in tempo reale
5. Le fatture attive vanno inviate tramite lo stesso canale

Questo è un progetto complesso (mesi di sviluppo + burocrazia) ma eliminerebbe completamente il download manuale.

### Servizio SMTS (Nuovo - 2026)

L'Agenzia delle Entrate sta introducendo nuovi **Servizi Massivi di Trasmissione e Scarico (SMTS)** che potrebbero semplificare l'accesso programmatico in futuro. Monitorare gli aggiornamenti su https://www.fatturapa.gov.it/.

### Provider Terzi (Alternativa SaaS)

Se in futuro si volesse evitare il download manuale senza accreditamento SDI:

- **A-Cube API** (a-cube.net) — REST API, pay-per-use, gestisce ricezione/invio SDI
- **Invoicetronic** — API moderna per fatturazione elettronica
- **Openapi.com** — Servizi API per fatturazione
- Tutti richiedono un abbonamento ma eliminano la complessità dell'accreditamento
