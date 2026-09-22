import { ExpenseType } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export interface BudgetSummaryResponse {
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface CategoryBudgetRecord {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentage: number;
  month: number;
  year: number;
}

export interface SmartAlert {
  id: string;
  type: 'WARNING' | 'DANGER' | 'SUCCESS' | 'INSIGHT';
  title: string;
  message: string;
  category?: string;
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
 * Fetch all category budgets for a user for a given month and year.
 * Calculates spent dynamically from PostgreSQL expenses.
 */
export async function getUserCategoryBudgets(
  userId: string,
  month?: number,
  year?: number
): Promise<CategoryBudgetRecord[]> {
  const dbUserId = await getDbUserId(userId);
  const now = new Date();
  const targetMonth = month !== undefined && !isNaN(Number(month)) && Number(month) >= 1 && Number(month) <= 12
    ? Number(month)
    : now.getMonth() + 1;
  const targetYear = year !== undefined && !isNaN(Number(year)) && Number(year) > 2000
    ? Number(year)
    : now.getFullYear();

  const budgets = await prisma.budget.findMany({
    where: {
      userId: dbUserId,
      month: targetMonth,
      year: targetYear,
    },
  });

  const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  const expenses = await prisma.expense.findMany({
    where: {
      userId: dbUserId,
      type: ExpenseType.EXPENSE,
      spentAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
    },
  });

  // Calculate spent per category
  const categorySpentMap: Record<string, number> = {};
  for (const exp of expenses) {
    const catName = exp.category?.name || 'Uncategorized';
    categorySpentMap[catName.toLowerCase()] = (categorySpentMap[catName.toLowerCase()] || 0) + exp.amount;
  }

  return budgets.map((b) => {
    const catLower = b.category.toLowerCase();
    const spent = Math.round((categorySpentMap[catLower] || 0) * 100) / 100;
    const remaining = Math.round((b.monthlyLimit - spent) * 100) / 100;
    const percentage = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;

    return {
      id: b.id,
      category: b.category,
      monthlyLimit: b.monthlyLimit,
      spent,
      remaining,
      percentage,
      month: b.month,
      year: b.year,
    };
  });
}

/**
 * Upsert category budget in PostgreSQL.
 */
export async function upsertCategoryBudget(
  userId: string,
  data: {
    category: string;
    monthlyLimit: number;
    month?: number;
    year?: number;
  }
) {
  const dbUserId = await getDbUserId(userId);
  const now = new Date();
  const targetMonth = data.month !== undefined && !isNaN(Number(data.month)) ? Number(data.month) : now.getMonth() + 1;
  const targetYear = data.year !== undefined && !isNaN(Number(data.year)) ? Number(data.year) : now.getFullYear();
  const limit = Math.max(0, Number(data.monthlyLimit) || 0);
  const cleanCat = data.category ? data.category.trim() : 'Groceries';

  const result = await prisma.budget.upsert({
    where: {
      userId_category_month_year: {
        userId: dbUserId,
        category: cleanCat,
        month: targetMonth,
        year: targetYear,
      },
    },
    update: {
      monthlyLimit: limit,
    },
    create: {
      userId: dbUserId,
      category: cleanCat,
      monthlyLimit: limit,
      month: targetMonth,
      year: targetYear,
    },
  });

  return result;
}

/**
 * Update budget record by ID.
 */
export async function updateCategoryBudget(
  userId: string,
  budgetId: string,
  data: { monthlyLimit?: number; category?: string }
) {
  const dbUserId = await getDbUserId(userId);

  const existing = await prisma.budget.findFirst({
    where: { id: budgetId, userId: dbUserId },
  });

  if (!existing) {
    throw new Error('Budget record not found');
  }

  const updated = await prisma.budget.update({
    where: { id: budgetId },
    data: {
      ...(data.monthlyLimit !== undefined ? { monthlyLimit: Math.max(0, Number(data.monthlyLimit)) } : {}),
      ...(data.category ? { category: data.category.trim() } : {}),
    },
  });

  return updated;
}

/**
 * Delete category budget by ID.
 */
export async function deleteCategoryBudget(userId: string, budgetId: string) {
  const dbUserId = await getDbUserId(userId);
  const existing = await prisma.budget.findFirst({
    where: { id: budgetId, userId: dbUserId },
  });

  if (!existing) {
    throw new Error('Budget record not found');
  }

  await prisma.budget.delete({
    where: { id: budgetId },
  });

  return { success: true };
}

/**
 * Calculate budget insights, totals, breakdown, and AI smart alerts from PostgreSQL.
 */
export async function getBudgetInsights(
  userId: string,
  month?: number,
  year?: number
) {
  const dbUserId = await getDbUserId(userId);
  const now = new Date();
  const targetMonth = month !== undefined && !isNaN(Number(month)) ? Number(month) : now.getMonth() + 1;
  const targetYear = year !== undefined && !isNaN(Number(year)) ? Number(year) : now.getFullYear();

  const budgets = await getUserCategoryBudgets(dbUserId, targetMonth, targetYear);

  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remaining = Math.round((totalBudget - totalSpent) * 100) / 100;
  const percentageUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Smart Alerts generation
  const alerts: SmartAlert[] = [];

  for (const b of budgets) {
    if (b.percentage >= 100) {
      const overspend = Math.round((b.spent - b.monthlyLimit) * 100) / 100;
      alerts.push({
        id: `alert_over_${b.id}`,
        type: 'DANGER',
        title: `${b.category} Budget Exceeded`,
        message: `${b.category} budget exceeded by ₹${overspend.toLocaleString('en-IN')}.`,
        category: b.category,
      });
    } else if (b.percentage >= 80) {
      alerts.push({
        id: `alert_warn_${b.id}`,
        type: 'WARNING',
        title: `${b.category} High Spend Warning`,
        message: `You've used ${b.percentage}% of your ${b.category} budget.`,
        category: b.category,
      });
    }
  }

  if (remaining > 0) {
    alerts.push({
      id: `alert_safe_${targetMonth}_${targetYear}`,
      type: 'SUCCESS',
      title: 'Safe Spend Allowance',
      message: `You can still spend ₹${remaining.toLocaleString('en-IN')} this month.`,
    });
  }

  // Month over month insight comparison for top category
  if (budgets.length > 0) {
    const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;

    const prevBudgets = await getUserCategoryBudgets(dbUserId, prevMonth, prevYear);
    const topCurrent = [...budgets].sort((a, b) => b.spent - a.spent)[0];

    if (topCurrent) {
      const prevMatch = prevBudgets.find((p) => p.category.toLowerCase() === topCurrent.category.toLowerCase());
      if (prevMatch && prevMatch.spent > 0) {
        const diff = prevMatch.spent - topCurrent.spent;
        const diffPct = Math.abs(Math.round((diff / prevMatch.spent) * 100));
        if (diff > 0) {
          alerts.push({
            id: `alert_mom_${topCurrent.id}`,
            type: 'INSIGHT',
            title: 'Spending Improvement',
            message: `${topCurrent.category} spend is ${diffPct}% lower than last month.`,
            category: topCurrent.category,
          });
        }
      }
    }
  }

  return {
    totalBudget,
    totalSpent,
    remaining,
    percentageUsed,
    categoryBreakdown: budgets,
    smartAlerts: alerts,
  };
}

/**
 * Legacy support for current monthly budget summary.
 */
export async function getCurrentBudget(userId: string, month?: number, year?: number) {
  const insights = await getBudgetInsights(userId, month, year);
  return {
    month: month || new Date().getMonth() + 1,
    year: year || new Date().getFullYear(),
    budget: insights.totalBudget,
    record: null,
  };
}

export async function setBudget(userId: string, month: number, year: number, amount: number) {
  return upsertCategoryBudget(userId, {
    category: 'Overall',
    monthlyLimit: amount,
    month,
    year,
  });
}

export async function getBudgetSummary(
  userId: string,
  month?: number,
  year?: number
): Promise<BudgetSummaryResponse> {
  const insights = await getBudgetInsights(userId, month, year);
  return {
    budget: insights.totalBudget,
    spent: insights.totalSpent,
    remaining: insights.remaining,
    percentage: insights.percentageUsed,
  };
}
