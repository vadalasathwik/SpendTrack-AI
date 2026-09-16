import { GoogleGenAI } from '@google/genai';
import { prisma } from '../db/prisma.js';
import { getCfoCashflow, CfoCashflowSummary } from './cfoCashflow.service.js';

export interface FinancialHealthResult {
  healthScore: number;
  freeCash: number;
  savingRate: number;
  emiRatio: number;
  investmentRatio: number;
  emergencyFundMonths: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  insights: string[];
}

export interface AffordabilityCheckResult {
  affordable: boolean;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  remainingCash: number;
  message: string;
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  return aiClient;
}

/**
 * Computes exact financial health metrics & score from PostgreSQL
 */
export async function getMonthlyFinancialHealth(userId: string): Promise<FinancialHealthResult> {
  const cashflow = await getCfoCashflow(userId);
  const { income, spent, emi, investments, savings, freeCash, emergencyFund, monthlyBurnRate } = cashflow;

  const totalSavedAndInvested = investments + savings;
  const savingRate = income > 0 ? Math.round((totalSavedAndInvested / income) * 100) : 0;
  const emiRatio = income > 0 ? Math.round((emi / income) * 100) : 0;
  const investmentRatio = income > 0 ? Math.round((investments / income) * 100) : 0;

  const burn = monthlyBurnRate > 0 ? monthlyBurnRate : 1;
  const emergencyFundMonths = Math.round((emergencyFund / burn) * 10) / 10;

  // Health Score (0–100) Algorithm:
  // Base 50
  // + Saving rate bonus (up to 25 points for 30% saving rate)
  // - EMI penalty (deduct points if EMI ratio > 40%)
  // + Emergency fund bonus (up to 15 points for 6 months buffer)
  // + Free cash positivity bonus (+10 points if free cash > 0)
  let healthScore = 50;

  healthScore += Math.min(25, Math.round((savingRate / 30) * 25));

  if (emiRatio > 40) {
    healthScore -= Math.min(25, Math.round(((emiRatio - 40) / 30) * 25));
  } else {
    healthScore += 10;
  }

  healthScore += Math.min(15, Math.round((emergencyFundMonths / 6) * 15));

  if (freeCash > 0) {
    healthScore += 10;
  } else {
    healthScore -= 20;
  }

  healthScore = Math.max(10, Math.min(100, healthScore));

  let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (healthScore < 45 || emiRatio > 55 || freeCash <= 0) {
    risk = 'HIGH';
  } else if (healthScore < 70 || emiRatio > 35) {
    risk = 'MEDIUM';
  }

  // Generate Gemini natural-language insights with fallback
  const insights = await generateInsightsWithGemini(cashflow, healthScore, savingRate, emiRatio, risk);

  return {
    healthScore,
    freeCash,
    savingRate,
    emiRatio,
    investmentRatio,
    emergencyFundMonths,
    risk,
    insights,
  };
}

/**
 * Calls Gemini 2.5 Flash with live PostgreSQL aggregated financial metrics
 */
async function generateInsightsWithGemini(
  cashflow: CfoCashflowSummary,
  healthScore: number,
  savingRate: number,
  emiRatio: number,
  risk: string
): Promise<string[]> {
  const fallbackInsights = [
    `You are saving ${savingRate}% of your monthly income.`,
    emiRatio > 40
      ? `Your EMI commitments consume ${emiRatio}% of monthly income. Consider pre-paying high-interest loans.`
      : `Your EMI ratio of ${emiRatio}% is within a healthy financial threshold.`,
    cashflow.freeCash > 10000
      ? `You have ₹${cashflow.freeCash.toLocaleString('en-IN')} free cash remaining. You can increase monthly SIPs by ₹2,500.`
      : `Free cash buffer is low. Avoid non-essential discretionary expenses this month.`,
  ];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackInsights;

  try {
    const prompt = `You are a world-class AI CFO analyzing a user's monthly financial stats:
- Monthly Income: ₹${cashflow.income}
- Spent Expenses: ₹${cashflow.spent}
- Loan EMIs: ₹${cashflow.emi}
- Monthly Investments: ₹${cashflow.investments}
- Monthly Savings: ₹${cashflow.savings}
- Free Cash Remaining: ₹${cashflow.freeCash}
- Emergency Cushion: ₹${cashflow.emergencyFund}
- Financial Health Score: ${healthScore}/100
- Saving Rate: ${savingRate}%
- EMI Ratio: ${emiRatio}%
- Overall Risk Profile: ${risk}

Generate exactly 3 short, actionable, highly intelligent bullet points providing monthly financial advice.
Return strictly a JSON array of strings: ["insight 1", "insight 2", "insight 3"]. No markdown surrounding code blocks.`;

    const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const restRes = await fetch(restUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    });

    if (restRes.ok) {
      const data: any = await restRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleanedText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => String(s));
        }
      }
    }
  } catch (err) {
    console.warn('AI CFO Gemini insights notice:', err);
  }

  return fallbackInsights;
}

/**
 * Evaluates whether the user can afford a specific purchase amount
 */
export async function canIAfford(
  userId: string,
  amount: number,
  category: string = 'Discretionary'
): Promise<AffordabilityCheckResult> {
  const cashflow = await getCfoCashflow(userId);
  const remainingCash = cashflow.freeCash - amount;
  const affordable = remainingCash >= 0;

  let impact: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (!affordable) {
    impact = 'HIGH';
  } else if (amount > cashflow.freeCash * 0.5) {
    impact = 'HIGH';
  } else if (amount > cashflow.freeCash * 0.2) {
    impact = 'MEDIUM';
  }

  let message = '';
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `The user wants to buy "${category}" costing ₹${amount.toLocaleString('en-IN')}.
Current Financial Metrics:
- Monthly Income: ₹${cashflow.income}
- Current Free Cash Buffer: ₹${cashflow.freeCash}
- Remaining Free Cash after Purchase: ₹${remainingCash}
- Impact Level: ${impact}
- Is Affordable: ${affordable}

Explain in 2 clear, helpful sentences in simple English whether the user should make this purchase and how it impacts their cash buffer. Do not mention code or JSON structure.`;

      const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const restRes = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      });

      if (restRes.ok) {
        const data: any = await restRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          message = text.trim();
        }
      }
    } catch (err) {
      console.warn('Gemini canIAfford notice:', err);
    }
  }

  if (!message) {
    if (!affordable) {
      message = `Buying this ${category} for ₹${amount.toLocaleString('en-IN')} exceeds your free cash buffer by ₹${Math.abs(remainingCash).toLocaleString('en-IN')}. We recommend deferring this purchase.`;
    } else if (impact === 'HIGH') {
      message = `This purchase consumes over 50% of your remaining free cash (₹${remainingCash.toLocaleString('en-IN')} left). Proceed with caution.`;
    } else {
      message = `Buying this ${category} for ₹${amount.toLocaleString('en-IN')} still leaves a healthy cash buffer of ₹${remainingCash.toLocaleString('en-IN')}.`;
    }
  }

  return {
    affordable,
    impact,
    remainingCash,
    message,
  };
}

/**
 * Detects overspending across categories and budgets
 */
export async function detectOverspending(userId: string): Promise<any[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      spentAt: { gte: startOfMonth, lte: endOfMonth },
    },
    include: { category: true },
  });

  const categoryTotals: Record<string, { name: string; total: number }> = {};
  for (const exp of expenses) {
    const catId = exp.categoryId;
    const catName = exp.category?.name || 'Uncategorized';
    if (!categoryTotals[catId]) {
      categoryTotals[catId] = { name: catName, total: 0 };
    }
    categoryTotals[catId].total += exp.amount;
  }

  const budget = await prisma.monthlyBudget.findUnique({
    where: {
      month_year_userId: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        userId,
      },
    },
  });

  const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0);
  const alerts: any[] = [];

  if (budget && totalSpent > budget.budget * 0.8) {
    alerts.push({
      type: 'BUDGET_WARNING',
      message: `Total spent ₹${totalSpent.toLocaleString('en-IN')} has crossed ${Math.round((totalSpent / budget.budget) * 100)}% of your monthly budget (₹${budget.budget.toLocaleString('en-IN')}).`,
      severity: totalSpent > budget.budget ? 'HIGH' : 'MEDIUM',
    });
  }

  return alerts;
}

/**
 * Recommends optimal savings strategies based on PostgreSQL data
 */
export async function recommendSavings(userId: string): Promise<string[]> {
  const cashflow = await getCfoCashflow(userId);
  const recommendations: string[] = [];

  if (cashflow.emergencyFund < cashflow.monthlyBurnRate * 3) {
    recommendations.push(
      `Build emergency fund cushion: You currently have ${Math.round((cashflow.emergencyFund / (cashflow.monthlyBurnRate || 1)) * 10) / 10} months. Target 6 months of expenses.`
    );
  }

  if (cashflow.freeCash > 15000) {
    recommendations.push(
      `Automate wealth creation: Allocate ₹${Math.round(cashflow.freeCash * 0.4).toLocaleString('en-IN')} into index fund SIPs or Gold RD.`
    );
  } else {
    recommendations.push(`Review active subscriptions & recurring bills to increase free cash flow.`);
  }

  return recommendations;
}

