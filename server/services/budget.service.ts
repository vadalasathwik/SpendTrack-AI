import { ExpenseType } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export interface BudgetSummaryResponse {
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

async function getDbUserId(userId: string): Promise<string> {
  if (!userId) throw new Error('User ID required');
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: userId },
        { googleId: userId },
        { email: userId },
      ],
    },
  });
  if (user) return user.id;

  const newUser = await prisma.user.create({
    data: {
      id: userId,
      googleId: userId,
      email: `${userId}@example.com`,
      name: `User ${userId}`,
    },
  });
  return newUser.id;
}

/**
 * Get current monthly budget for a user.
 */
export async function getCurrentBudget(userId: string, month?: number, year?: number) {
  const dbUserId = await getDbUserId(userId);
  const now = new Date();
  const targetMonth = month !== undefined && month >= 1 && month <= 12 ? Number(month) : now.getMonth() + 1;
  const targetYear = year !== undefined && year > 2000 ? Number(year) : now.getFullYear();

  const record = await prisma.monthlyBudget.findUnique({
    where: {
      month_year_userId: {
        month: targetMonth,
        year: targetYear,
        userId: dbUserId,
      },
    },
  });

  return {
    month: targetMonth,
    year: targetYear,
    budget: record ? record.budget : 0,
    record: record || null,
  };
}

/**
 * Set or update monthly budget for a user.
 */
export async function setBudget(userId: string, month: number, year: number, amount: number) {
  const dbUserId = await getDbUserId(userId);
  const budgetVal = Number(amount);

  if (isNaN(budgetVal) || budgetVal < 0) {
    throw new Error('Invalid budget amount');
  }

  const targetMonth = Number(month);
  const targetYear = Number(year);

  if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
    throw new Error('Invalid month (1-12)');
  }
  if (isNaN(targetYear) || targetYear < 2000) {
    throw new Error('Invalid year');
  }

  const updated = await prisma.monthlyBudget.upsert({
    where: {
      month_year_userId: {
        month: targetMonth,
        year: targetYear,
        userId: dbUserId,
      },
    },
    update: {
      budget: budgetVal,
    },
    create: {
      month: targetMonth,
      year: targetYear,
      budget: budgetVal,
      userId: dbUserId,
    },
  });

  return updated;
}

/**
 * Calculate budget summary for a user: budget, spent, remaining, percentage.
 * Uses Prisma aggregate SUM(amount) where type = EXPENSE.
 */
export async function getBudgetSummary(
  userId: string,
  month?: number,
  year?: number
): Promise<BudgetSummaryResponse> {
  const dbUserId = await getDbUserId(userId);
  const now = new Date();
  const targetMonth = month !== undefined && !isNaN(Number(month)) && Number(month) >= 1 && Number(month) <= 12
    ? Number(month)
    : now.getMonth() + 1;
  const targetYear = year !== undefined && !isNaN(Number(year)) && Number(year) > 2000
    ? Number(year)
    : now.getFullYear();

  const budgetRecord = await prisma.monthlyBudget.findUnique({
    where: {
      month_year_userId: {
        month: targetMonth,
        year: targetYear,
        userId: dbUserId,
      },
    },
  });

  const budget = budgetRecord ? budgetRecord.budget : 0;

  const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  const aggregate = await prisma.expense.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      userId: dbUserId,
      type: ExpenseType.EXPENSE,
      spentAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const spent = aggregate._sum.amount ?? 0;
  const remaining = Number((budget - spent).toFixed(2));
  const percentage = budget > 0 ? Number(((spent / budget) * 100).toFixed(2)) : 0;

  return {
    budget,
    spent,
    remaining,
    percentage,
  };
}
