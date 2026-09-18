import { prisma } from "../db/prisma.js";
import { getCashFlowCurrent } from "./cashflow.service.js";
import { calculateDynamicHealthScore } from "../../src/utils/calculations.js";

export interface ExecutiveReport {
  period: string; // "weekly" | "monthly" | "quarterly"
  generatedAt: string;
  user: { name: string; email: string };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    totalEmis: number;
    totalInvestments: number;
    totalSavings: number;
    freeCash: number;
    netWorth: number;
    healthScore: number;
    healthRating: string;
    savingRate: number;
    emiRatio: number;
  };
  highlights: string[];
  recommendations: string[];
  topExpenses: { title: string; amount: number; category: string }[];
  predictiveMetrics: {
    monthEndCashForecast: number;
    emergencyCushionMonths: number;
    debtFreeMonthsEstimate: number;
    goldAccumulationScore: number;
    confidenceScore: number;
  };
}

export async function getExecutiveReport(userId: string, period: string = "monthly"): Promise<ExecutiveReport> {
  const userRecord = await prisma.user.findFirst({
    where: { OR: [{ id: userId }, { googleId: userId }, { email: userId }] },
  });

  const userName = userRecord?.name || "Partner";
  const userEmail = userRecord?.email || "";

  const [cashflow, expenses, assets, liabilities, portfolio, metals, savings] = await Promise.all([
    getCashFlowCurrent(userId),
    prisma.expense.findMany({ where: { userId }, take: 10, orderBy: { spentAt: "desc" } }),
    prisma.assetItem.findMany({ where: { userId } }),
    prisma.liabilityItem.findMany({ where: { userId } }),
    prisma.portfolioHolding.findMany({ where: { userId } }),
    prisma.preciousMetalHolding.findMany({ where: { userId } }),
    prisma.savingItem.findMany({ where: { userId } }),
  ]);

  const assetTotal = assets.reduce((s, a) => s + a.amount, 0) +
                     portfolio.reduce((s, p) => s + (p.currentValue || p.invested), 0) +
                     metals.reduce((s, m) => s + (m.currentValue || m.totalCost), 0) +
                     savings.reduce((s, st) => s + st.currentAmount, 0);

  const liabilityTotal = liabilities.reduce((s, l) => s + l.amount, 0);
  const netWorth = assetTotal - liabilityTotal;

  const health = calculateDynamicHealthScore({
    savingRate: cashflow.savingRate,
    totalIncome: cashflow.income,
    totalExpenses: cashflow.expenses,
    totalEmis: cashflow.emi,
    monthlyBudget: 0,
    savingsTotal: cashflow.savings + cashflow.investments,
    portfolioValue: portfolio.reduce((s, p) => s + (p.currentValue || p.invested), 0),
  });

  const highlights: string[] = [
    `Verified monthly income standing at ₹${cashflow.income.toLocaleString("en-IN")}.`,
    `Current month discretionary outflow controlled at ₹${cashflow.expenses.toLocaleString("en-IN")}.`,
    `Active EMI debt commitments equal ₹${cashflow.emi.toLocaleString("en-IN")} (${cashflow.emiRatio}% of income).`,
    `Capital allocated into wealth building & savings: ₹${(cashflow.investments + cashflow.savings).toLocaleString("en-IN")}.`,
    `Overall executive net worth estimated at ₹${netWorth.toLocaleString("en-IN")}.`,
  ];

  const recommendations: string[] = [
    cashflow.savingRate < 20
      ? "Increase monthly SIP contributions to reach a minimum 20% savings velocity."
      : "Maintain current disciplined savings allocation across diversified assets.",
    cashflow.emiRatio > 35
      ? "High EMI ratio detected. Consider prepaying high-interest debt."
      : "EMI obligations are within healthy debt-to-income bounds.",
    cashflow.freeCash > 10000
      ? `Deploy unallocated free cash buffer of ₹${cashflow.freeCash.toLocaleString("en-IN")} into short-term liquid funds.`
      : "Monitor daily discretionary spending to preserve liquidity buffer.",
  ];

  const topExpenses = expenses.slice(0, 5).map((e) => ({
    title: e.title,
    amount: e.amount,
    category: "General",
  }));

  const monthEndCashForecast = Math.round(cashflow.freeCash * 0.9);
  const emergencyCushionMonths = cashflow.expenses > 0 ? Number((assetTotal / Math.max(1, cashflow.expenses)).toFixed(1)) : 6;
  const debtFreeMonthsEstimate = cashflow.emi > 0 ? Math.ceil(liabilityTotal / Math.max(1, cashflow.emi)) : 0;
  const goldAccumulationScore = Math.min(100, Math.round((metals.reduce((s, m) => s + m.grams, 0) / 100) * 100));
  const confidenceScore = cashflow.income > 0 ? 94 : 75;

  return {
    period,
    generatedAt: new Date().toISOString(),
    user: { name: userName, email: userEmail },
    summary: {
      totalIncome: cashflow.income,
      totalExpenses: cashflow.expenses,
      totalEmis: cashflow.emi,
      totalInvestments: cashflow.investments,
      totalSavings: cashflow.savings,
      freeCash: cashflow.freeCash,
      netWorth,
      healthScore: health.score,
      healthRating: health.rating,
      savingRate: cashflow.savingRate,
      emiRatio: cashflow.emiRatio,
    },
    highlights,
    recommendations,
    topExpenses,
    predictiveMetrics: {
      monthEndCashForecast,
      emergencyCushionMonths,
      debtFreeMonthsEstimate,
      goldAccumulationScore,
      confidenceScore,
    },
  };
}
