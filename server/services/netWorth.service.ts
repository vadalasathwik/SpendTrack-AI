import { prisma } from '../db/prisma.js';

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetsByCategory: Record<string, number>;
  liabilitiesByCategory: Record<string, number>;
  assetsList: any[];
  liabilitiesList: any[];
}

export async function getNetWorth(userId: string): Promise<NetWorthSummary> {
  // Fetch manually added assets & liabilities
  const manualAssets = await prisma.assetItem.findMany({ where: { userId } });
  const manualLiabilities = await prisma.liabilityItem.findMany({ where: { userId } });

  // Fetch automatic assets & liabilities from existing models
  const savings = await prisma.savingItem.findMany({ where: { userId } });
  const investments = await prisma.investmentItem.findMany({ where: { userId } });
  const emis = await prisma.emiItem.findMany({ where: { userId } });

  const assetsList: any[] = [...manualAssets];
  const liabilitiesList: any[] = [...manualLiabilities];

  // Auto-map savings (RD, FD, Emergency Fund) to assets
  for (const s of savings) {
    assetsList.push({
      id: `auto-saving-${s.id}`,
      name: `${s.title} (${s.type})`,
      category: s.type === 'FD' ? 'FD' : s.type === 'RD' ? 'RD' : 'Bank',
      amount: s.currentAmount,
      isAuto: true,
    });
  }

  // Auto-map investments (SIP, Mutual Fund, Stocks) to assets
  for (const inv of investments) {
    assetsList.push({
      id: `auto-inv-${inv.id}`,
      name: `${inv.title} (${inv.provider})`,
      category: inv.type === 'STOCKS' ? 'Stocks' : inv.type === 'GOLD_SIP' ? 'Gold' : 'Mutual Funds',
      amount: inv.amount * 12, // Estimated annual valuation
      isAuto: true,
    });
  }

  // Auto-map loan outstanding balances to liabilities
  for (const emi of emis) {
    if (emi.outstanding && emi.outstanding > 0) {
      liabilitiesList.push({
        id: `auto-emi-${emi.id}`,
        name: `${emi.title} (${emi.bank})`,
        category: emi.title.toLowerCase().includes('home') ? 'Home Loan' : emi.title.toLowerCase().includes('car') ? 'Car Loan' : 'Personal Loan',
        amount: emi.outstanding,
        isAuto: true,
      });
    }
  }

  const assetsByCategory: Record<string, number> = {};
  let totalAssets = 0;
  for (const a of assetsList) {
    totalAssets += a.amount;
    assetsByCategory[a.category] = (assetsByCategory[a.category] || 0) + a.amount;
  }

  const liabilitiesByCategory: Record<string, number> = {};
  let totalLiabilities = 0;
  for (const l of liabilitiesList) {
    totalLiabilities += l.amount;
    liabilitiesByCategory[l.category] = (liabilitiesByCategory[l.category] || 0) + l.amount;
  }

  const netWorth = totalAssets - totalLiabilities;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    assetsByCategory,
    liabilitiesByCategory,
    assetsList,
    liabilitiesList,
  };
}

export async function createAsset(userId: string, data: { name: string; category: string; amount: number }) {
  return prisma.assetItem.create({
    data: {
      userId,
      name: data.name,
      category: data.category || 'Other',
      amount: Number(data.amount),
    },
  });
}

export async function deleteAsset(userId: string, id: string) {
  const existing = await prisma.assetItem.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Asset not found');
  return prisma.assetItem.delete({ where: { id } });
}

export async function createLiability(userId: string, data: { name: string; category: string; amount: number }) {
  return prisma.liabilityItem.create({
    data: {
      userId,
      name: data.name,
      category: data.category || 'Other',
      amount: Number(data.amount),
    },
  });
}

export async function deleteLiability(userId: string, id: string) {
  const existing = await prisma.liabilityItem.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Liability not found');
  return prisma.liabilityItem.delete({ where: { id } });
}
