import { prisma } from "@/lib/prisma";
import type {
  RecurringExpenseCreateInput,
  RecurringExpenseUpdateInput,
  OneOffExpenseCreateInput,
  OneOffExpenseUpdateInput,
} from "@/lib/validations/expenses";

// ── Recurring Expenses ──────────────────────────────────────

export async function listRecurringExpenses(organizationId: string) {
  return prisma.recurringExpense.findMany({
    where: { organizationId },
    include: {
      costCenter: { select: { id: true, name: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecurringExpense(id: string, organizationId: string) {
  return prisma.recurringExpense.findFirst({
    where: { id, organizationId },
    include: {
      costCenter: { select: { id: true, name: true, color: true } },
    },
  });
}

export async function createRecurringExpense(
  organizationId: string,
  data: RecurringExpenseCreateInput,
) {
  return prisma.recurringExpense.create({
    data: { ...data, organizationId },
  });
}

export async function updateRecurringExpense(
  id: string,
  organizationId: string,
  data: RecurringExpenseUpdateInput,
) {
  const existing = await prisma.recurringExpense.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  return prisma.recurringExpense.update({
    where: { id },
    data,
  });
}

export async function deleteRecurringExpense(id: string, organizationId: string) {
  const existing = await prisma.recurringExpense.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  return prisma.recurringExpense.delete({ where: { id } });
}

// ── One-Off Expenses ────────────────────────────────────────

export async function listOneOffExpenses(organizationId: string) {
  return prisma.oneOffExpense.findMany({
    where: { organizationId },
    include: {
      costCenter: { select: { id: true, name: true, color: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function getOneOffExpense(id: string, organizationId: string) {
  return prisma.oneOffExpense.findFirst({
    where: { id, organizationId },
    include: {
      costCenter: { select: { id: true, name: true, color: true } },
    },
  });
}

export async function createOneOffExpense(organizationId: string, data: OneOffExpenseCreateInput) {
  return prisma.oneOffExpense.create({
    data: { ...data, organizationId },
  });
}

export async function updateOneOffExpense(
  id: string,
  organizationId: string,
  data: OneOffExpenseUpdateInput,
) {
  const existing = await prisma.oneOffExpense.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  return prisma.oneOffExpense.update({
    where: { id },
    data,
  });
}

export async function deleteOneOffExpense(id: string, organizationId: string) {
  const existing = await prisma.oneOffExpense.findFirst({
    where: { id, organizationId },
  });
  if (!existing) return null;

  return prisma.oneOffExpense.delete({ where: { id } });
}
