import { prisma } from '../db/prisma.js';

export interface CfoCashflowSummary {
  income: number;
  spent: number;
  emi: number;
  recurring: number;
  investments: number;
  savings: number;
  freeCash: number;
  emergencyFund: number;
  monthlyBurnRate: number;
  dailyAllowance: number;
  remainingDays: number;
}

export async function getCfoCashflow(userId: string): Promise<CfoCashflowSummary> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const remainingDays = Math.max(1, endOfMonth.getDate() - now.getDate() + 1);

  // 1. Total Income
  const incomes = await prisma.income.findMany({ where: { userId } });
  const income = incomes.reduce((acc, item) => acc + (item.amount || 0), 0);

  // 2. Spent Current Month Expenses
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      spentAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  const spent = expenses.reduce((acc, item) => acc + (item.amount || 0), 0);

  // 3. Active EMIs
  const emis = await prisma.emiItem.findMany({ where: { userId } });
  const emi = emis.reduce((acc, item) => acc + (item.amount || 0), 0);

  // 4. Recurring Expenses
  const recurringItems = await prisma.recurringExpense.findMany({
    where: { userId, isActive: true },
  });
  const recurring = recurringItems.reduce((acc, item) => acc + (item.amount || 0), 0);

  // 5. Active Investments
  const investmentsList = await prisma.investmentItem.findMany({
    where: { userId, isActive: true },
  });
  const investments = investmentsList.reduce((acc, item) => acc + (item.amount || 0), 0);

  // 6. Savings Contributions & Emergency Fund
  const savingsList = await prisma.savingItem.findMany({ where: { userId } });
  const savings = savingsList.reduce((acc, item) => acc + (item.monthlyContribution || 0), 0);
  const emergencyFund = savingsList
    .filter((s) => s.type === 'EMERGENCY_FUND')
    .reduce((acc, item) => acc + (item.currentAmount || 0), 0);

  // 7. Derived Calculations
  const freeCash = Math.max(0, income - (spent + emi + investments + savings));
  const monthlyBurnRate = spent + emi + recurring;
  const dailyAllowance = Math.round((freeCash / remainingDays) * 100) / 100;

  return {
    income,
    spent,
    emi,
    recurring,
    investments,
    savings,
    freeCash,
    emergencyFund,
    monthlyBurnRate,
    dailyAllowance,
    remainingDays,
  };
}
