/**
 * Feature flags di transizione V1 → V2.
 *
 * Questi flag controllano la sospensione del codice legacy durante la
 * migrazione a FinFlow V2. Sono hardcoded di proposito (nessuna override
 * via env var) perché governano codice che va solo spento/acceso durante
 * il refactor, non feature a rilascio graduale.
 *
 * Ciclo di vita:
 * - Creati in Fase 0 con valore `false` (legacy disabilitato)
 * - Restano `false` per tutta la durata delle Fasi 1-3
 * - Vengono rimossi a fine Fase 3 insieme al codice legacy corrispondente
 *
 * Razionale completo: docs/adr/002-feature-flags-over-deletion.md
 */
export const FEATURES = {
  /** Reconciliation engine, route /reconciliation, hook, components */
  LEGACY_RECONCILIATION: false,
  /** Parser FatturPA, P7M, CAdES — usato nel flusso di import */
  LEGACY_FATTURAPA_IMPORT: false,
  /** Connettore FattureInCloud — usato nei connector/settings dell'app */
  LEGACY_FATTUREINCLOUD: false,
} as const;

/**
 * Restituisce la lista di path di pagina disabilitati in base ai flag attivi.
 * Importata dal proxy (ex middleware) per il redirect a runtime.
 *
 * Nota: il `config.matcher` nel proxy è statico (letto a build time),
 * ma la logica di redirect a runtime usa questa funzione.
 */
export function getDisabledRoutes(): string[] {
  const disabled: string[] = [];
  if (!FEATURES.LEGACY_RECONCILIATION) disabled.push("/reconciliation");
  return disabled;
}
