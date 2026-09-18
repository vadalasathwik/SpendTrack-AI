import { prisma } from '../db/prisma.js';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getLoanIntelligence(userId: string) {
  const emis = await prisma.emiItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const totalOutstanding = emis.reduce((sum, e) => sum + (e.outstanding || e.amount * 12), 0);
  const totalMonthlyEmi = emis.reduce((sum, e) => sum + e.amount, 0);

  // Amortization calculation for each loan
  const loanBreakdown = emis.map((loan) => {
    const outstanding = loan.outstanding || loan.amount * 24;
    const rate = loan.interestRate || 10.5; // annual interest %
    const monthlyRate = rate / 12 / 100;
    const emiAmount = loan.amount;

    // Monthly interest portion = Outstanding * monthlyRate
    const estimatedMonthlyInterest = Math.round(outstanding * monthlyRate);
    const estimatedMonthlyPrincipal = Math.max(0, emiAmount - estimatedMonthlyInterest);

    // Remaining tenure in months = Outstanding / monthly Principal approx
    const remainingMonths = estimatedMonthlyPrincipal > 0
      ? Math.ceil(outstanding / estimatedMonthlyPrincipal)
      : 24;

    return {
      id: loan.id,
      title: loan.title,
      bank: loan.bank,
      emiAmount,
      outstanding,
      interestRate: rate,
      dueDay: loan.dueDay,
      estimatedMonthlyInterest,
      estimatedMonthlyPrincipal,
      remainingMonths,
      principalVsInterestRatio: emiAmount > 0 ? Math.round((estimatedMonthlyPrincipal / emiAmount) * 100) : 50,
    };
  });

  const totalMonthlyInterest = loanBreakdown.reduce((sum, l) => sum + l.estimatedMonthlyInterest, 0);
  const totalMonthlyPrincipal = loanBreakdown.reduce((sum, l) => sum + l.estimatedMonthlyPrincipal, 0);

  let aiRefinanceAdvice = 'Refinance home loan if current rate exceeds market benchmark (>8.75%).';

  if (ai) {
    try {
      const prompt = `Analyze these active loans for a borrower:
Total Loans: ${emis.length}, Total Outstanding: ₹${totalOutstanding}, Total Monthly EMI: ₹${totalMonthlyEmi}.
Loans Details: ${JSON.stringify(loanBreakdown.map((l) => ({ bank: l.bank, rate: l.interestRate, emi: l.emiAmount, balance: l.outstanding })))}.

Provide a 2-sentence refinancing & debt payoff recommendation (e.g. avalanche strategy or balance transfer).`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response?.text) {
        aiRefinanceAdvice = response.text.trim();
      }
    } catch (e) {
      console.warn('Gemini loan refinance advice fallback:', e);
    }
  }

  return {
    emis,
    loanBreakdown,
    totalOutstanding,
    totalMonthlyEmi,
    totalMonthlyInterest,
    totalMonthlyPrincipal,
    aiRefinanceAdvice,
  };
}

export function simulatePartPayment(
  outstanding: number,
  interestRate: number,
  currentEmi: number,
  partPaymentAmount: number
) {
  const r = interestRate / 12 / 100;
  const newBalance = Math.max(0, outstanding - partPaymentAmount);

  // Remaining months before vs after
  const oldMonths = r > 0 && currentEmi > outstanding * r
    ? Math.log(currentEmi / (currentEmi - outstanding * r)) / Math.log(1 + r)
    : 36;

  const newMonths = r > 0 && currentEmi > newBalance * r
    ? Math.log(currentEmi / (currentEmi - newBalance * r)) / Math.log(1 + r)
    : 24;

  const monthsSaved = Math.max(0, Math.round(oldMonths - newMonths));
  const oldTotalInterest = Math.round(currentEmi * oldMonths - outstanding);
  const newTotalInterest = Math.round(currentEmi * newMonths - newBalance);
  const interestSaved = Math.max(0, oldTotalInterest - newTotalInterest);

  const effectiveRoi = Number(interestRate.toFixed(1));

  // Compare against 12% p.a. expected CAGR index fund investment
  const years = Math.max(1, oldMonths / 12);
  const expectedInvestmentReturns = Math.round(
    partPaymentAmount * Math.pow(1 + 0.12, years) - partPaymentAmount
  );

  let investmentComparisonAdvice = "";
  if (interestRate >= 10.5) {
    investmentComparisonAdvice = `Prepaying ₹${partPaymentAmount.toLocaleString('en-IN')} gives a guaranteed tax-free yield of ${effectiveRoi}%, which is better than high-risk investments given the high loan rate.`;
  } else {
    investmentComparisonAdvice = `Prepaying saves ₹${interestSaved.toLocaleString('en-IN')} in interest. Alternatively, investing ₹${partPaymentAmount.toLocaleString('en-IN')} in an Nifty 50 Index Fund @ 12% CAGR could yield ~₹${expectedInvestmentReturns.toLocaleString('en-IN')} over ${Math.round(years)} years.`;
  }

  return {
    originalOutstanding: outstanding,
    partPaymentAmount,
    newBalance,
    monthsSaved,
    interestSaved,
    newTenureMonths: Math.round(newMonths),
    effectiveRoi,
    investmentComparisonAdvice,
  };
}

