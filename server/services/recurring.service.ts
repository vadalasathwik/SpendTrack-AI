import { prisma } from "../db/prisma.js";
import { Frequency } from "@prisma/client";

export interface CreateRecurringData {
  title: string;
  amount: number;
  categoryId: string;
  frequency: Frequency;
  startDate?: string | Date;
  nextRun?: string | Date;
  note?: string;
  isActive?: boolean;
}

export interface UpdateRecurringData {
  title?: string;
  amount?: number;
  categoryId?: string;
  frequency?: Frequency;
  startDate?: string | Date;
  nextRun?: string | Date;
  note?: string;
  isActive?: boolean;
}

/**
 * Calculate the next run date based on current nextRun and frequency
 */
export function calculateNextRunDate(currentNextRun: Date, frequency: Frequency): Date {
  const next = new Date(currentNextRun);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

/**
 * Get all recurring expenses for user
 */
export async function getRecurringExpenses(userId: string) {
  return prisma.recurringExpense.findMany({
    where: { userId },
    include: {
      category: true,
    },
    orderBy: {
      nextRun: "asc",
    },
  });
}

/**
 * Create a new recurring expense
 */
export async function createRecurringExpense(userId: string, data: CreateRecurringData) {
  if (!data.title || !data.title.trim()) {
    throw new Error("Title is required");
  }
  if (data.amount === undefined || data.amount <= 0) {
    throw new Error("Valid positive amount is required");
  }
  if (!data.categoryId) {
    throw new Error("Category ID is required");
  }

  // Verify category belongs to user
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, userId },
  });
  if (!category) {
    throw new Error("Category not found");
  }

  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const nextRun = data.nextRun ? new Date(data.nextRun) : startDate;

  return prisma.recurringExpense.create({
    data: {
      title: data.title.trim(),
      amount: Number(data.amount),
      categoryId: data.categoryId,
      userId,
      frequency: data.frequency || "MONTHLY",
      startDate,
      nextRun,
      note: data.note ? data.note.trim() : null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    include: {
      category: true,
    },
  });
}

/**
 * Update a recurring expense
 */
export async function updateRecurringExpense(userId: string, id: string, data: UpdateRecurringData) {
  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Recurring expense not found");
  }

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId },
    });
    if (!category) {
      throw new Error("Category not found");
    }
  }

  return prisma.recurringExpense.update({
    where: { id },
    data: {
      ...(data.title ? { title: data.title.trim() } : {}),
      ...(data.amount !== undefined ? { amount: Number(data.amount) } : {}),
      ...(data.categoryId ? { categoryId: data.categoryId } : {}),
      ...(data.frequency ? { frequency: data.frequency } : {}),
      ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
      ...(data.nextRun ? { nextRun: new Date(data.nextRun) } : {}),
      ...(data.note !== undefined ? { note: data.note ? data.note.trim() : null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
    include: {
      category: true,
    },
  });
}

/**
 * Delete a recurring expense
 */
export async function deleteRecurringExpense(userId: string, id: string) {
  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Recurring expense not found");
  }

  return prisma.recurringExpense.delete({
    where: { id },
  });
}

/**
 * Skip the current execution run of a recurring item once
 */
export async function skipOnceRecurringExpense(userId: string, id: string) {
  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Recurring expense not found");
  }

  const nextRunDate = calculateNextRunDate(existing.nextRun, existing.frequency);
  return prisma.recurringExpense.update({
    where: { id },
    data: { nextRun: nextRunDate },
    include: {
      category: true,
    },
  });
}

/**
 * Process due recurring expenses inside a transaction
 */
export async function processDueRecurringExpenses(userId?: string) {
  const now = new Date();

  // Find due active recurring items
  const dueItems = await prisma.recurringExpense.findMany({
    where: {
      isActive: true,
      nextRun: { lte: now },
      ...(userId ? { userId } : {}),
    },
  });

  if (dueItems.length === 0) {
    return { processedCount: 0, createdExpenses: [] };
  }

  const createdExpenses: any[] = [];

  await prisma.$transaction(async (tx) => {
    for (const item of dueItems) {
      // Check for duplicate expense created on exact same spentAt date for this title & user
      const executionDate = new Date(item.nextRun);
      const startOfDay = new Date(executionDate.getFullYear(), executionDate.getMonth(), executionDate.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(executionDate.getFullYear(), executionDate.getMonth(), executionDate.getDate(), 23, 59, 59, 999);

      const duplicate = await tx.expense.findFirst({
        where: {
          userId: item.userId,
          title: item.title,
          amount: item.amount,
          categoryId: item.categoryId,
          spentAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (!duplicate) {
        const createdExp = await tx.expense.create({
          data: {
            title: item.title,
            amount: item.amount,
            type: "EXPENSE",
            note: item.note ? `Auto-generated recurring: ${item.note}` : "Auto-generated recurring expense",
            spentAt: executionDate,
            categoryId: item.categoryId,
            userId: item.userId,
          },
        });
        createdExpenses.push(createdExp);
      }

      // Compute next run date
      const nextRunDate = calculateNextRunDate(item.nextRun, item.frequency);

      await tx.recurringExpense.update({
        where: { id: item.id },
        data: {
          nextRun: nextRunDate,
        },
      });
    }
  });

  return {
    processedCount: createdExpenses.length,
    createdExpenses,
  };
}
