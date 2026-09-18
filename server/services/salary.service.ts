import { prisma } from '../db/prisma.js';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getSalaryIntelligence(userId: string) {
  const records = await prisma.salaryRecord.findMany({
    where: { userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });

  const latest = records[0] || null;

  const annualGross = latest ? latest.grossSalary * 12 : 0;
  const annualNet = latest ? latest.netSalary * 12 : 0;
  const annualPfContribution = latest ? latest.pfDeduction * 12 : 0;

  // Compute salary growth if multiple records exist
  let growthPercentage = 0;
  if (records.length >= 2) {
    const previous = records[records.length - 1];
    if (previous.netSalary > 0) {
      growthPercentage = Math.round(((latest.netSalary - previous.netSalary) / previous.netSalary) * 100);
    }
  }

  // Estimated Taxable Income = Gross Salary - Standard Deduction (75,000) - 80C PF
  const standardDeduction = 75000;
  const estimatedTaxableIncome = Math.max(0, annualGross - standardDeduction - annualPfContribution);

  // Monthly Savings Potential = Net Salary * 35%
  const monthlySavingsPotential = latest ? Math.round(latest.netSalary * 0.35) : 0;

  let aiCareerCoachInsight = 'Career increment potential is strong. Consider allocating 50% of future raises into investments.';

  if (ai && latest) {
    try {
      const prompt = `Provide a 2-sentence career & salary coaching advice for a professional:
Monthly Net Salary: ₹${latest.netSalary} (Basic: ₹${latest.basic}, HRA: ₹${latest.hra}, PF: ₹${latest.pfDeduction}).
Annual Income: ₹${annualGross}. Growth rate: ${growthPercentage}%.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response?.text) {
        aiCareerCoachInsight = response.text.trim();
      }
    } catch (e) {
      console.warn('Gemini salary coach fallback:', e);
    }
  }

  return {
    records,
    latest,
    annualGross,
    annualNet,
    annualPfContribution,
    growthPercentage,
    estimatedTaxableIncome,
    monthlySavingsPotential,
    aiCareerCoachInsight,
  };
}

export async function saveSalaryRecord(userId: string, data: {
  month: number;
  year: number;
  basic: number;
  hra: number;
  da?: number;
  bonus?: number;
  pfDeduction?: number;
  profTaxDeduction?: number;
  otherDeductions?: number;
}) {
  const basic = Number(data.basic) || 0;
  const hra = Number(data.hra) || 0;
  const da = Number(data.da) || 0;
  const bonus = Number(data.bonus) || 0;
  const pf = Number(data.pfDeduction) || 0;
  const pt = Number(data.profTaxDeduction) || 200;
  const other = Number(data.otherDeductions) || 0;

  const grossSalary = basic + hra + da + bonus;
  const totalDeductions = pf + pt + other;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return prisma.salaryRecord.create({
    data: {
      userId,
      month: Number(data.month) || new Date().getMonth() + 1,
      year: Number(data.year) || new Date().getFullYear(),
      basic,
      hra,
      da,
      bonus,
      pfDeduction: pf,
      profTaxDeduction: pt,
      otherDeductions: other,
      grossSalary,
      netSalary,
    },
  });
}
