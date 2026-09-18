import { prisma } from '../db/prisma.js';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getPortfolioSummary(userId: string) {
  const holdings = await prisma.portfolioHolding.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // Asset allocation breakdown
  const assetMap: Record<string, number> = {};
  const sectorMap: Record<string, number> = {};

  holdings.forEach((h) => {
    assetMap[h.assetType] = (assetMap[h.assetType] || 0) + h.currentValue;
    const sec = h.sector || 'General';
    sectorMap[sec] = (sectorMap[sec] || 0) + h.currentValue;
  });

  const assetAllocation = Object.entries(assetMap).map(([type, val]) => ({
    type,
    amount: val,
    percentage: totalCurrentValue > 0 ? (val / totalCurrentValue) * 100 : 0,
  }));

  const sectorExposure = Object.entries(sectorMap).map(([sector, val]) => ({
    sector,
    amount: val,
    percentage: totalCurrentValue > 0 ? (val / totalCurrentValue) * 100 : 0,
  }));

  // Average CAGR
  const validCagrs = holdings.filter((h) => h.cagr && h.cagr > 0);
  const averageCagr = validCagrs.length > 0
    ? validCagrs.reduce((acc, curr) => acc + (curr.cagr || 0), 0) / validCagrs.length
    : 12.5;

  let aiRiskAnalysis = 'Portfolio appears balanced with steady compounding metrics.';

  if (ai) {
    try {
      const prompt = `Analyze this financial portfolio for risk:
Total Invested: ₹${totalInvested}, Current Value: ₹${totalCurrentValue}, Net Gain: ₹${totalProfitLoss} (${totalProfitLossPercentage.toFixed(1)}%).
Asset Allocation: ${JSON.stringify(assetAllocation)}.
Sector Exposure: ${JSON.stringify(sectorExposure)}.

Provide a 2-sentence executive summary of portfolio risk, diversification, and optimization tips.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response?.text) {
        aiRiskAnalysis = response.text.trim();
      }
    } catch (e) {
      console.warn('Gemini portfolio risk analysis failed, fallback used:', e);
    }
  }

  return {
    holdings,
    totalInvested,
    totalCurrentValue,
    totalProfitLoss,
    totalProfitLossPercentage,
    averageCagr,
    assetAllocation,
    sectorExposure,
    aiRiskAnalysis,
  };
}

export async function addHolding(userId: string, data: {
  name: string;
  symbol?: string;
  assetType: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  sector?: string;
  cagr?: number;
}) {
  const qty = Number(data.quantity) || 0;
  const buyP = Number(data.buyPrice) || 0;
  const currP = Number(data.currentPrice) || buyP;
  const invested = qty * buyP;
  const currentValue = qty * currP;

  return prisma.portfolioHolding.create({
    data: {
      userId,
      name: data.name,
      symbol: data.symbol || data.name.substring(0, 5).toUpperCase(),
      assetType: data.assetType || 'MUTUAL_FUNDS',
      quantity: qty,
      buyPrice: buyP,
      currentPrice: currP,
      invested,
      currentValue,
      sector: data.sector || 'General',
      cagr: Number(data.cagr) || 12,
    },
  });
}

export async function deleteHolding(userId: string, id: string) {
  return prisma.portfolioHolding.deleteMany({
    where: { id, userId },
  });
}
