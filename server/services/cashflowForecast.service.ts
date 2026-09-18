import { prisma } from "../db/prisma.js";

export interface DailyBalancePoint {
  day: number;
  date: string;
  balance: number;
}

export interface CashflowForecast {
  dailyBalance: DailyBalancePoint[];
  lowestBalance: number;
  lowestDay: number;
  lowestDate: string;
  negativeDays: number;
  remainingSpendable: number;
  safeDailySpend: number;
  startingBalance: number;
  totalIncome: number;
  totalCommitments: number;
}

export async function get30DayCashflowForecast(userId: string): Promise<CashflowForecast> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Fetch Income
  const incomes = await prisma.income.findMany({ where: { userId } });
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  // 2. Fetch EMIs
  const emis = await prisma.emiItem.findMany({ where: { userId } });
  const totalEmis = emis.reduce((sum, emi) => sum + emi.amount, 0);

  // 3. Fetch Investments (SIPs)
  const investments = await prisma.investmentItem.findMany({ where: { userId, isActive: true } });
  const totalSips = investments.reduce((sum, inv) => sum + inv.amount, 0);

  // 4. Fetch Savings (RDs/FDs)
  const savings = await prisma.savingItem.findMany({ where: { userId } });
  const totalSavings = savings.reduce((sum, sav) => sum + sav.monthlyContribution, 0);

  // 5. Fetch Recurring Expenses
  const recurrings = await prisma.recurringExpense.findMany({ where: { userId, isActive: true } });
  const totalRecurrings = recurrings.reduce((sum, rec) => sum + rec.amount, 0);

  // 6. Current Month Expenses spent so far
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthExpenses = await prisma.expense.findMany({
    where: {
      userId,
      spentAt: { gte: startOfMonth }
    }
  });
  const spentSoFar = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Current liquid balance estimation
  const startingBalance = Math.max(10000, totalIncome - spentSoFar);

  const totalCommitments = totalEmis + totalSips + totalSavings + totalRecurrings;
  const remainingSpendable = Math.max(0, startingBalance - totalCommitments);
  const safeDailySpend = Math.round(remainingSpendable / 30);

  // Calculate day-by-day balance simulation over 30 days
  const dailyBalance: DailyBalancePoint[] = [];
  let currentSimBalance = startingBalance;
  let lowestBalance = currentSimBalance;
  let lowestDay = 1;
  let lowestDate = today.toISOString().split("T")[0];
  let negativeDays = 0;

  for (let day = 1; day <= 30; day++) {
    const simDate = new Date(today);
    simDate.setDate(today.getDate() + (day - 1));
    const dayOfMonth = simDate.getDate();

    // Check commitments executing on this day
    let dayDeductions = safeDailySpend;

    // EMI deductions
    for (const emi of emis) {
      if (emi.dueDay === dayOfMonth) {
        dayDeductions += emi.amount;
      }
    }

    // Recurring deductions
    for (const rec of recurrings) {
      const recDate = new Date(rec.nextRun);
      if (recDate.getDate() === dayOfMonth) {
        dayDeductions += rec.amount;
      }
    }

    currentSimBalance -= dayDeductions;

    if (currentSimBalance < lowestBalance) {
      lowestBalance = currentSimBalance;
      lowestDay = day;
      lowestDate = simDate.toISOString().split("T")[0];
    }

    if (currentSimBalance < 0) {
      negativeDays += 1;
    }

    dailyBalance.push({
      day,
      date: simDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      balance: Math.round(currentSimBalance)
    });
  }

  return {
    dailyBalance,
    lowestBalance: Math.round(lowestBalance),
    lowestDay,
    lowestDate,
    negativeDays,
    remainingSpendable: Math.round(remainingSpendable),
    safeDailySpend,
    startingBalance: Math.round(startingBalance),
    totalIncome: Math.round(totalIncome),
    totalCommitments: Math.round(totalCommitments)
  };
}
