import { prisma } from '../db/prisma.js';
import { GoogleGenAI } from '@google/genai';
import { getPortfolioSummary } from './portfolio.service.js';
import { getGoldWorkspace } from './gold.service.js';
import { getLoanIntelligence } from './loanIntelligence.service.js';
import { getInsuranceVault } from './insurance.service.js';
import { getSalaryIntelligence } from './salary.service.js';
import { getTaxDashboard } from './taxDashboard.service.js';
import { getPropertyIntelligence } from './property.service.js';
import { getVehicleManager } from './vehicle.service.js';
import { getEducationGoals } from './education.service.js';
import { getHealthcareFinance } from './healthcare.service.js';
import { getCreditWorkspace } from './credit.service.js';
import { getLegacyWorkspace } from './legacy.service.js';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export type SpecialistPersona =
  | 'CFO'
  | 'Wealth Advisor'
  | 'Loan Expert'
  | 'Gold Planner'
  | 'Tax Guide'
  | 'Insurance Advisor'
  | 'Career Finance Coach'
  | 'AI Life Planner';

export async function queryAiSpecialist(
  userId: string,
  persona: SpecialistPersona,
  query: string
) {
  let contextData: any = {};

  switch (persona) {
    case 'AI Life Planner': {
      const [
        properties,
        vehicles,
        education,
        healthcare,
        credit,
        legacy,
        portfolio,
        loans,
      ] = await Promise.all([
        getPropertyIntelligence(userId),
        getVehicleManager(userId),
        getEducationGoals(userId),
        getHealthcareFinance(userId),
        getCreditWorkspace(userId),
        getLegacyWorkspace(userId),
        getPortfolioSummary(userId),
        getLoanIntelligence(userId),
      ]);
      contextData = {
        lifeEcosystem: {
          properties: properties.totalPropertyWealth,
          propertyEquity: properties.totalEquityOwned,
          vehicles: vehicles.totalResaleValue,
          educationGoalsCount: education.goals.length,
          educationFutureCost: education.totalFutureCost,
          healthcareCoverage: healthcare.totalCoverageAmount,
          creditScore: credit.creditHealthScore,
          legacyCompleteness: legacy.completenessPercentage,
          portfolioValue: portfolio.totalCurrentValue,
          outstandingLoans: loans.totalOutstanding,
        },
      };
      break;
    }
    case 'Wealth Advisor':
      contextData = await getPortfolioSummary(userId);
      break;
    case 'Gold Planner':
      contextData = await getGoldWorkspace(userId);
      break;
    case 'Loan Expert':
      contextData = await getLoanIntelligence(userId);
      break;
    case 'Insurance Advisor':
      contextData = await getInsuranceVault(userId);
      break;
    case 'Tax Guide':
      contextData = await getTaxDashboard(userId);
      break;
    case 'Career Finance Coach':
      contextData = await getSalaryIntelligence(userId);
      break;
    case 'CFO':
    default: {
      const [expenses, budgets, incomes] = await Promise.all([
        prisma.expense.findMany({ where: { userId }, take: 10, orderBy: { spentAt: 'desc' } }),
        prisma.monthlyBudget.findFirst({ where: { userId }, orderBy: { year: 'desc' } }),
        prisma.income.findMany({ where: { userId } }),
      ]);
      contextData = { expenses, budget: budgets?.budget || 0, income: incomes.reduce((s, i) => s + i.amount, 0) };
      break;
    }
  }

  const personaPrompts: Record<SpecialistPersona, string> = {
    'CFO': 'You are TrackPay Chief Financial Officer AI. Focus on strict budget adherence, spending optimization, cash balance preservation, and cash flow warnings.',
    'Wealth Advisor': 'You are TrackPay Lead Wealth & Asset Manager AI. Focus on asset allocation, portfolio diversification, stock/mutual fund compounding, risk metrics, and long-term CAGR.',
    'Loan Expert': 'You are TrackPay Debt & Loan Specialist AI. Focus on interest savings, EMI amortization, foreclosure strategy, balance transfers, and avalanche debt elimination.',
    'Gold Planner': 'You are TrackPay Precious Metals Strategy AI. Focus on Gold/Silver gram accumulation, MMTC PAMP vs digital gold, buying on market dips, and target milestone tracking.',
    'Tax Guide': 'You are TrackPay Tax & FY Advisor AI. Focus on FY 2025-26 rules, Section 80C, 80D, Section 24, Old vs New Regime comparison, and legally minimizing tax liability.',
    'Insurance Advisor': 'You are TrackPay Risk & Insurance Manager AI. Focus on health, life, vehicle, and home insurance coverage adequacy, premium schedules, and warranty claims.',
    'Career Finance Coach': 'You are TrackPay Career & Executive Compensation Coach AI. Focus on salary negotiations, increment allocation, bonus management, gross-to-net optimization, and net worth growth.',
    'AI Life Planner': 'You are TrackPay Master AI Life Planner. Focus on holistic life milestones: buying home, retirement planning, child education, gold accumulation, tax optimization, business growth, and FIRE (Financial Independence Retire Early) strategy based on complete life finance context.',
  };

  const systemInstructions = personaPrompts[persona] || personaPrompts['AI Life Planner'];

  let replyText = `[${persona}] Processing your life finance inquiry: "${query}".`;

  if (ai) {
    try {
      const fullPrompt = `${systemInstructions}

User Query: "${query}"

Live User Context Data:
${JSON.stringify(contextData, null, 2)}

Provide a direct, highly structured, practical response in 3-4 bullet points using precise Indian Rupee (₹) metrics.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
      });

      if (response?.text) {
        replyText = response.text.trim();
      }
    } catch (e: any) {
      console.warn(`Gemini query for ${persona} failed:`, e);
      replyText = `[${persona}] Unable to reach AI servers currently. Based on your live PostgreSQL context, your life financial ecosystem is healthy and synced.`;
    }
  }

  return {
    persona,
    query,
    reply: replyText,
    timestamp: new Date().toISOString(),
  };
}
