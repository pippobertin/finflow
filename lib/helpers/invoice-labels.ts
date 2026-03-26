/**
 * Terminologia Fase 2: "Incassata" per fatture attive, "Pagata" per passive.
 * La logica di business non cambia — cambia solo la rappresentazione visiva.
 */

export function getStatusLabel(status: string, direction?: string): string {
  switch (status) {
    case "PAID":
      return direction === "ACTIVE" ? "Incassata" : "Pagata";
    case "PARTIALLY_PAID":
      return direction === "ACTIVE" ? "Parz. incassata" : "Parz. pagata";
    case "PENDING":
      return "In attesa";
    case "OVERDUE":
      return "Scaduta";
    case "DRAFT":
      return "Bozza";
    default:
      return status;
  }
}

export function getPaymentDateLabel(direction?: string): string {
  return direction === "ACTIVE" ? "Data incasso" : "Data pagamento";
}

export function getPaymentActionLabel(direction?: string): string {
  return direction === "ACTIVE" ? "Registra incasso" : "Registra pagamento";
}

export function getPaidSuccessMessage(direction?: string): string {
  return direction === "ACTIVE" ? 'Stato aggiornato a "Incassata"' : 'Stato aggiornato a "Pagata"';
}

export const ALL_STATUSES = ["PAID", "PARTIALLY_PAID", "PENDING", "OVERDUE", "DRAFT"] as const;

export function getStatusOptions(direction?: string) {
  return ALL_STATUSES.map((value) => ({
    value,
    label: getStatusLabel(value, direction),
  }));
}

export const statusColors: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-slate-50 text-slate-600 border-slate-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  DRAFT: "bg-slate-50 text-slate-400 border-slate-200",
};
