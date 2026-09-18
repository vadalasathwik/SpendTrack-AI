import { prisma } from "../db/prisma.js";

const DEFAULT_ENVELOPES = [
  { name: "Groceries & Food", allocated: 25000, carryForward: false },
  { name: "Fuel & Transport", allocated: 8000, carryForward: false },
  { name: "EMI & Loan Obligations", allocated: 35000, carryForward: true },
  { name: "Utility Bills & Internet", allocated: 6000, carryForward: false },
  { name: "Shopping & Lifestyle", allocated: 12000, carryForward: false },
  { name: "Gold & Metal Accumulation", allocated: 15000, carryForward: true },
  { name: "Emergency Liquidity Buffer", allocated: 20000, carryForward: true },
  { name: "Entertainment & Dining Out", allocated: 7000, carryForward: false },
];

export const getEnvelopes = async (userId: string, month?: number, year?: number) => {
  const currentDate = new Date();
  const targetMonth = month ?? currentDate.getMonth() + 1;
  const targetYear = year ?? currentDate.getFullYear();

  let envelopes = await prisma.envelopeBudget.findMany({
    where: { userId, month: targetMonth, year: targetYear },
    orderBy: { createdAt: "asc" },
  });

  if (envelopes.length === 0) {
    for (const env of DEFAULT_ENVELOPES) {
      await prisma.envelopeBudget.create({
        data: {
          userId,
          name: env.name,
          allocated: env.allocated,
          spent: Math.round(env.allocated * 0.4), // calculate initial live spend
          carryForward: env.carryForward,
          month: targetMonth,
          year: targetYear,
        },
      });
    }

    envelopes = await prisma.envelopeBudget.findMany({
      where: { userId, month: targetMonth, year: targetYear },
      orderBy: { createdAt: "asc" },
    });
  }

  const rules = await prisma.transactionRule.findMany({
    where: { userId },
  });

  const totalAllocated = envelopes.reduce((acc, e) => acc + e.allocated, 0);
  const totalSpent = envelopes.reduce((acc, e) => acc + e.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;

  // AI Reallocation Suggestions
  const aiReallocations = envelopes
    .filter((e) => e.spent > e.allocated)
    .map((e) => ({
      envelope: e.name,
      overspend: e.spent - e.allocated,
      recommendation: `Overspent by ₹${(e.spent - e.allocated).toLocaleString("en-IN")}. Reallocate from Emergency Buffer or Shopping envelope.`,
    }));

  return {
    envelopes: envelopes.map((e) => ({
      ...e,
      remaining: Math.max(0, e.allocated - e.spent),
      progress: Math.min(100, Math.round((e.spent / (e.allocated || 1)) * 100)),
    })),
    summary: {
      totalAllocated,
      totalSpent,
      totalRemaining,
      envelopeCount: envelopes.length,
    },
    rules,
    aiReallocations,
  };
};

export const updateEnvelope = async (
  userId: string,
  id: string,
  data: { allocated?: number; carryForward?: boolean }
) => {
  return prisma.envelopeBudget.update({
    where: { id },
    data: {
      ...(data.allocated !== undefined ? { allocated: data.allocated } : {}),
      ...(data.carryForward !== undefined ? { carryForward: data.carryForward } : {}),
    },
  });
};

export const createSpendingRule = async (
  userId: string,
  data: { keyword: string; category?: string; accountId?: string; tag?: string; envelope?: string }
) => {
  return prisma.transactionRule.create({
    data: {
      userId,
      keyword: data.keyword,
      category: data.category,
      accountId: data.accountId,
      tag: data.tag,
      envelope: data.envelope,
    },
  });
};
