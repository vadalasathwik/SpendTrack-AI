import { prisma } from '../db/prisma.js';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getTaxDashboard(userId: string, targetFy: string = 'FY 2025-26') {
  // Aggregate live income, investments, and home loan interest
  const [salaries, investments, savings, emis, insurance] = await Promise.all([
    prisma.salaryRecord.findMany({ where: { userId } }),
    prisma.investmentItem.findMany({ where: { userId } }),
    prisma.savingItem.findMany({ where: { userId } }),
    prisma.emiItem.findMany({ where: { userId } }),
    prisma.insurancePolicy.findMany({ where: { userId } }),
  ]);

  const latestSalary = salaries[0] || null;
  const annualGrossIncome = latestSalary ? latestSalary.grossSalary * 12 : 1200000;

  // 80C Deductions (Max ₹1.5L: PF, ELSS, PPF, Life Insurance, EPF)
  const annualPf = latestSalary ? latestSalary.pfDeduction * 12 : 24000;
  const elssInvestments = investments.filter((i) => i.type.toUpperCase().includes('ELSS')).reduce((sum, i) => sum + i.amount * 12, 0);
  const total80CDeduction = Math.min(150000, annualPf + elssInvestments + 30000);

  // 80D Health Insurance (Max ₹25,000 for self + family)
  const healthInsurance = insurance.filter((p) => p.type === 'HEALTH').reduce((sum, p) => sum + p.premiumAmount, 0);
  const total80DDeduction = Math.min(25000, healthInsurance > 0 ? healthInsurance : 15000);

  // Section 24 Home Loan Interest (Max ₹2,00,000 for self-occupied property)
  const homeLoanEmis = emis.filter((e) => e.title.toLowerCase().includes('home loan') || e.bank.toLowerCase().includes('home'));
  const annualHomeLoanInterest = homeLoanEmis.reduce((sum, e) => sum + (e.amount * 12 * 0.65), 0); // ~65% interest component
  const totalSec24Deduction = Math.min(200000, annualHomeLoanInterest > 0 ? Math.round(annualHomeLoanInterest) : 120000);

  const standardDeductionOld = 50000;
  const standardDeductionNew = 75000;

  // Old Regime Taxable Calculation
  const oldRegimeDeductions = standardDeductionOld + total80CDeduction + total80DDeduction + totalSec24Deduction;
  const oldRegimeTaxableIncome = Math.max(0, annualGrossIncome - oldRegimeDeductions);

  // Old Regime Tax Slabs calculation
  let oldRegimeTax = 0;
  if (oldRegimeTaxableIncome > 1000000) {
    oldRegimeTax = 112500 + (oldRegimeTaxableIncome - 1000000) * 0.30;
  } else if (oldRegimeTaxableIncome > 500000) {
    oldRegimeTax = 12500 + (oldRegimeTaxableIncome - 500000) * 0.20;
  } else if (oldRegimeTaxableIncome > 250000) {
    oldRegimeTax = (oldRegimeTaxableIncome - 250000) * 0.05;
  }
  if (oldRegimeTaxableIncome <= 500000) oldRegimeTax = 0; // Sec 87A rebate

  // New Regime Taxable Calculation (FY 2025-26 rules: Standard Deduction 75,000, Nil up to 4L, 5% 4-8L, 10% 8-12L, 15% 12-16L, 20% 16-20L, 30% >24L)
  const newRegimeTaxableIncome = Math.max(0, annualGrossIncome - standardDeductionNew);
  let newRegimeTax = 0;
  if (newRegimeTaxableIncome > 2400000) {
    newRegimeTax = 300000 + (newRegimeTaxableIncome - 2400000) * 0.30;
  } else if (newRegimeTaxableIncome > 1200000) {
    newRegimeTax = 60000 + (newRegimeTaxableIncome - 1200000) * 0.15;
  } else if (newRegimeTaxableIncome > 800000) {
    newRegimeTax = 20000 + (newRegimeTaxableIncome - 800000) * 0.10;
  } else if (newRegimeTaxableIncome > 400000) {
    newRegimeTax = (newRegimeTaxableIncome - 400000) * 0.05;
  }
  if (newRegimeTaxableIncome <= 1200000) newRegimeTax = 0; // Sec 87A rebate in New Regime up to 12L

  // Add 4% Health & Education Cess
  const oldRegimeTotalTax = Math.round(oldRegimeTax * 1.04);
  const newRegimeTotalTax = Math.round(newRegimeTax * 1.04);

  const recommendedRegime = newRegimeTotalTax <= oldRegimeTotalTax ? 'NEW_REGIME' : 'OLD_REGIME';
  const taxSavingsAmount = Math.abs(oldRegimeTotalTax - newRegimeTotalTax);

  let aiTaxRecommendation = `Recommendation: Select ${recommendedRegime === 'NEW_REGIME' ? 'New Tax Regime' : 'Old Tax Regime'} to save ₹${taxSavingsAmount.toLocaleString('en-IN')} annually.`;

  if (ai) {
    try {
      const prompt = `Provide a 2-sentence tax saving guidance for FY 2025-26:
Gross Income: ₹${annualGrossIncome}.
Old Regime Tax: ₹${oldRegimeTotalTax}, New Regime Tax: ₹${newRegimeTotalTax}.
80C Utilized: ₹${total80CDeduction}/1.5L. 80D Utilized: ₹${total80DDeduction}/25k. Sec 24 Home Loan Interest: ₹${totalSec24Deduction}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response?.text) {
        aiTaxRecommendation = response.text.trim();
      }
    } catch (e) {
      console.warn('Gemini tax dashboard fallback:', e);
    }
  }

  return {
    financialYear: targetFy,
    annualGrossIncome,
    deductions: {
      sec80C: total80CDeduction,
      sec80D: total80DDeduction,
      sec24: totalSec24Deduction,
      standardOld: standardDeductionOld,
      standardNew: standardDeductionNew,
    },
    oldRegime: {
      taxableIncome: oldRegimeTaxableIncome,
      estimatedTax: oldRegimeTotalTax,
    },
    newRegime: {
      taxableIncome: newRegimeTaxableIncome,
      estimatedTax: newRegimeTotalTax,
    },
    recommendedRegime,
    taxSavingsAmount,
    aiTaxRecommendation,
  };
}
