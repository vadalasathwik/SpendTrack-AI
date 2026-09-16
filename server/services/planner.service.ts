import { prisma } from "../db/prisma.js";

export async function getPlannerSummary(userId: string) {
  const [incomes, emis, investments, savings, budgets] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.emiItem.findMany({ where: { userId } }),
    prisma.investmentItem.findMany({ where: { userId, isActive: true } }),
    prisma.savingItem.findMany({ where: { userId } }),
    prisma.monthlyBudget.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 1 }),
  ]);

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalEmi = emis.reduce((sum, item) => sum + item.amount, 0);
  const totalInvestments = investments.reduce((sum, item) => sum + item.amount, 0);
  const totalSavings = savings.reduce((sum, item) => sum + item.monthlyContribution, 0);
  
  const monthlyBudget = budgets.length > 0 ? budgets[0].budget : 55000;
  const living = monthlyBudget;

  const totalObligations = totalEmi + totalInvestments + totalSavings + living;
  const buffer = Math.max(0, totalIncome - totalObligations);

  return {
    income: totalIncome,
    emi: totalEmi,
    investments: totalInvestments,
    savings: totalSavings,
    living: living,
    buffer: buffer,
  };
}
