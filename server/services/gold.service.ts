import { prisma } from '../db/prisma.js';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getGoldWorkspace(userId: string) {
  const holdings = await prisma.preciousMetalHolding.findMany({
    where: { userId },
    orderBy: { purchasedAt: 'desc' },
  });

  const goldHoldings = holdings.filter((h) => h.metalType === 'GOLD');
  const silverHoldings = holdings.filter((h) => h.metalType === 'SILVER');

  const totalGoldGrams = goldHoldings.reduce((sum, h) => sum + h.grams, 0);
  const totalSilverGrams = silverHoldings.reduce((sum, h) => sum + h.grams, 0);

  const totalGoldInvested = goldHoldings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalGoldCurrentValue = goldHoldings.reduce((sum, h) => sum + h.currentValue, 0);

  const totalSilverInvested = silverHoldings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalSilverCurrentValue = silverHoldings.reduce((sum, h) => sum + h.currentValue, 0);

  const avgGoldPricePerGram = totalGoldGrams > 0 ? totalGoldInvested / totalGoldGrams : 0;
  const avgSilverPricePerGram = totalSilverGrams > 0 ? totalSilverInvested / totalSilverGrams : 0;

  const targetGoldGrams = 100;
  const goldGoalProgress = Math.min(100, Math.round((totalGoldGrams / targetGoldGrams) * 100));

  let aiBestMonthAnalysis = 'DIP buying strategy: Accumulate 2-5g on post-festive pullbacks during Q2 & Q3.';

  if (ai) {
    try {
      const prompt = `Provide a concise 2-sentence gold investment recommendation for a portfolio with ${totalGoldGrams}g Gold (Goal: 100g) at average rate ₹${avgGoldPricePerGram.toFixed(0)}/g and ${totalSilverGrams}g Silver.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response?.text) {
        aiBestMonthAnalysis = response.text.trim();
      }
    } catch (e) {
      console.warn('Gemini gold analysis fallback:', e);
    }
  }

  return {
    holdings,
    goldHoldings,
    silverHoldings,
    totalGoldGrams,
    totalSilverGrams,
    totalGoldInvested,
    totalGoldCurrentValue,
    totalSilverInvested,
    totalSilverCurrentValue,
    avgGoldPricePerGram,
    avgSilverPricePerGram,
    targetGoldGrams,
    goldGoalProgress,
    aiBestMonthAnalysis,
  };
}

export async function addMetalHolding(userId: string, data: {
  metalType: string;
  form: string;
  grams: number;
  buyPricePerGram: number;
  currentPricePerGram?: number;
  purchasedAt?: string;
  notes?: string;
}) {
  const grams = Number(data.grams) || 0;
  const buyRate = Number(data.buyPricePerGram) || 0;
  const currentRate = Number(data.currentPricePerGram) || buyRate;
  const totalCost = grams * buyRate;
  const currentValue = grams * currentRate;

  return prisma.preciousMetalHolding.create({
    data: {
      userId,
      metalType: data.metalType || 'GOLD',
      form: data.form || 'MMTC_PAMP',
      grams,
      buyPricePerGram: buyRate,
      currentPricePerGram: currentRate,
      totalCost,
      currentValue,
      purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : new Date(),
      notes: data.notes || '',
    },
  });
}

export async function deleteMetalHolding(userId: string, id: string) {
  return prisma.preciousMetalHolding.deleteMany({
    where: { id, userId },
  });
}
