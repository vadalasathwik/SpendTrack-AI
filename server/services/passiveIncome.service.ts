import { prisma } from "../db/prisma.js";
import { getCashFlowCurrent } from "./cashflow.service.js";

export const getPassiveIncomeTracker = async (userId: string) => {
  const cashflow = await getCashFlowCurrent(userId);
  const portfolio = await prisma.portfolioHolding.findMany({ where: { userId } });
  const savings = await prisma.savingItem.findMany({ where: { userId } });

  const portfolioValue = portfolio.reduce((acc, p) => acc + (p.currentValue || p.invested), 0);
  const annualDividend = Math.round(portfolioValue * 0.018); // ~1.8% average dividend yield
  const monthlyDividend = Math.round(annualDividend / 12);

  const fdSavingsTotal = savings.reduce((acc, s) => acc + s.currentAmount, 0);
  const annualInterest = Math.round(fdSavingsTotal * 0.07); // ~7.0% interest yield
  const monthlyInterest = Math.round(annualInterest / 12);

  const monthlyRental = 20000; // rental income
  const annualRental = monthlyRental * 12;

  const totalMonthlyPassiveIncome = monthlyDividend + monthlyInterest + monthlyRental;
  const totalAnnualPassiveIncome = annualDividend + annualInterest + annualRental;

  const monthlyExpenseTarget = Math.max(1, cashflow.expenses);
  const fiProgressPercent = Math.min(100, Math.round((totalMonthlyPassiveIncome / monthlyExpenseTarget) * 100));

  return {
    totalMonthlyPassiveIncome,
    totalAnnualPassiveIncome,
    fiProgressPercent,
    sources: [
      { type: "Dividends (Stocks & Mutual Funds)", monthly: monthlyDividend, annual: annualDividend },
      { type: "FD & Savings Interest", monthly: monthlyInterest, annual: annualInterest },
      { type: "Rental Property Income", monthly: monthlyRental, annual: annualRental },
    ],
  };
};
