import { ExpenseType, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export interface CreateExpenseInput {
  title?: string;
  itemName?: string;
  amount?: number;
  totalPrice?: number;
  type?: ExpenseType;
  note?: string | null;
  notes?: string | null;
  spentAt?: Date | string;
  purchaseDate?: Date | string;
  categoryId?: string;
  category?: string;
}

export interface UpdateExpenseInput {
  title?: string;
  itemName?: string;
  amount?: number;
  totalPrice?: number;
  type?: ExpenseType;
  note?: string | null;
  notes?: string | null;
  spentAt?: Date | string;
  purchaseDate?: Date | string;
  categoryId?: string;
  category?: string;
}

async function getDbUserId(userId: string): Promise<string> {
  if (!userId) return userId;
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: userId },
        { googleId: userId },
      ],
    },
  });
  return user ? user.id : userId;
}

function formatExpenseResponse(exp: any) {
  return {
    ...exp,
    id: exp.id,
    itemName: exp.title,
    title: exp.title,
    totalPrice: exp.amount,
    amount: exp.amount,
    purchaseDate: exp.spentAt instanceof Date ? exp.spentAt.toISOString().split('T')[0] : exp.spentAt,
    spentAt: exp.spentAt,
    category: exp.category?.name || exp.category || 'General',
    categoryId: exp.categoryId,
    notes: exp.note ?? '',
    createdAt: exp.createdAt,
    updatedAt: exp.createdAt,
  };
}

/**
 * Fetch all expenses for a given user.
 */
export async function getExpenses(userId: string) {
  const dbUserId = await getDbUserId(userId);
  const expenses = await prisma.expense.findMany({
    where: { userId: dbUserId },
    include: {
      category: true,
    },
    orderBy: {
      spentAt: 'desc',
    },
  });

  return expenses.map((exp) => formatExpenseResponse(exp));
}

/**
 * Create a new expense for a user.
 */
export async function createExpense(userId: string, data: CreateExpenseInput) {
  const dbUserId = await getDbUserId(userId);
  const title = data.title || data.itemName || 'Untitled Expense';
  const amount = Number(data.amount ?? data.totalPrice ?? 0);
  const spentAt = data.spentAt || data.purchaseDate ? new Date(data.spentAt || data.purchaseDate!) : new Date();
  const note = data.note ?? data.notes ?? null;
  const type = data.type === ExpenseType.INCOME ? ExpenseType.INCOME : ExpenseType.EXPENSE;

  let categoryId = data.categoryId;
  if (!categoryId && data.category) {
    let cat = await prisma.category.findFirst({
      where: { userId: dbUserId, name: data.category },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          userId: dbUserId,
          name: data.category,
          color: '#6366F1',
          icon: 'wallet',
        },
      });
    }
    categoryId = cat.id;
  }

  if (!categoryId) {
    let defaultCat = await prisma.category.findFirst({
      where: { userId: dbUserId },
    });
    if (!defaultCat) {
      defaultCat = await prisma.category.create({
        data: {
          userId: dbUserId,
          name: 'General',
          color: '#6366F1',
          icon: 'wallet',
        },
      });
    }
    categoryId = defaultCat.id;
  }

  const createdExpense = await prisma.expense.create({
    data: {
      title,
      amount,
      type,
      note,
      spentAt,
      categoryId,
      userId: dbUserId,
    },
    include: {
      category: true,
    },
  });

  console.log("Creating expense...");
  console.log(createdExpense);

  return formatExpenseResponse(createdExpense);
}

/**
 * Update an existing expense for a user inside a Prisma transaction.
 */
export async function updateExpense(
  userId: string,
  expenseId: string,
  data: UpdateExpenseInput
) {
  const dbUserId = await getDbUserId(userId);
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findFirst({
      where: {
        id: expenseId,
        userId: dbUserId,
      },
    });

    if (!existing) {
      throw new Error('Expense not found');
    }

    const updateData: Prisma.ExpenseUpdateInput = {};

    if (data.title !== undefined || data.itemName !== undefined) {
      updateData.title = data.title || data.itemName;
    }
    if (data.amount !== undefined || data.totalPrice !== undefined) {
      updateData.amount = Number(data.amount ?? data.totalPrice);
    }
    if (data.type !== undefined) {
      updateData.type = data.type === ExpenseType.INCOME ? ExpenseType.INCOME : ExpenseType.EXPENSE;
    }
    if (data.note !== undefined || data.notes !== undefined) {
      updateData.note = data.note ?? data.notes ?? null;
    }
    if (data.spentAt !== undefined || data.purchaseDate !== undefined) {
      updateData.spentAt = new Date(data.spentAt || data.purchaseDate!);
    }

    if (data.categoryId !== undefined) {
      updateData.category = { connect: { id: data.categoryId } };
    } else if (data.category !== undefined) {
      let cat = await tx.category.findFirst({
        where: { userId: dbUserId, name: data.category },
      });
      if (!cat) {
        cat = await tx.category.create({
          data: {
            userId: dbUserId,
            name: data.category,
            color: '#6366F1',
            icon: 'wallet',
          },
        });
      }
      updateData.category = { connect: { id: cat.id } };
    }

    const updated = await tx.expense.update({
      where: { id: expenseId },
      data: updateData,
      include: {
        category: true,
      },
    });

    return formatExpenseResponse(updated);
  });
}

/**
 * Delete an expense for a user inside a Prisma transaction.
 */
export async function deleteExpense(userId: string, expenseId: string) {
  const dbUserId = await getDbUserId(userId);
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findFirst({
      where: {
        id: expenseId,
        userId: dbUserId,
      },
    });

    if (!existing) {
      throw new Error('Expense not found');
    }

    await tx.expense.delete({
      where: { id: expenseId },
    });

    return { success: true };
  });
}
