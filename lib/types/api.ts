/** Shared API response types */

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MutationResult {
  success: boolean;
  message?: string;
}

export interface ImportResult {
  imported: number;
  tagged: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
}

export interface FatturapaInvoiceSummary {
  number: string;
  counterpart: string;
  grossAmount: number;
  documentType: string;
}

export interface FatturapaImportResult extends ImportResult {
  skipped: number;
  warnings: Array<{ file: string; message: string }>;
  importedDetails: FatturapaInvoiceSummary[];
  skippedDetails: FatturapaInvoiceSummary[];
  taggedDetails: FatturapaInvoiceSummary[];
}
