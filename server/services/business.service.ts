import { prisma } from "../db/prisma.js";

export const getBusinessWorkspace = async (userId: string) => {
  const incomes = await prisma.income.findMany({ where: { userId } });
  const salaryRecords = await prisma.salaryRecord.findMany({ where: { userId } });

  const primarySalary = salaryRecords.length > 0 ? salaryRecords[0].netSalary : 120000;
  const freelanceRevenue = 35000;
  const saasRevenue = 15000;
  const rentalRevenue = 20000;

  const totalMonthlyRevenue = primarySalary + freelanceRevenue + saasRevenue + rentalRevenue;
  const businessExpenses = 12000;
  const netMonthlyProfit = totalMonthlyRevenue - businessExpenses;
  const profitMarginPercent = Math.round((netMonthlyProfit / totalMonthlyRevenue) * 100);

  const estimatedQuarterlyTax = Math.round(netMonthlyProfit * 0.15 * 3);

  return {
    totalMonthlyRevenue,
    businessExpenses,
    netMonthlyProfit,
    profitMarginPercent,
    estimatedQuarterlyTax,
    incomeStreams: [
      { name: "Primary Salary", category: "EMPLOYMENT", monthlyRevenue: primarySalary },
      { name: "Freelance & Consulting", category: "BUSINESS", monthlyRevenue: freelanceRevenue },
      { name: "AI SaaS Micro-App", category: "SIDE_PROJECT", monthlyRevenue: saasRevenue },
      { name: "Rental Income", category: "PROPERTY", monthlyRevenue: rentalRevenue },
    ],
  };
};
