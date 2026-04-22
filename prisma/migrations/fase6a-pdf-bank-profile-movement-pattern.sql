-- Fase 6.A1: PdfBankProfile + MovementPattern tables
-- Additive migration — no breaking changes

-- ─── PdfBankProfile ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS finflow.pdf_bank_profile (
  id                 TEXT PRIMARY KEY,
  accounting_firm_id TEXT REFERENCES finflow.accounting_firm(id),
  bank_name          TEXT NOT NULL,
  layout_patterns    JSONB NOT NULL,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pdf_bank_profile_firm_bank_unique
  ON finflow.pdf_bank_profile (accounting_firm_id, bank_name);

-- ─── MovementPattern ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS finflow.movement_pattern (
  id                 TEXT PRIMARY KEY,
  organization_id    TEXT NOT NULL REFERENCES public.fin_organization(id) ON DELETE CASCADE,
  description_regex  TEXT NOT NULL,
  cdg_category       TEXT NOT NULL,
  vat_rate           DECIMAL(5,2),
  priority           INTEGER NOT NULL DEFAULT 100,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  match_count        INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS movement_pattern_org_active
  ON finflow.movement_pattern (organization_id, is_active);

-- ─── System default PdfBankProfile (accountingFirmId = NULL) ─

INSERT INTO finflow.pdf_bank_profile (id, accounting_firm_id, bank_name, layout_patterns, notes)
VALUES
  -- Intesa Sanpaolo: two-date blocks, multi-line descriptions
  (
    'sys_intesa',
    NULL,
    'Intesa Sanpaolo',
    '{
      "linePattern": "(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})",
      "continuationPattern": "^\\s{10,}(?<text>.+)$",
      "skipPatterns": ["^\\s*$", "Data\\s+Valuta", "SALDO\\s+INIZIALE", "SALDO\\s+FINALE", "TOTALE", "Pagina\\s+\\d", "IBAN"],
      "dateFormat": "dd/MM/yyyy",
      "amountDecimal": ",",
      "signConvention": "signed"
    }'::jsonb,
    'Profilo di sistema per Intesa Sanpaolo. Pattern per EC standard con data operazione + data valuta.'
  ),
  -- Unicredit: column-aligned with fixed spacing
  (
    'sys_unicredit',
    NULL,
    'Unicredit',
    '{
      "linePattern": "(?<date>\\d{2}\\.\\d{2}\\.\\d{4})\\s+(?<valuta>\\d{2}\\.\\d{2}\\.\\d{4})\\s+(?<description>.{20,60})\\s+(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?",
      "continuationPattern": "^\\s{20,}(?<text>.+)$",
      "skipPatterns": ["^\\s*$", "Data\\s+Valuta", "Saldo\\s+iniziale", "Saldo\\s+finale", "TOTALE", "Pag\\.?\\s*\\d"],
      "dateFormat": "dd.MM.yyyy",
      "amountDecimal": ",",
      "signConvention": "signed"
    }'::jsonb,
    'Profilo di sistema per Unicredit. Colonne allineate, date con punto.'
  ),
  -- BPER Banca
  (
    'sys_bper',
    NULL,
    'BPER Banca',
    '{
      "linePattern": "(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?",
      "continuationPattern": "^\\s{8,}(?<text>.+)$",
      "skipPatterns": ["^\\s*$", "DATA\\s+OPER", "SALDO\\s+CONTABILE", "TOTALE", "Pagina"],
      "dateFormat": "dd/MM/yyyy",
      "amountDecimal": ",",
      "signConvention": "signed"
    }'::jsonb,
    'Profilo di sistema per BPER Banca.'
  ),
  -- Monte dei Paschi di Siena
  (
    'sys_mps',
    NULL,
    'MPS',
    '{
      "linePattern": "(?<date>\\d{2}\\.\\d{2}\\.\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?",
      "continuationPattern": "^\\s{6,}(?<text>.+)$",
      "skipPatterns": ["^\\s*$", "Data\\s+operazione", "Saldo\\s+iniziale", "Saldo\\s+finale", "TOTALE", "Pag\\."],
      "dateFormat": "dd.MM.yyyy",
      "amountDecimal": ",",
      "signConvention": "signed"
    }'::jsonb,
    'Profilo di sistema per Monte dei Paschi di Siena. Date con punto, formato europeo.'
  ),
  -- Credit Agricole
  (
    'sys_credit_agricole',
    NULL,
    'Crédit Agricole',
    '{
      "linePattern": "(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})",
      "continuationPattern": "^\\s{12,}(?<text>.+)$",
      "skipPatterns": ["^\\s*$", "Data\\s+Operaz", "SALDO", "TOTALE", "Pag\\.", "Estratto", "Conto\\s+corrente"],
      "dateFormat": "dd/MM/yyyy",
      "amountDecimal": ",",
      "signConvention": "signed"
    }'::jsonb,
    'Profilo di sistema per Crédit Agricole Italia. Descrizioni lunghe su più righe.'
  ),
  -- Banca Sella
  (
    'sys_banca_sella',
    NULL,
    'Banca Sella',
    '{
      "linePattern": "(?<date>\\d{2}/\\d{2}/\\d{2,4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?",
      "continuationPattern": null,
      "skipPatterns": ["^\\s*$", "Data", "Saldo", "TOTALE", "Pag\\."],
      "dateFormat": "dd/MM/yyyy",
      "amountDecimal": ",",
      "signConvention": "signed"
    }'::jsonb,
    'Profilo di sistema per Banca Sella. Formato compatto, singola riga per movimento.'
  )
ON CONFLICT DO NOTHING;
