import { XMLParser } from "fast-xml-parser";
import AdmZip from "adm-zip";

// ─── Types ──────────────────────────────────────────────────

export interface FatturaParseWarning {
  file: string;
  message: string;
}

export interface FatturaParseError {
  file: string;
  message: string;
}

export interface ParsedFatturaPALine {
  lineNumber: number;
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number;
  vatRate: number;
}

export interface ParsedFatturaPAInvoice {
  fileName: string;
  number: string;
  date: string; // ISO date string YYYY-MM-DD
  documentType: string; // TD01, TD04, etc.
  counterpart: string;
  counterpartVatNumber: string | null;
  detectedDirection: "ACTIVE" | "PASSIVE" | null;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  dueDate: string | null; // ISO date string
  description: string | null;
  lines: ParsedFatturaPALine[];
}

export interface ParsedFatturaPA {
  invoices: ParsedFatturaPAInvoice[];
  errors: FatturaParseError[];
  warnings: FatturaParseWarning[];
}

// ─── XML Parser Config ──────────────────────────────────────

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  isArray: (name) =>
    [
      "FatturaElettronicaBody",
      "DettaglioLinee",
      "DatiRiepilogo",
      "DatiPagamento",
      "DettaglioPagamento",
      "Causale",
      "DatiCassaPrevidenziale",
      "AltriDatiGestionali",
      "ScontoMaggiorazione",
    ].includes(name),
  parseTagValue: false,
  trimValues: true,
});

// ─── P7M Extraction ─────────────────────────────────────────

function extractXmlFromP7m(buffer: Buffer): string {
  const content = buffer.toString("binary");

  // Look for XML start markers
  let xmlStart = content.indexOf("<?xml");
  if (xmlStart === -1) {
    xmlStart = content.indexOf("<FatturaElettronica");
    if (xmlStart === -1) {
      // Search for any namespace-prefixed variant
      const prefixMatch = content.match(/<\w+:FatturaElettronica[\s>]/);
      if (prefixMatch && prefixMatch.index !== undefined) {
        xmlStart = prefixMatch.index;
      }
    }
  }

  if (xmlStart === -1) {
    throw new Error("XML non trovato nel file P7M");
  }

  // Find the closing tag — try several namespace variants
  const closingTags = [
    "</FatturaElettronica>",
    "</p:FatturaElettronica>",
    "</n:FatturaElettronica>",
    "</ns2:FatturaElettronica>",
  ];

  let xmlEnd = -1;
  let closingTag = "";
  for (const tag of closingTags) {
    const idx = content.lastIndexOf(tag);
    if (idx !== -1 && idx > xmlStart) {
      xmlEnd = idx + tag.length;
      closingTag = tag;
      break;
    }
  }

  // Fallback: search for any closing tag with a prefix
  if (xmlEnd === -1) {
    const closingMatch = content.match(/<\/\w*:?FatturaElettronica>/g);
    if (closingMatch) {
      const lastClosing = closingMatch[closingMatch.length - 1];
      const lastIdx = content.lastIndexOf(lastClosing);
      if (lastIdx > xmlStart) {
        xmlEnd = lastIdx + lastClosing.length;
        closingTag = lastClosing;
      }
    }
  }

  if (xmlEnd === -1) {
    throw new Error("Tag di chiusura FatturaElettronica non trovato nel file P7M");
  }

  return content.substring(xmlStart, xmlEnd);
}

// ─── File Type Detection & Extraction ───────────────────────

function isZip(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

function extractFilesFromZip(buffer: Buffer): Array<{ name: string; content: Buffer }> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const files: Array<{ name: string; content: Buffer }> = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName;
    // Skip macOS resource fork files
    if (name.startsWith("__MACOSX/") || name.split("/").pop()?.startsWith("._")) continue;
    if (name.endsWith(".xml") || name.endsWith(".p7m")) {
      files.push({ name, content: entry.getData() });
    }
  }

  return files;
}

function getXmlContent(buffer: Buffer, fileName: string): string {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".p7m")) {
    return extractXmlFromP7m(buffer);
  }
  return buffer.toString("utf-8");
}

// ─── Helpers ────────────────────────────────────────────────

function normalizeVat(vat: unknown): string {
  if (vat === undefined || vat === null) return "";
  const s = String(vat);
  return s.replace(/^IT/i, "").trim().toUpperCase();
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(",", "."));
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function getCounterpartName(anagraficaNode: Record<string, unknown> | undefined): string {
  if (!anagraficaNode) return "Sconosciuto";
  const denominazione = anagraficaNode.Denominazione;
  if (denominazione && typeof denominazione === "string") return denominazione;
  const cognome = anagraficaNode.Cognome;
  const nome = anagraficaNode.Nome;
  if (cognome || nome) {
    return [cognome, nome].filter(Boolean).join(" ");
  }
  return "Sconosciuto";
}

// ─── Core Parsing Logic ─────────────────────────────────────

function parseSingleXml(
  xmlContent: string,
  fileName: string,
  orgVatNumber?: string,
): {
  invoices: ParsedFatturaPAInvoice[];
  errors: FatturaParseError[];
  warnings: FatturaParseWarning[];
} {
  const invoices: ParsedFatturaPAInvoice[] = [];
  const errors: FatturaParseError[] = [];
  const warnings: FatturaParseWarning[] = [];

  let parsed: Record<string, unknown>;
  try {
    parsed = xmlParser.parse(xmlContent);
  } catch (err) {
    errors.push({
      file: fileName,
      message: `Errore parsing XML: ${err instanceof Error ? err.message : "errore sconosciuto"}`,
    });
    return { invoices, errors, warnings };
  }

  // Navigate to root element
  const fattura = (parsed as Record<string, unknown>).FatturaElettronica as
    | Record<string, unknown>
    | undefined;
  if (!fattura) {
    errors.push({ file: fileName, message: "Elemento FatturaElettronica non trovato" });
    return { invoices, errors, warnings };
  }

  // Header data
  const header = fattura.FatturaElettronicaHeader as Record<string, unknown> | undefined;
  if (!header) {
    errors.push({ file: fileName, message: "FatturaElettronicaHeader non trovato" });
    return { invoices, errors, warnings };
  }

  // Cedente (supplier) and Cessionario (customer)
  const cedente = header.CedentePrestatore as Record<string, unknown> | undefined;
  const cessionario = header.CessionarioCommittente as Record<string, unknown> | undefined;

  const cedenteAnag = cedente?.DatiAnagrafici as Record<string, unknown> | undefined;
  const cessionarioAnag = cessionario?.DatiAnagrafici as Record<string, unknown> | undefined;

  const cedenteIdFiscale = cedenteAnag?.IdFiscaleIVA as Record<string, unknown> | undefined;
  const cessionarioIdFiscale = cessionarioAnag?.IdFiscaleIVA as Record<string, unknown> | undefined;

  const cedenteVat = normalizeVat(cedenteIdFiscale?.IdCodice as string | undefined);
  const cessionarioVat = normalizeVat(cessionarioIdFiscale?.IdCodice as string | undefined);

  const cedenteNome = getCounterpartName(
    cedenteAnag?.Anagrafica as Record<string, unknown> | undefined,
  );
  const cessionarioNome = getCounterpartName(
    cessionarioAnag?.Anagrafica as Record<string, unknown> | undefined,
  );

  // Detect direction
  const normalizedOrgVat = orgVatNumber ? normalizeVat(orgVatNumber) : null;
  let detectedDirection: "ACTIVE" | "PASSIVE" | null = null;
  let counterpart: string;
  let counterpartVatNumber: string | null;

  if (normalizedOrgVat) {
    if (cedenteVat === normalizedOrgVat) {
      detectedDirection = "ACTIVE";
      counterpart = cessionarioNome;
      counterpartVatNumber = cessionarioVat || null;
    } else if (cessionarioVat === normalizedOrgVat) {
      detectedDirection = "PASSIVE";
      counterpart = cedenteNome;
      counterpartVatNumber = cedenteVat || null;
    } else {
      counterpart = cedenteNome;
      counterpartVatNumber = cedenteVat || null;
      warnings.push({
        file: fileName,
        message: `P.IVA organizzazione (${normalizedOrgVat}) non trovata nel cedente (${cedenteVat}) né nel cessionario (${cessionarioVat})`,
      });
    }
  } else {
    // No org VAT — assume passive, counterpart is cedente
    counterpart = cedenteNome;
    counterpartVatNumber = cedenteVat || null;
  }

  // Process bodies (multiple in lotto)
  const bodies = fattura.FatturaElettronicaBody as Record<string, unknown>[];
  if (!bodies || bodies.length === 0) {
    errors.push({ file: fileName, message: "Nessun FatturaElettronicaBody trovato" });
    return { invoices, errors, warnings };
  }

  for (let bodyIdx = 0; bodyIdx < bodies.length; bodyIdx++) {
    const body = bodies[bodyIdx];
    const bodyLabel = bodies.length > 1 ? `${fileName} [${bodyIdx + 1}]` : fileName;

    try {
      const datiGenerali = body.DatiGenerali as Record<string, unknown> | undefined;
      const datiDoc = datiGenerali?.DatiGeneraliDocumento as Record<string, unknown> | undefined;

      if (!datiDoc) {
        errors.push({ file: bodyLabel, message: "DatiGeneraliDocumento non trovato" });
        continue;
      }

      const documentType = String(datiDoc.TipoDocumento ?? "");
      const numero = String(datiDoc.Numero ?? "");
      const data = String(datiDoc.Data ?? "");
      const importoTotale = datiDoc.ImportoTotaleDocumento;

      if (!numero) {
        errors.push({ file: bodyLabel, message: "Numero fattura mancante" });
        continue;
      }
      if (!data) {
        errors.push({ file: bodyLabel, message: "Data fattura mancante" });
        continue;
      }

      // Causale (may be array)
      const causaleRaw = datiDoc.Causale;
      let description: string | null = null;
      if (Array.isArray(causaleRaw)) {
        description = causaleRaw.filter(Boolean).join(" | ");
      } else if (causaleRaw) {
        description = String(causaleRaw);
      }

      // DatiBeniServizi
      const datiBeniServizi = body.DatiBeniServizi as Record<string, unknown> | undefined;
      const datiRiepilogo = (datiBeniServizi?.DatiRiepilogo as Record<string, unknown>[]) ?? [];
      const dettaglioLinee = (datiBeniServizi?.DettaglioLinee as Record<string, unknown>[]) ?? [];

      // Calculate amounts from DatiRiepilogo
      let netAmount = 0;
      let vatAmount = 0;
      for (const riepilogo of datiRiepilogo) {
        netAmount += toNumber(riepilogo.ImponibileImporto);
        vatAmount += toNumber(riepilogo.Imposta);
      }

      // Gross amount: prefer ImportoTotaleDocumento, fallback to net + vat
      let grossAmount: number;
      if (importoTotale !== undefined && importoTotale !== null) {
        grossAmount = toNumber(importoTotale);
        // Cross-check
        const calculated = netAmount + vatAmount;
        if (Math.abs(grossAmount - calculated) > 0.01 && calculated > 0) {
          warnings.push({
            file: bodyLabel,
            message: `ImportoTotaleDocumento (${grossAmount}) differisce da imponibile+imposta (${calculated.toFixed(2)})`,
          });
        }
      } else {
        grossAmount = netAmount + vatAmount;
      }

      // Note di credito (TD04) → negative amounts
      const isCreditNote = documentType === "TD04" || documentType === "TD08";
      if (isCreditNote) {
        netAmount = -Math.abs(netAmount);
        vatAmount = -Math.abs(vatAmount);
        grossAmount = -Math.abs(grossAmount);
      }

      // Due date from DatiPagamento — take the furthest date
      let dueDate: string | null = null;
      const datiPagamento = body.DatiPagamento;
      if (datiPagamento) {
        const pagamenti = Array.isArray(datiPagamento) ? datiPagamento : [datiPagamento];
        let latestDate: string | null = null;
        for (const pag of pagamenti) {
          const dettagli = (pag as Record<string, unknown>).DettaglioPagamento;
          if (!dettagli) continue;
          const dettagliArr = Array.isArray(dettagli) ? dettagli : [dettagli];
          for (const det of dettagliArr) {
            const scadenza = (det as Record<string, unknown>).DataScadenzaPagamento;
            if (scadenza) {
              const dateStr = String(scadenza);
              if (!latestDate || dateStr > latestDate) {
                latestDate = dateStr;
              }
            }
          }
        }
        dueDate = latestDate;
      }

      // Parse lines
      const lines: ParsedFatturaPALine[] = [];
      for (const linea of dettaglioLinee) {
        const lineNum = toNumber(linea.NumeroLinea);
        const lineDesc = String(linea.Descrizione ?? "");
        const qty =
          linea.Quantita !== undefined && linea.Quantita !== null ? toNumber(linea.Quantita) : null;
        const unitPrice =
          linea.PrezzoUnitario !== undefined && linea.PrezzoUnitario !== null
            ? toNumber(linea.PrezzoUnitario)
            : null;
        const lineAmount = toNumber(linea.PrezzoTotale);
        const lineVatRate = toNumber(linea.AliquotaIVA);

        lines.push({
          lineNumber: lineNum,
          description: lineDesc,
          quantity: qty,
          unitPrice,
          amount: isCreditNote ? -Math.abs(lineAmount) : lineAmount,
          vatRate: lineVatRate,
        });
      }

      invoices.push({
        fileName: bodyLabel,
        number: numero,
        date: data,
        documentType,
        counterpart,
        counterpartVatNumber,
        detectedDirection,
        netAmount: Math.round(netAmount * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        grossAmount: Math.round(grossAmount * 100) / 100,
        dueDate,
        description,
        lines,
      });
    } catch (err) {
      errors.push({
        file: bodyLabel,
        message: err instanceof Error ? err.message : "Errore sconosciuto durante il parsing",
      });
    }
  }

  return { invoices, errors, warnings };
}

// ─── Main Entry Point ───────────────────────────────────────

export function parseFatturaPA(
  content: Buffer,
  fileName: string,
  organizationVatNumber?: string,
): ParsedFatturaPA {
  const allInvoices: ParsedFatturaPAInvoice[] = [];
  const allErrors: FatturaParseError[] = [];
  const allWarnings: FatturaParseWarning[] = [];

  // Determine file type
  const lowerName = fileName.toLowerCase();

  if (isZip(content) || lowerName.endsWith(".zip")) {
    // ZIP file — extract and process each entry
    let files: Array<{ name: string; content: Buffer }>;
    try {
      files = extractFilesFromZip(content);
    } catch (err) {
      allErrors.push({
        file: fileName,
        message: `Errore apertura ZIP: ${err instanceof Error ? err.message : "errore sconosciuto"}`,
      });
      return { invoices: allInvoices, errors: allErrors, warnings: allWarnings };
    }

    if (files.length === 0) {
      allErrors.push({
        file: fileName,
        message: "Nessun file XML o P7M trovato nell'archivio ZIP",
      });
      return { invoices: allInvoices, errors: allErrors, warnings: allWarnings };
    }

    for (const entry of files) {
      try {
        const xmlContent = getXmlContent(entry.content, entry.name);
        const result = parseSingleXml(xmlContent, entry.name, organizationVatNumber);
        allInvoices.push(...result.invoices);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      } catch (err) {
        allErrors.push({
          file: entry.name,
          message: err instanceof Error ? err.message : "Errore estrazione XML",
        });
      }
    }
  } else {
    // Single file (XML or P7M)
    try {
      const xmlContent = getXmlContent(content, fileName);
      const result = parseSingleXml(xmlContent, fileName, organizationVatNumber);
      allInvoices.push(...result.invoices);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    } catch (err) {
      allErrors.push({
        file: fileName,
        message: err instanceof Error ? err.message : "Errore estrazione XML",
      });
    }
  }

  return { invoices: allInvoices, errors: allErrors, warnings: allWarnings };
}
