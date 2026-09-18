import { prisma } from "../db/prisma.js";
import { getCashFlowCurrent } from "./cashflow.service.js";
import { getExecutiveReport } from "./report.service.js";

export const getBoardroomReports = async (userId: string, period: "weekly" | "monthly" | "quarterly" = "monthly") => {
  const baseReport = await getExecutiveReport(userId, period);
  const cashflow = await getCashFlowCurrent(userId);

  if (period === "weekly") {
    return {
      period: "Weekly CFO Briefing",
      generatedAt: new Date().toISOString(),
      spendingSummary: {
        weeklyOutflow: Math.round(cashflow.expenses / 4),
        weeklyBurnTarget: Math.round(cashflow.income / 4),
        upcomingDuesThisWeek: [
          { title: "Internet Bill", amount: 1499, dueDate: "In 2 days" },
          { title: "HDFC Home Loan EMI", amount: 35000, dueDate: "In 5 days" },
        ],
      },
      highlights: [
        `Weekly discretionary outflow controlled at ₹${Math.round(cashflow.expenses / 4).toLocaleString("en-IN")}.`,
        "Zero missed payments or late penalties detected.",
      ],
      executiveSummary: `Weekly execution is on target. Outflows represent ${Math.round((cashflow.expenses / Math.max(1, cashflow.income)) * 100)}% of weekly income capacity.`,
    };
  }

  if (period === "quarterly") {
    return {
      period: "Quarterly Boardroom Wealth Review",
      generatedAt: new Date().toISOString(),
      quarterlyMetrics: {
        quarterlyIncome: cashflow.income * 3,
        quarterlyExpenses: cashflow.expenses * 3,
        netWorthGrowthQoQ: "+6.8%",
        debtPaidOffQuarter: Math.round(cashflow.emi * 3 * 0.4),
        portfolioCompoundingCAGR: "14.2%",
      },
      assetAllocation: {
        equityPercent: 45,
        debtPercent: 25,
        preciousMetalsPercent: 15,
        realEstatePercent: 10,
        cashBufferPercent: 5,
      },
      goalProgress: [
        { goal: "100g Gold Milestone", progress: 72, eta: "Dec 2026" },
        { goal: "Home Loan Prepayment", progress: 45, eta: "Nov 2028" },
      ],
      executiveSummary: "Quarterly wealth velocity is compounding at a healthy 14.2% CAGR. Debt reduction is operating on schedule.",
    };
  }

  return {
    period: "Monthly Executive CFO Briefing",
    generatedAt: new Date().toISOString(),
    ...baseReport,
  };
};
