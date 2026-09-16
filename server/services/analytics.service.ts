import { prisma } from "../db/prisma.js";

/**
 * Get overall dashboard stats for user
 */
export async function getDashboardStats(userId: string) {
  const expenses = await prisma.expense.findMany({
    where: { userId },
    select: { amount: true },
  });

  const transactionCount = expenses.length;
  if (transactionCount === 0) {
    return {
      totalExpenses: 0,
      transactionCount: 0,
      averageExpense: 0,
      highestExpense: 0,
    };
  }

  let totalExpenses = 0;
  let highestExpense = 0;

  for (const exp of expenses) {
    totalExpenses += exp.amount;
    if (exp.amount > highestExpense) {
      highestExpense = exp.amount;
    }
  }

  const averageExpense = totalExpenses / transactionCount;

  return {
    totalExpenses: Number(totalExpenses.toFixed(2)),
    transactionCount,
    averageExpense: Number(averageExpense.toFixed(2)),
    highestExpense: Number(highestExpense.toFixed(2)),
  };
}

/**
 * Get 12-month spending trend for user
 */
export async function getMonthlyTrend(userId: string) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      spentAt: {
        gte: twelveMonthsAgo,
      },
    },
    select: {
      amount: true,
      spentAt: true,
    },
    orderBy: {
      spentAt: "asc",
    },
  });

  // Group by YYYY-MM
  const monthMap = new Map<string, number>();

  // Pre-fill last 12 months with 0
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, 0);
  }

  for (const exp of expenses) {
    const d = new Date(exp.spentAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) || 0) + exp.amount);
    }
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const trend = Array.from(monthMap.entries()).map(([monthKey, totalAmount]) => {
    const [yearStr, monthStr] = monthKey.split("-");
    const mIdx = parseInt(monthStr, 10) - 1;
    return {
      month: monthKey,
      label: `${monthNames[mIdx]} ${yearStr}`,
      totalAmount: Number(totalAmount.toFixed(2)),
    };
  });

  return trend;
}

/**
 * Get category breakdown for user (optional month & year filter)
 */
export async function getCategoryBreakdown(userId: string, month?: number, year?: number) {
  let dateFilter: any = {};
  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    dateFilter = {
      spentAt: {
        gte: startDate,
        lte: endDate,
      },
    };
  }

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      ...dateFilter,
    },
    include: {
      category: true,
    },
  });

  const categoryMap = new Map<
    string,
    { categoryId: string; categoryName: string; color: string; totalAmount: number; count: number }
  >();

  for (const exp of expenses) {
    const catId = exp.categoryId || "uncategorized";
    const catName = exp.category?.name || "Uncategorized";
    const color = exp.category?.color || "#94A3B8";

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        categoryId: catId,
        categoryName: catName,
        color,
        totalAmount: 0,
        count: 0,
      });
    }

    const item = categoryMap.get(catId)!;
    item.totalAmount += exp.amount;
    item.count += 1;
  }

  const breakdown = Array.from(categoryMap.values())
    .map((c) => ({
      ...c,
      totalAmount: Number(c.totalAmount.toFixed(2)),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return breakdown;
}

/**
 * Get current week's daily spending (Monday to Sunday)
 */
export async function getWeeklySpending(userId: string) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const distanceToMon = (dayOfWeek + 6) % 7;

  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMon);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      spentAt: {
        gte: monday,
        lte: sunday,
      },
    },
    select: {
      amount: true,
      spentAt: true,
    },
  });

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekMap = new Map<string, { date: string; day: string; amount: number }>();

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    weekMap.set(dateStr, {
      date: dateStr,
      day: days[i],
      amount: 0,
    });
  }

  for (const exp of expenses) {
    const dateStr = new Date(exp.spentAt).toISOString().split("T")[0];
    if (weekMap.has(dateStr)) {
      const item = weekMap.get(dateStr)!;
      item.amount += exp.amount;
    }
  }

  return Array.from(weekMap.values()).map((d) => ({
    ...d,
    amount: Number(d.amount.toFixed(2)),
  }));
}

/**
 * Get top 5 merchants/items by total spending
 */
export async function getTopMerchants(userId: string) {
  const expenses = await prisma.expense.findMany({
    where: { userId },
    select: {
      title: true,
      amount: true,
    },
  });

  const merchantMap = new Map<string, { merchant: string; totalAmount: number; count: number }>();

  for (const exp of expenses) {
    const name = exp.title.trim() || "Unknown Merchant";
    const key = name.toLowerCase();

    if (!merchantMap.has(key)) {
      merchantMap.set(key, {
        merchant: name,
        totalAmount: 0,
        count: 0,
      });
    }

    const item = merchantMap.get(key)!;
    item.totalAmount += exp.amount;
    item.count += 1;
  }

  const topMerchants = Array.from(merchantMap.values())
    .map((m) => ({
      ...m,
      totalAmount: Number(m.totalAmount.toFixed(2)),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  return topMerchants;
}
