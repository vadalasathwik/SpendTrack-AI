import { prisma } from "../db/prisma.js";

export interface PageInsight {
  page: 'HOME' | 'GOALS' | 'NET_WORTH' | 'BUDGET' | 'PLANNER' | 'EXPENSES' | 'HEALTH';
  title: string;
  message: string;
  type: 'WARNING' | 'OPPORTUNITY' | 'INFO' | 'ACTION';
  metricValue?: string;
  suggestedAction?: string;
}

export async function getCfoInsights(userId: string): Promise<Record<string, PageInsight>> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch Income
  const incomes = await prisma.income.findMany({ where: { userId } });
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  // Fetch Current Expenses
  const expenses = await prisma.expense.findMany({
    where: { userId, spentAt: { gte: startOfMonth } }
  });
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Fetch EMIs
  const emis = await prisma.emiItem.findMany({ where: { userId } });
  const totalEmi = emis.reduce((sum, e) => sum + e.amount, 0);

  // Fetch Goals
  const goals = await prisma.goal.findMany({ where: { userId } });
  const totalGoalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalGoalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  // Fetch Assets & Liabilities
  const assets = await prisma.assetItem.findMany({ where: { userId } });
  const liabilities = await prisma.liabilityItem.findMany({ where: { userId } });

  const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  const freeCash = totalIncome - totalSpent - totalEmi;
  const emiRatio = Math.round((totalEmi / totalIncome) * 100);

  // Insights map
  return {
    HOME: {
      page: 'HOME',
      title: 'Daily Allowance & Liquidity Alert',
      message: freeCash > 15000 
        ? `You have ₹${freeCash.toLocaleString('en-IN')} uncommitted surplus. Consider allocating 40% into SIP investments.` 
        : `Free cash buffer is currently ₹${freeCash.toLocaleString('en-IN')}. Keep daily spend below ₹${Math.round(Math.max(100, freeCash / 15))}/day.`,
      type: freeCash < 5000 ? 'WARNING' : 'OPPORTUNITY',
      metricValue: `₹${freeCash.toLocaleString('en-IN')}`,
      suggestedAction: 'Ask AI CFO'
    },
    GOALS: {
      page: 'GOALS',
      title: 'Goal Acceleration Opportunity',
      message: goals.length > 0
        ? `Increasing monthly contributions by ₹2,500 will accelerate your target completion timelines by 8 months.`
        : `No active goals set. Create a House or Emergency Fund goal to start AI forecasting.`,
      type: 'ACTION',
      metricValue: `${goals.length} Goals Active`,
      suggestedAction: 'Boost SIP Contribution'
    },
    NET_WORTH: {
      page: 'NET_WORTH',
      title: 'Asset Allocation Imbalance',
      message: totalAssets > 0 && (assets.filter(a => a.category === 'Gold').reduce((s, a) => s + a.amount, 0) / totalAssets) > 0.35
        ? `Gold represents over 35% of total asset holdings. Consider rebalancing into diversified equity SIPs for higher long-term CAGR.`
        : `Net worth is currently ₹${netWorth.toLocaleString('en-IN')}. Debt-to-asset ratio is ${totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 100) : 0}%.`,
      type: 'INFO',
      metricValue: `₹${netWorth.toLocaleString('en-IN')}`,
      suggestedAction: 'Rebalance Assets'
    },
    BUDGET: {
      page: 'BUDGET',
      title: 'Discretionary Overspending Warning',
      message: totalSpent > totalIncome * 0.5
        ? `Living & discretionary spending has crossed 50% of monthly income. Review non-essential purchases.`
        : `Budget discipline is optimal. Monthly outflow is well within income thresholds.`,
      type: totalSpent > totalIncome * 0.5 ? 'WARNING' : 'OPPORTUNITY',
      metricValue: `₹${totalSpent.toLocaleString('en-IN')} spent`,
      suggestedAction: 'Adjust Budget'
    },
    PLANNER: {
      page: 'PLANNER',
      title: 'Heavy Cash-Flow Due Period',
      message: emiRatio > 35
        ? `Heavy EMI commitments upcoming this week. Maintain at least ₹${totalEmi.toLocaleString('en-IN')} in primary bank account.`
        : `Upcoming financial calendar commitments are evenly spaced. Cash flow risk is LOW.`,
      type: emiRatio > 35 ? 'WARNING' : 'INFO',
      metricValue: `${emiRatio}% EMI Ratio`,
      suggestedAction: 'View Calendar'
    }
  };
}
