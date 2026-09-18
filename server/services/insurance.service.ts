import { prisma } from '../db/prisma.js';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getInsuranceVault(userId: string) {
  const policies = await prisma.insurancePolicy.findMany({
    where: { userId },
    orderBy: { renewalDate: 'asc' },
  });

  const now = new Date();
  const totalAnnualPremium = policies.reduce((sum, p) => sum + p.premiumAmount, 0);
  const totalCoverage = policies.reduce((sum, p) => sum + p.coverageAmount, 0);

  const policiesWithStatus = policies.map((p) => {
    const renewal = new Date(p.renewalDate);
    const diffDays = Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let status: 'CRITICAL' | 'UPCOMING' | 'HEALTHY' = 'HEALTHY';
    if (diffDays <= 7) status = 'CRITICAL';
    else if (diffDays <= 30) status = 'UPCOMING';

    return {
      ...p,
      daysToRenewal: diffDays,
      status,
    };
  });

  const upcomingRenewalsCount = policiesWithStatus.filter((p) => p.daysToRenewal <= 30).length;

  let aiCoverageAnalysis = 'Insurance portfolio coverage is active with upcoming renewal tracking.';

  if (ai && policies.length > 0) {
    try {
      const prompt = `Analyze this insurance & warranty vault for a user:
Total Policies: ${policies.length}, Total Coverage: ₹${totalCoverage}, Annual Premiums: ₹${totalAnnualPremium}.
Policies: ${JSON.stringify(policies.map((p) => ({ title: p.title, type: p.type, coverage: p.coverageAmount, renewal: p.renewalDate })))}.

Provide a 2-sentence coverage check and renewal optimization advice.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response?.text) {
        aiCoverageAnalysis = response.text.trim();
      }
    } catch (e) {
      console.warn('Gemini insurance analysis fallback:', e);
    }
  }

  return {
    policies: policiesWithStatus,
    totalAnnualPremium,
    totalCoverage,
    upcomingRenewalsCount,
    aiCoverageAnalysis,
  };
}

export async function addPolicy(userId: string, data: {
  title: string;
  type: string;
  provider: string;
  policyNumber?: string;
  premiumAmount: number;
  renewalDate: string;
  coverageAmount?: number;
  attachmentUrl?: string;
  notes?: string;
}) {
  return prisma.insurancePolicy.create({
    data: {
      userId,
      title: data.title,
      type: data.type || 'HEALTH',
      provider: data.provider,
      policyNumber: data.policyNumber || '',
      premiumAmount: Number(data.premiumAmount) || 0,
      renewalDate: new Date(data.renewalDate),
      coverageAmount: Number(data.coverageAmount) || 0,
      attachmentUrl: data.attachmentUrl || '',
      notes: data.notes || '',
    },
  });
}

export async function deletePolicy(userId: string, id: string) {
  return prisma.insurancePolicy.deleteMany({
    where: { id, userId },
  });
}
