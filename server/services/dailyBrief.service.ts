import { prisma } from "../db/prisma.js";
import { GoogleGenAI } from "@google/genai";

export interface DailyBrief {
  greeting: string;
  summaryText: string;
  dailyAllowance: number;
  upcomingDuesCount: number;
  nextDueTitle?: string;
  nextDueDays?: number;
  nextDueAmount?: number;
  savingsRateTarget: number;
}

export async function getDailyBrief(userId: string, userName: string = "User"): Promise<DailyBrief> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - today.getDate() + 1);

  // 1. Fetch live Prisma metrics
  const incomes = await prisma.income.findMany({ where: { userId } });
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthExpenses = await prisma.expense.findMany({
    where: { userId, spentAt: { gte: startOfMonth } }
  });
  const spentSoFar = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const emis = await prisma.emiItem.findMany({ where: { userId } });
  const investments = await prisma.investmentItem.findMany({ where: { userId, isActive: true } });
  const recurrings = await prisma.recurringExpense.findMany({ where: { userId, isActive: true } });

  const totalCommitments = emis.reduce((sum, e) => sum + e.amount, 0) + 
                          investments.reduce((sum, i) => sum + i.amount, 0) + 
                          recurrings.reduce((sum, r) => sum + r.amount, 0);

  const freeCash = Math.max(0, totalIncome - spentSoFar - totalCommitments);
  const dailyAllowance = Math.round(freeCash / daysRemaining);

  // Find upcoming due items within next 3 days
  let nextDueTitle: string | undefined;
  let nextDueDays: number | undefined;
  let nextDueAmount: number | undefined;
  let upcomingDuesCount = 0;

  for (const emi of emis) {
    const due = new Date(today.getFullYear(), today.getMonth(), emi.dueDay);
    if (due < today) due.setMonth(due.getMonth() + 1);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diff >= 0 && diff <= 3) {
      upcomingDuesCount++;
      if (!nextDueTitle || diff < (nextDueDays ?? 99)) {
        nextDueTitle = `${emi.title} EMI`;
        nextDueDays = diff;
        nextDueAmount = emi.amount;
      }
    }
  }

  for (const inv of investments) {
    const due = new Date(inv.nextDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diff >= 0 && diff <= 3) {
      upcomingDuesCount++;
      if (!nextDueTitle || diff < (nextDueDays ?? 99)) {
        nextDueTitle = `${inv.title} SIP`;
        nextDueDays = diff;
        nextDueAmount = inv.amount;
      }
    }
  }

  const savingsRateTarget = totalIncome > 0 
    ? Math.max(0, Math.min(100, Math.round(((totalIncome - spentSoFar - totalCommitments) / totalIncome) * 100))) 
    : 0;

  // Fallback phrasing (deterministic)
  const duePhrase = nextDueTitle 
    ? `Your ${nextDueTitle} of ₹${nextDueAmount?.toLocaleString('en-IN')} is due in ${nextDueDays === 0 ? 'today' : nextDueDays + ' days'}.` 
    : `No critical dues in the next 3 days.`;

  let fallbackSummaryText = totalIncome > 0
    ? `Good morning, ${userName}. You have ₹${dailyAllowance.toLocaleString('en-IN')} available today. ${duePhrase} Staying within today's spending limit will help maintain your monthly savings target of ${savingsRateTarget}%.`
    : `Good morning, ${userName}. Complete the Setup Wizard to configure your income, budget, and commitments telemetry.`;

  // Attempt Gemini wording refinement if API key exists
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const aiClient = new GoogleGenAI({ apiKey });
      const prompt = `Rewrite the following financial briefing in 2 concise, professional, warm sentences for a Personal Finance CFO app. Keep the exact numeric values unchanged.
Name: ${userName}
Daily Allowance: ₹${dailyAllowance}
Upcoming Dues Phrase: ${duePhrase}
Savings Rate Target: ${savingsRateTarget}%

Original Brief: "${fallbackSummaryText}"`;

      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (response && response.text) {
        fallbackSummaryText = response.text.trim();
      }
    }
  } catch (err) {
    // Graceful fallback to deterministic phrasing
  }

  return {
    greeting: `Good morning, ${userName}`,
    summaryText: fallbackSummaryText,
    dailyAllowance,
    upcomingDuesCount,
    nextDueTitle,
    nextDueDays,
    nextDueAmount,
    savingsRateTarget,
  };
}
