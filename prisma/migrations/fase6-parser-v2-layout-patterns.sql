-- Fase 6 Parser V2: update system default PdfBankProfile layout_patterns
-- from old linePattern/continuationPattern/signConvention schema
-- to new state-machine schema (startTransactionPattern, amountLinePattern,
-- singleLinePattern, signHints).
--
-- Only updates system defaults (accounting_firm_id IS NULL).
-- Firm-specific custom profiles must be manually updated by the controller.

-- ─── Unicredit ──────────────────────────────────────────────

UPDATE finflow.pdf_bank_profile
SET layout_patterns = '{
  "sectionStartMarker": "ELENCO\\s+MOVIMENTI|Data\\s+Valuta\\s+Descrizione|LISTA\\s+MOVIMENTI",
  "sectionEndMarker": "SALDO\\s+FINALE|TOTALE\\s+MOVIMENTI",
  "startTransactionPattern": "^(?<date>\\d{2}\\.\\d{2}\\.\\d{2})\\s+(?<valuta>\\d{2}\\.\\d{2}\\.\\d{2})(?:\\s+(?<description>.+?))?\\s*$",
  "amountLinePattern": "^\\s*(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",
  "singleLinePattern": "^(?<date>\\d{2}\\.\\d{2}\\.\\d{2})\\s+(?<valuta>\\d{2}\\.\\d{2}\\.\\d{2})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",
  "signHints": {
    "overrideIncoming": ["STORNO A VOSTRO FAVORE","VOSTRA DISPOSIZIONE STORNO","STORNO","A VOSTRO FAVORE","BONIFICO SEPA DA","SALDO INIZIALE"],
    "incoming": ["BONIFICO A VOSTRO FAVORE","ACCREDITO","VERSAMENTO","STIPENDIO","STORNO ADDEBITO","RIMBORSO","INCASSO","GIROCONTO A VOSTRO FAVORE"],
    "outgoing": ["PAGAMENTO","ADDEBITO","PRELIEVO","BONIFICO DA VOI DISPOSTO","DISPOSIZIONE DI BONIFICO","COMMISSIONE","CANONE","UTENZE","IMPOSTE","RITENUTA","GIROCONTO DA VOI DISPOSTO","F24","MAV","RAV","RID","SDD"],
    "defaultSign": "negative"
  },
  "dateFormat": "dd.MM.yy",
  "amountDecimal": ",",
  "skipPatterns": ["^\\s*$","^Pag\\.?\\s*\\d","^IBAN","^Conto\\s+Corrente","^Intestato","^Divisa","^N\\.\\s+Operazioni"]
}'::jsonb,
updated_at = now()
WHERE id = 'sys_unicredit';

-- ─── Intesa Sanpaolo ────────────────────────────────────────

UPDATE finflow.pdf_bank_profile
SET layout_patterns = '{
  "sectionStartMarker": null,
  "sectionEndMarker": null,
  "startTransactionPattern": "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s*$",
  "amountLinePattern": "^\\s*(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",
  "singleLinePattern": "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",
  "signHints": {"incoming":[],"outgoing":[],"defaultSign":"positive"},
  "dateFormat": "dd/MM/yyyy",
  "amountDecimal": ",",
  "skipPatterns": ["^\\s*$","Data\\s+Valuta","SALDO\\s+INIZIALE","SALDO\\s+FINALE","TOTALE","Pagina\\s+\\d","IBAN"]
}'::jsonb,
updated_at = now()
WHERE id = 'sys_intesa';

-- ─── BPER Banca ─────────────────────────────────────────────

UPDATE finflow.pdf_bank_profile
SET layout_patterns = '{
  "sectionStartMarker": null,
  "sectionEndMarker": null,
  "startTransactionPattern": "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s*$",
  "amountLinePattern": "^\\s*(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",
  "singleLinePattern": "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",
  "signHints": {"incoming":[],"outgoing":[],"defaultSign":"positive"},
  "dateFormat": "dd/MM/yyyy",
  "amountDecimal": ",",
  "skipPatterns": ["^\\s*$","DATA\\s+OPER","SALDO\\s+CONTABILE","TOTALE","Pagina"]
}'::jsonb,
updated_at = now()
WHERE id = 'sys_bper';

-- ─── MPS (Monte dei Paschi di Siena) ────────────────────────

UPDATE finflow.pdf_bank_profile
SET layout_patterns = '{
  "sectionStartMarker": null,
  "sectionEndMarker": null,
  "startTransactionPattern": "^(?<date>\\d{2}\\.\\d{2}\\.\\d{4})\\s+(?<description>.+?)\\s*$",
  "amountLinePattern": "^\\s*(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",
  "singleLinePattern": "^(?<date>\\d{2}\\.\\d{2}\\.\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",
  "signHints": {"incoming":[],"outgoing":[],"defaultSign":"positive"},
  "dateFormat": "dd.MM.yyyy",
  "amountDecimal": ",",
  "skipPatterns": ["^\\s*$","Data\\s+operazione","Saldo\\s+iniziale","Saldo\\s+finale","TOTALE","Pag\\."]
}'::jsonb,
updated_at = now()
WHERE id = 'sys_mps';

-- ─── Crédit Agricole ────────────────────────────────────────

UPDATE finflow.pdf_bank_profile
SET layout_patterns = '{
  "sectionStartMarker": null,
  "sectionEndMarker": null,
  "startTransactionPattern": "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s*$",
  "amountLinePattern": "^\\s*(?<amount>-?[\\d.]+,\\d{2})\\s*$",
  "singleLinePattern": "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})\\s*$",
  "signHints": {"incoming":[],"outgoing":[],"defaultSign":"positive"},
  "dateFormat": "dd/MM/yyyy",
  "amountDecimal": ",",
  "skipPatterns": ["^\\s*$","Data\\s+Operaz","SALDO","TOTALE","Pag\\.","Estratto","Conto\\s+corrente"]
}'::jsonb,
updated_at = now()
WHERE id = 'sys_credit_agricole';

-- ─── Banca Sella ────────────────────────────────────────────

UPDATE finflow.pdf_bank_profile
SET layout_patterns = '{
  "sectionStartMarker": null,
  "sectionEndMarker": null,
  "startTransactionPattern": "^(?<date>\\d{2}/\\d{2}/\\d{2,4})\\s+(?<description>.+?)\\s*$",
  "amountLinePattern": "^\\s*(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",
  "singleLinePattern": "^(?<date>\\d{2}/\\d{2}/\\d{2,4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",
  "signHints": {"incoming":[],"outgoing":[],"defaultSign":"positive"},
  "dateFormat": "dd/MM/yyyy",
  "amountDecimal": ",",
  "skipPatterns": ["^\\s*$","Data","Saldo","TOTALE","Pag\\."]
}'::jsonb,
updated_at = now()
WHERE id = 'sys_banca_sella';
