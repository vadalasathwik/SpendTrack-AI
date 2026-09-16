import { prisma } from "../db/prisma.js";

export async function getCashFlowCurrent(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [incomes, monthExpenses, emis, investments, savings] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({
      where: {
        userId,
        spentAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    }),
    prisma.emiItem.findMany({ where: { userId } }),
    prisma.investmentItem.findMany({ where: { userId, isActive: true } }),
    prisma.savingItem.findMany({ where: { userId } }),
  ]);

  const income = incomes.reduce((sum, item) => sum + item.amount, 0);
  const expenses = monthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const emi = emis.reduce((sum, item) => sum + item.amount, 0);
  const investmentsTotal = investments.reduce((sum, item) => sum + item.amount, 0);
  const savingsTotal = savings.reduce((sum, item) => sum + item.monthlyContribution, 0);

  const totalOutflow = expenses + emi + investmentsTotal + savingsTotal;
  const freeCash = income - totalOutflow;

  const savingRate = income > 0 ? Number((((savingsTotal + investmentsTotal) / income) * 100).toFixed(1)) : 0;
  const emiRatio = income > 0 ? Number(((emi / income) * 100).toFixed(1)) : 0;

  return {
    income,
    expenses,
    emi,
    investments: investmentsTotal,
    savings: savingsTotal,
    freeCash,
    savingRate,
    emiRatio,
  };
}
