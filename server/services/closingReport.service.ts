import { prisma } from '../db/prisma.js';
import { getCfoCashflow } from './cfoCashflow.service.js';
import { getMonthlyFinancialHealth } from './aiCfo.service.ts';

export interface MonthlyClosingReport {
  monthName: string;
  year: number;
  income: number;
  spent: number;
  emi: number;
  investments: number;
  savings: number;
  freeCash: number;
  savingRate: number;
  healthScore: number;
  topCategories: { category: string; amount: number; percent: number }[];
  biggestPurchase: { title: string; amount: number; date: string; category: string } | null;
  aiSummary: string;
}

export async function getMonthlyClosingReport(
  userId: string,
  month?: number,
  year?: number
): Promise<MonthlyClosingReport> {
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();

  const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
  const endOfMonth = new Date(targetYear, targetMonth, 0);

  const monthName = startOfMonth.toLocaleDateString('en-US', { month: 'long' });

  const cashflow = await getCfoCashflow(userId);
  const health = await getMonthlyFinancialHealth(userId);

  // Fetch current month expenses
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      spentAt: { gte: startOfMonth, lte: endOfMonth },
    },
    include: { category: true },
    orderBy: { amount: 'desc' },
  });

  const biggestPurchaseExp = expenses[0] || null;
  const biggestPurchase = biggestPurchaseExp
    ? {
        title: biggestPurchaseExp.title,
        amount: biggestPurchaseExp.amount,
        date: new Date(biggestPurchaseExp.spentAt).toISOString().split('T')[0],
        category: biggestPurchaseExp.category?.name || 'General',
      }
    : null;

  // Category breakdown
  const catMap: Record<string, number> = {};
  let totalSpent = 0;
  for (const exp of expenses) {
    const catName = exp.category?.name || 'General';
    catMap[catName] = (catMap[catName] || 0) + exp.amount;
    totalSpent += exp.amount;
  }

  const topCategories = Object.entries(catMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const aiSummary = `During ${monthName} ${targetYear}, you earned ₹${cashflow.income.toLocaleString('en-IN')}, spent ₹${totalSpent.toLocaleString('en-IN')}, and invested/saved ₹${(cashflow.investments + cashflow.savings).toLocaleString('en-IN')}. Your financial health score stands at ${health.healthScore}/100 with a saving rate of ${health.savingRate}%.`;

  return {
    monthName,
    year: targetYear,
    income: cashflow.income,
    spent: totalSpent,
    emi: cashflow.emi,
    investments: cashflow.investments,
    savings: cashflow.savings,
    freeCash: cashflow.freeCash,
    savingRate: health.savingRate,
    healthScore: health.healthScore,
    topCategories,
    biggestPurchase,
    aiSummary,
  };
}
