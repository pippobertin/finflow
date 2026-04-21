/**
 * Italian display labels for CdgCategory enum values.
 */

export const CDG_CATEGORY_LABELS: Record<string, string> = {
  REVENUE: "Ricavi",
  VAR_COST_MATERIALS: "Costi var. — Materiali",
  VAR_COST_SERVICES: "Costi var. — Servizi",
  VAR_COST_DIRECT_LABOR: "Costi var. — Manodopera",
  FIXED_COST_DEPRECIATION: "Costi fissi — Ammortamenti",
  FIXED_COST_ADMIN_COMPENSATION: "Costi fissi — Compensi amm.",
  FIXED_COST_RENT: "Costi fissi — Affitti",
  FIXED_COST_UTILITIES: "Costi fissi — Utenze",
  FIXED_COST_INSURANCE: "Costi fissi — Assicurazioni",
  FIXED_COST_CONSULTING: "Costi fissi — Consulenze",
  FIXED_COST_MARKETING: "Costi fissi — Marketing",
  FIXED_COST_GENERAL: "Costi fissi — Generali",
  FINANCIAL_INCOME: "Proventi finanziari",
  FINANCIAL_EXPENSE: "Oneri finanziari",
  EXTRAORDINARY_INCOME: "Proventi straordinari",
  EXTRAORDINARY_EXPENSE: "Oneri straordinari",
  TAX_INCOME: "Imposte sul reddito",
};

/** Group labels for organizing the dropdown */
export const CDG_CATEGORY_GROUPS: { label: string; categories: string[] }[] = [
  {
    label: "Ricavi",
    categories: ["REVENUE"],
  },
  {
    label: "Costi variabili",
    categories: ["VAR_COST_MATERIALS", "VAR_COST_SERVICES", "VAR_COST_DIRECT_LABOR"],
  },
  {
    label: "Costi fissi",
    categories: [
      "FIXED_COST_DEPRECIATION",
      "FIXED_COST_ADMIN_COMPENSATION",
      "FIXED_COST_RENT",
      "FIXED_COST_UTILITIES",
      "FIXED_COST_INSURANCE",
      "FIXED_COST_CONSULTING",
      "FIXED_COST_MARKETING",
      "FIXED_COST_GENERAL",
    ],
  },
  {
    label: "Gestione finanziaria",
    categories: ["FINANCIAL_INCOME", "FINANCIAL_EXPENSE"],
  },
  {
    label: "Gestione straordinaria",
    categories: ["EXTRAORDINARY_INCOME", "EXTRAORDINARY_EXPENSE"],
  },
  {
    label: "Imposte",
    categories: ["TAX_INCOME"],
  },
];
