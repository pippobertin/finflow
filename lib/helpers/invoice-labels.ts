/**
 * Terminologia: "Incassata" per fatture attive, "Pagata" per passive.
 * La logica di business non cambia — cambia solo la rappresentazione visiva.
 *
 * OVERDUE non è più uno status DB — viene calcolato dinamicamente da dueDate.
 */

export function isOverdue(dueDate: Date | string | null | undefined): boolean {
  if (!dueDate) return false;
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return due < new Date();
}

export function getStatusLabel(
  status: string,
  direction?: string,
  dueDate?: Date | string | null,
): string {
  if (status === "PAID") {
    return direction === "ACTIVE" ? "Incassata" : "Pagata";
  }
  if (status === "PENDING" && isOverdue(dueDate)) {
    return "Scaduta";
  }
  if (status === "PENDING") {
    return "In attesa";
  }
  return status;
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

export const ALL_STATUSES = ["PENDING", "PAID"] as const;

export function getStatusOptions(direction?: string) {
  return ALL_STATUSES.map((value) => ({
    value,
    label: getStatusLabel(value, direction),
  }));
}

export const statusColors: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-slate-50 text-slate-600 border-slate-200",
  OVERDUE_BADGE: "bg-red-50 text-red-700 border-red-200",
};
