// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy FatturaPA parser tests. Will be removed in Block D.
import { describe, it, expect } from "vitest";
import { parseFatturaPA } from "../fatturapa-parser";
import { FEATURES } from "@/lib/feature-flags";

function xmlToBuffer(xml: string): Buffer {
  return Buffer.from(xml, "utf-8");
}

// ─── Fixtures ───────────────────────────────────────────────

const SIMPLE_TD01 = `<?xml version="1.0" encoding="UTF-8"?>
<FatturaElettronica versione="FPR12">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>01234567890</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>Fornitore Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>09876543210</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>Cliente Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>2025-01-15</Data>
        <Numero>1/2025</Numero>
        <ImportoTotaleDocumento>1220.00</ImportoTotaleDocumento>
        <Causale>Servizi di consulenza</Causale>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DettaglioLinee>
        <NumeroLinea>1</NumeroLinea>
        <Descrizione>Consulenza IT</Descrizione>
        <Quantita>1.00</Quantita>
        <PrezzoUnitario>1000.00</PrezzoUnitario>
        <PrezzoTotale>1000.00</PrezzoTotale>
        <AliquotaIVA>22.00</AliquotaIVA>
      </DettaglioLinee>
      <DatiRiepilogo>
        <AliquotaIVA>22.00</AliquotaIVA>
        <ImponibileImporto>1000.00</ImponibileImporto>
        <Imposta>220.00</Imposta>
      </DatiRiepilogo>
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>MP05</ModalitaPagamento>
        <DataScadenzaPagamento>2025-03-15</DataScadenzaPagamento>
        <ImportoPagamento>1220.00</ImportoPagamento>
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</FatturaElettronica>`;

const CREDIT_NOTE_TD04 = `<?xml version="1.0" encoding="UTF-8"?>
<FatturaElettronica versione="FPR12">
  <FatturaElettronicaHeader>
    <DatiTrasmissione><FormatoTrasmissione>FPR12</FormatoTrasmissione></DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>01234567890</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>Fornitore Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>09876543210</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>Cliente Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD04</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>2025-02-01</Data>
        <Numero>NC1/2025</Numero>
        <ImportoTotaleDocumento>244.00</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DettaglioLinee>
        <NumeroLinea>1</NumeroLinea>
        <Descrizione>Storno parziale</Descrizione>
        <Quantita>1.00</Quantita>
        <PrezzoUnitario>200.00</PrezzoUnitario>
        <PrezzoTotale>200.00</PrezzoTotale>
        <AliquotaIVA>22.00</AliquotaIVA>
      </DettaglioLinee>
      <DatiRiepilogo>
        <AliquotaIVA>22.00</AliquotaIVA>
        <ImponibileImporto>200.00</ImponibileImporto>
        <Imposta>44.00</Imposta>
      </DatiRiepilogo>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
</FatturaElettronica>`;

const NS_PREFIX_XML = `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12"
  xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
  <FatturaElettronicaHeader>
    <DatiTrasmissione><FormatoTrasmissione>FPR12</FormatoTrasmissione></DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>11111111111</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>NS Azienda</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>22222222222</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>NS Cliente</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Data>2025-06-01</Data>
        <Numero>42/2025</Numero>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DettaglioLinee>
        <NumeroLinea>1</NumeroLinea>
        <Descrizione>Servizio</Descrizione>
        <PrezzoTotale>500.00</PrezzoTotale>
        <AliquotaIVA>22.00</AliquotaIVA>
      </DettaglioLinee>
      <DatiRiepilogo>
        <AliquotaIVA>22.00</AliquotaIVA>
        <ImponibileImporto>500.00</ImponibileImporto>
        <Imposta>110.00</Imposta>
      </DatiRiepilogo>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;

const MULTI_BODY_LOTTO = `<?xml version="1.0" encoding="UTF-8"?>
<FatturaElettronica versione="FPR12">
  <FatturaElettronicaHeader>
    <DatiTrasmissione><FormatoTrasmissione>FPR12</FormatoTrasmissione></DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>33333333333</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>Lotto Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>44444444444</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>Destinatario Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Data>2025-03-01</Data>
        <Numero>A1/2025</Numero>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DatiRiepilogo>
        <ImponibileImporto>100.00</ImponibileImporto>
        <Imposta>22.00</Imposta>
      </DatiRiepilogo>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Data>2025-03-02</Data>
        <Numero>A2/2025</Numero>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DatiRiepilogo>
        <ImponibileImporto>200.00</ImponibileImporto>
        <Imposta>44.00</Imposta>
      </DatiRiepilogo>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
</FatturaElettronica>`;

const NO_PAYMENT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<FatturaElettronica versione="FPR12">
  <FatturaElettronicaHeader>
    <DatiTrasmissione><FormatoTrasmissione>FPR12</FormatoTrasmissione></DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>55555555555</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>No Pay Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>66666666666</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>Pagatore Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Data>2025-04-01</Data>
        <Numero>NP/2025</Numero>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DatiRiepilogo>
        <ImponibileImporto>300.00</ImponibileImporto>
        <Imposta>66.00</Imposta>
      </DatiRiepilogo>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
</FatturaElettronica>`;

const NOME_COGNOME_XML = `<?xml version="1.0" encoding="UTF-8"?>
<FatturaElettronica versione="FPR12">
  <FatturaElettronicaHeader>
    <DatiTrasmissione><FormatoTrasmissione>FPR12</FormatoTrasmissione></DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>77777777777</IdCodice></IdFiscaleIVA>
        <Anagrafica>
          <Cognome>Rossi</Cognome>
          <Nome>Mario</Nome>
        </Anagrafica>
      </DatiAnagrafici>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>88888888888</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>Azienda Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD06</TipoDocumento>
        <Data>2025-05-01</Data>
        <Numero>P1/2025</Numero>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DatiRiepilogo>
        <ImponibileImporto>1500.00</ImponibileImporto>
        <Imposta>330.00</Imposta>
      </DatiRiepilogo>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
</FatturaElettronica>`;

const MULTIPLE_PAYMENTS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<FatturaElettronica versione="FPR12">
  <FatturaElettronicaHeader>
    <DatiTrasmissione><FormatoTrasmissione>FPR12</FormatoTrasmissione></DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>99999999999</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>Multi Pay Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>00000000001</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>Rate Srl</Denominazione></Anagrafica>
      </DatiAnagrafici>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Data>2025-07-01</Data>
        <Numero>MP/2025</Numero>
        <ImportoTotaleDocumento>3660.00</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DatiRiepilogo>
        <ImponibileImporto>3000.00</ImponibileImporto>
        <Imposta>660.00</Imposta>
      </DatiRiepilogo>
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP01</CondizioniPagamento>
      <DettaglioPagamento>
        <DataScadenzaPagamento>2025-08-01</DataScadenzaPagamento>
        <ImportoPagamento>1220.00</ImportoPagamento>
      </DettaglioPagamento>
      <DettaglioPagamento>
        <DataScadenzaPagamento>2025-09-01</DataScadenzaPagamento>
        <ImportoPagamento>1220.00</ImportoPagamento>
      </DettaglioPagamento>
      <DettaglioPagamento>
        <DataScadenzaPagamento>2025-10-01</DataScadenzaPagamento>
        <ImportoPagamento>1220.00</ImportoPagamento>
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</FatturaElettronica>`;

// ─── Tests ──────────────────────────────────────────────────

/**
 * Test sospesi durante migrazione V2 (flag LEGACY_FATTURAPA_IMPORT = false).
 * Saranno riattivati o cancellati a fine Fase 3 secondo esito migrazione.
 * Ref: docs/adr/002-feature-flags-over-deletion.md
 */
describe.skipIf(!FEATURES.LEGACY_FATTURAPA_IMPORT)("parseFatturaPA", () => {
  it("parses a simple TD01 invoice", () => {
    const result = parseFatturaPA(xmlToBuffer(SIMPLE_TD01), "test.xml");

    expect(result.errors).toHaveLength(0);
    expect(result.invoices).toHaveLength(1);

    const inv = result.invoices[0];
    expect(inv.number).toBe("1/2025");
    expect(inv.date).toBe("2025-01-15");
    expect(inv.documentType).toBe("TD01");
    expect(inv.counterpart).toBe("Fornitore Srl");
    expect(inv.netAmount).toBe(1000);
    expect(inv.vatAmount).toBe(220);
    expect(inv.grossAmount).toBe(1220);
    expect(inv.dueDate).toBe("2025-03-15");
    expect(inv.description).toBe("Servizi di consulenza");
    expect(inv.lines).toHaveLength(1);
    expect(inv.lines[0].description).toBe("Consulenza IT");
  });

  it("makes TD04 credit note amounts negative", () => {
    const result = parseFatturaPA(xmlToBuffer(CREDIT_NOTE_TD04), "nc.xml");

    expect(result.errors).toHaveLength(0);
    expect(result.invoices).toHaveLength(1);

    const inv = result.invoices[0];
    expect(inv.documentType).toBe("TD04");
    expect(inv.netAmount).toBe(-200);
    expect(inv.vatAmount).toBe(-44);
    expect(inv.grossAmount).toBe(-244);
    expect(inv.lines[0].amount).toBe(-200);
  });

  it("handles namespace-prefixed XML (p:FatturaElettronica)", () => {
    const result = parseFatturaPA(xmlToBuffer(NS_PREFIX_XML), "ns.xml");

    expect(result.errors).toHaveLength(0);
    expect(result.invoices).toHaveLength(1);

    const inv = result.invoices[0];
    expect(inv.number).toBe("42/2025");
    expect(inv.counterpart).toBe("NS Azienda");
    expect(inv.netAmount).toBe(500);
    expect(inv.grossAmount).toBe(610); // no ImportoTotaleDocumento → net + vat
  });

  it("parses multi-body lotto with 2 invoices", () => {
    const result = parseFatturaPA(xmlToBuffer(MULTI_BODY_LOTTO), "lotto.xml");

    expect(result.errors).toHaveLength(0);
    expect(result.invoices).toHaveLength(2);

    expect(result.invoices[0].number).toBe("A1/2025");
    expect(result.invoices[0].grossAmount).toBe(122);
    expect(result.invoices[1].number).toBe("A2/2025");
    expect(result.invoices[1].grossAmount).toBe(244);
  });

  it("handles missing DatiPagamento gracefully (dueDate null)", () => {
    const result = parseFatturaPA(xmlToBuffer(NO_PAYMENT_XML), "nopay.xml");

    expect(result.errors).toHaveLength(0);
    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0].dueDate).toBeNull();
    expect(result.invoices[0].grossAmount).toBe(366);
  });

  it("detects ACTIVE direction when org VAT matches cedente", () => {
    const result = parseFatturaPA(xmlToBuffer(SIMPLE_TD01), "test.xml", "01234567890");

    expect(result.invoices[0].detectedDirection).toBe("ACTIVE");
    expect(result.invoices[0].counterpart).toBe("Cliente Srl");
    expect(result.invoices[0].counterpartVatNumber).toBe("09876543210");
  });

  it("detects PASSIVE direction when org VAT matches cessionario", () => {
    const result = parseFatturaPA(xmlToBuffer(SIMPLE_TD01), "test.xml", "09876543210");

    expect(result.invoices[0].detectedDirection).toBe("PASSIVE");
    expect(result.invoices[0].counterpart).toBe("Fornitore Srl");
    expect(result.invoices[0].counterpartVatNumber).toBe("01234567890");
  });

  it("warns when org VAT matches neither cedente nor cessionario", () => {
    const result = parseFatturaPA(xmlToBuffer(SIMPLE_TD01), "test.xml", "XXXXXXXXXX");

    expect(result.invoices[0].detectedDirection).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].message).toContain("P.IVA organizzazione");
  });

  it("handles Cognome + Nome instead of Denominazione", () => {
    const result = parseFatturaPA(xmlToBuffer(NOME_COGNOME_XML), "parcella.xml");

    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0].counterpart).toBe("Rossi Mario");
    expect(result.invoices[0].documentType).toBe("TD06");
  });

  it("takes the furthest due date with multiple DettaglioPagamento", () => {
    const result = parseFatturaPA(xmlToBuffer(MULTIPLE_PAYMENTS_XML), "multipay.xml");

    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0].dueDate).toBe("2025-10-01");
  });

  it("strips IT prefix from VAT number comparison", () => {
    const result = parseFatturaPA(xmlToBuffer(SIMPLE_TD01), "test.xml", "IT01234567890");

    expect(result.invoices[0].detectedDirection).toBe("ACTIVE");
  });

  it("handles lines without quantity", () => {
    const result = parseFatturaPA(xmlToBuffer(NS_PREFIX_XML), "ns.xml");

    const line = result.invoices[0].lines[0];
    expect(line.quantity).toBeNull();
    expect(line.unitPrice).toBeNull();
    expect(line.amount).toBe(500);
  });

  it("handles P7M extraction from binary wrapper", () => {
    // Simulate a P7M file: some binary garbage + XML content
    const xmlContent = SIMPLE_TD01;
    const binaryPrefix = Buffer.from([0x30, 0x82, 0x00, 0xff, 0x06, 0x09]);
    const xmlBuf = Buffer.from(xmlContent, "binary");
    const binarySuffix = Buffer.from([0x00, 0x00, 0x00]);
    const p7mBuffer = Buffer.concat([binaryPrefix, xmlBuf, binarySuffix]);

    const result = parseFatturaPA(p7mBuffer, "fattura.xml.p7m");

    expect(result.errors).toHaveLength(0);
    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0].number).toBe("1/2025");
  });

  it("returns error for invalid XML", () => {
    const result = parseFatturaPA(Buffer.from("not xml at all", "utf-8"), "bad.xml");

    // Parser may or may not throw — but there should be no invoices
    expect(result.invoices).toHaveLength(0);
  });

  it("computes gross from riepilogo when ImportoTotaleDocumento is missing", () => {
    const result = parseFatturaPA(xmlToBuffer(NO_PAYMENT_XML), "nopay.xml");

    const inv = result.invoices[0];
    expect(inv.netAmount).toBe(300);
    expect(inv.vatAmount).toBe(66);
    expect(inv.grossAmount).toBe(366); // net + vat
  });
});
