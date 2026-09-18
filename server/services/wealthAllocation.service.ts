import { prisma } from "../db/prisma.js";

export interface AllocationCategory {
  category: 'Living' | 'EMI' | 'Investments' | 'Savings' | 'Lifestyle';
  recommendedPct: number;
  actualPct: number;
  recommendedAmount: number;
  actualAmount: number;
  varianceAmount: number; // positive = overspending, negative = underspending
  status: 'OPTIMAL' | 'OVER' | 'UNDER';
}

export interface WealthAllocationResult {
  allocations: AllocationCategory[];
  totalIncome: number;
  totalSpent: number;
  aiRecommendation: string;
  equityRatioPct: number;
  emergencyCushionMonths: number;
}

export async function getDynamicWealthAllocation(userId: string): Promise<WealthAllocationResult> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch Income
  const incomes = await prisma.income.findMany({ where: { userId } });
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  // Fetch Expenses for current month
  const expenses = await prisma.expense.findMany({
    where: { userId, spentAt: { gte: startOfMonth } },
    include: { category: true }
  });

  let livingSpent = 0;
  let lifestyleSpent = 0;

  for (const exp of expenses) {
    const catName = (exp.category?.name || exp.title || '').toLowerCase();
    if (catName.includes('food') || catName.includes('grocery') || catName.includes('bill') || catName.includes('utility') || catName.includes('rent') || catName.includes('health')) {
      livingSpent += exp.amount;
    } else {
      lifestyleSpent += exp.amount;
    }
  }

  // Fetch EMIs
  const emis = await prisma.emiItem.findMany({ where: { userId } });
  const emiSpent = emis.reduce((sum, e) => sum + e.amount, 0);

  // Fetch Investments
  const investments = await prisma.investmentItem.findMany({ where: { userId, isActive: true } });
  const investmentSpent = investments.reduce((sum, i) => sum + i.amount, 0);

  // Fetch Savings
  const savings = await prisma.savingItem.findMany({ where: { userId } });
  const savingsSpent = savings.reduce((sum, s) => sum + s.monthlyContribution, 0);

  const totalSpent = livingSpent + emiSpent + investmentSpent + savingsSpent + lifestyleSpent;

  // Compute Dynamic Recommended Percentages based on profile
  const emiRatio = (emiSpent / totalIncome) * 100;
  let recLivingPct = 30;
  let recEmiPct = Math.min(30, Math.round(emiRatio));
  let recInvPct = 25;
  let recSavPct = 15;
  let recLifestylePct = 100 - (recLivingPct + recEmiPct + recInvPct + recSavPct);

  if (recLifestylePct < 10) {
    recLifestylePct = 10;
    recLivingPct = Math.max(20, recLivingPct - 5);
  }

  const calcActualPct = (val: number) => Math.round((val / totalIncome) * 100);

  const actualLivingPct = calcActualPct(livingSpent);
  const actualEmiPct = calcActualPct(emiSpent);
  const actualInvPct = calcActualPct(investmentSpent);
  const actualSavPct = calcActualPct(savingsSpent);
  const actualLifestylePct = calcActualPct(lifestyleSpent);

  const categories: AllocationCategory[] = [
    {
      category: 'Living',
      recommendedPct: recLivingPct,
      actualPct: actualLivingPct,
      recommendedAmount: Math.round(totalIncome * (recLivingPct / 100)),
      actualAmount: livingSpent,
      varianceAmount: livingSpent - Math.round(totalIncome * (recLivingPct / 100)),
      status: livingSpent > totalIncome * (recLivingPct / 100) * 1.1 ? 'OVER' : livingSpent < totalIncome * (recLivingPct / 100) * 0.8 ? 'UNDER' : 'OPTIMAL'
    },
    {
      category: 'EMI',
      recommendedPct: recEmiPct,
      actualPct: actualEmiPct,
      recommendedAmount: Math.round(totalIncome * (recEmiPct / 100)),
      actualAmount: emiSpent,
      varianceAmount: emiSpent - Math.round(totalIncome * (recEmiPct / 100)),
      status: emiSpent > totalIncome * 0.4 ? 'OVER' : 'OPTIMAL'
    },
    {
      category: 'Investments',
      recommendedPct: recInvPct,
      actualPct: actualInvPct,
      recommendedAmount: Math.round(totalIncome * (recInvPct / 100)),
      actualAmount: investmentSpent,
      varianceAmount: Math.round(totalIncome * (recInvPct / 100)) - investmentSpent,
      status: investmentSpent < totalIncome * (recInvPct / 100) ? 'UNDER' : 'OPTIMAL'
    },
    {
      category: 'Savings',
      recommendedPct: recSavPct,
      actualPct: actualSavPct,
      recommendedAmount: Math.round(totalIncome * (recSavPct / 100)),
      actualAmount: savingsSpent,
      varianceAmount: Math.round(totalIncome * (recSavPct / 100)) - savingsSpent,
      status: savingsSpent < totalIncome * (recSavPct / 100) ? 'UNDER' : 'OPTIMAL'
    },
    {
      category: 'Lifestyle',
      recommendedPct: recLifestylePct,
      actualPct: actualLifestylePct,
      recommendedAmount: Math.round(totalIncome * (recLifestylePct / 100)),
      actualAmount: lifestyleSpent,
      varianceAmount: lifestyleSpent - Math.round(totalIncome * (recLifestylePct / 100)),
      status: lifestyleSpent > totalIncome * (recLifestylePct / 100) * 1.15 ? 'OVER' : 'OPTIMAL'
    },
  ];

  const lifestyleVariance = lifestyleSpent - Math.round(totalIncome * (recLifestylePct / 100));
  let aiRecommendation = `Your wealth allocation is balanced. Maintain your investment rate of ${actualInvPct}%.`;
  if (lifestyleVariance > 2000) {
    aiRecommendation = `You're overspending on Lifestyle by ₹${lifestyleVariance.toLocaleString('en-IN')}. Redirecting this into SIPs increases projected long-term wealth by 18%.`;
  } else if (actualInvPct < 15) {
    aiRecommendation = `Your investment rate is currently ${actualInvPct}%. We recommend boosting monthly SIP contributions by at least ₹3,000.`;
  }

  return {
    allocations: categories,
    totalIncome,
    totalSpent,
    aiRecommendation,
    equityRatioPct: Math.min(80, actualInvPct * 2.5),
    emergencyCushionMonths: Math.round((savingsSpent / (totalSpent || 1)) * 6)
  };
}
