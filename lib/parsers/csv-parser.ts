import Papa from "papaparse";

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: Papa.ParseError[];
}

/**
 * Parse a CSV string into headers + rows.
 * Uses PapaParse with sensible defaults for Italian CSVs.
 */
export function parseCsv(
  csvContent: string,
  options?: { skipRows?: number; delimiter?: string },
): ParsedCsvResult {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    delimiter: options?.delimiter,
    transformHeader: (h) => h.trim(),
  });

  let rows = result.data;
  if (options?.skipRows && options.skipRows > 0) {
    rows = rows.slice(options.skipRows);
  }

  return {
    headers: result.meta.fields ?? [],
    rows,
    errors: result.errors,
  };
}

/**
 * Parse a numeric string with Italian decimal separator.
 * "1.234,56" → 1234.56 | "1234.56" → 1234.56
 */
export function parseItalianNumber(
  value: string,
  decimalSeparator: "," | "." = ",",
): number | null {
  if (!value || !value.trim()) return null;
  let cleaned = value.trim();

  if (decimalSeparator === ",") {
    // Remove dots (thousands), replace comma with dot (decimal)
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse a date string with a configurable format.
 * Supports: dd/MM/yyyy, dd-MM-yyyy, dd.MM.yyyy, dd.MM.yy, yyyy-MM-dd
 * Auto-detects the separator (/, -, .) and handles 2-digit years.
 */
export function parseDate(value: string, format: string = "dd/MM/yyyy"): Date | null {
  if (!value || !value.trim()) return null;
  const cleaned = value.trim();

  try {
    if (format === "yyyy-MM-dd") {
      const d = new Date(cleaned);
      return isNaN(d.getTime()) ? null : d;
    }

    // Auto-detect separator: try /, -, .
    const parts = cleaned.split(/[\/\-\.]/);
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);

    // Handle 2-digit years: 00-99 → 2000-2099
    if (year < 100) {
      year += 2000;
    }

    if (day < 1 || day > 31 || month < 0 || month > 11) return null;

    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}
