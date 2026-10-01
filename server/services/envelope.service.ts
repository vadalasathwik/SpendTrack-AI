import { ExpenseType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { getDbUserId } from "./budget.service.js";

const STANDARD_ENVELOPES = [
  { name: "Groceries & Food", carryForward: false },
  { name: "Fuel & Transport", carryForward: false },
  { name: "EMI & Loan Obligations", carryForward: true },
  { name: "Utility Bills & Internet", carryForward: false },
  { name: "Shopping & Lifestyle", carryForward: false },
  { name: "Gold & Metal Accumulation", carryForward: true },
  { name: "Emergency Liquidity Buffer", carryForward: true },
  { name: "Entertainment & Dining Out", carryForward: false },
];

export const getEnvelopes = async (userId: string, month?: number, year?: number) => {
  const dbUserId = await getDbUserId(userId);
  const currentDate = new Date();
  const targetMonth = month !== undefined && !isNaN(Number(month)) && Number(month) >= 1 && Number(month) <= 12
    ? Number(month)
    : currentDate.getMonth() + 1;
  const targetYear = year !== undefined && !isNaN(Number(year)) && Number(year) > 2000
    ? Number(year)
    : currentDate.getFullYear();

  // 1. Fetch MonthlyBudget for user/month/year
  const monthlyBudgetRecord = await prisma.monthlyBudget.findUnique({
    where: {
      month_year_userId: {
        month: targetMonth,
        year: targetYear,
        userId: dbUserId,
      },
    },
  });

  const totalMonthlyBudget = monthlyBudgetRecord ? Math.max(0, monthlyBudgetRecord.budget) : 0;

  // 2. Fetch commitments & financial items for dynamic envelope allocation
  const [emis, investments, savings] = await Promise.all([
    prisma.emiItem.findMany({ where: { userId: dbUserId } }),
    prisma.investmentItem.findMany({ where: { userId: dbUserId, isActive: true } }),
    prisma.savingItem.findMany({ where: { userId: dbUserId } }),
  ]);

  const totalEmiCommitment = emis.reduce((sum, e) => sum + e.amount, 0);
  const goldInvestments = investments.filter(
    (i) => i.type === "GOLD_SIP" || i.type === "GOLD" || i.title.toLowerCase().includes("gold") || i.title.toLowerCase().includes("metal")
  );
  const totalGoldCommitment = goldInvestments.reduce((sum, i) => sum + i.amount, 0);
  const emergencySavings = savings.filter(
    (s) => s.type === "EMERGENCY_FUND" || s.title.toLowerCase().includes("emergency")
  );
  const totalEmergencyCommitment = emergencySavings.reduce((sum, s) => sum + s.monthlyContribution, 0);

  // Calculate allocations mathematically based on real monthly budget
  const allocationsMap: Record<string, number> = {};

  if (totalMonthlyBudget <= 0) {
    // Missing/Zero budget -> zero allocations across all envelopes
    for (const envDef of STANDARD_ENVELOPES) {
      allocationsMap[envDef.name] = 0;
    }
  } else {
    // Reserve fixed commitments first
    const allocatedEMI = Math.min(totalMonthlyBudget, Math.round(totalEmiCommitment));
    const allocatedGold = Math.min(totalMonthlyBudget - allocatedEMI, Math.round(totalGoldCommitment));
    const allocatedEmergency = Math.min(
      totalMonthlyBudget - allocatedEMI - allocatedGold,
      Math.round(totalEmergencyCommitment)
    );

    const variablePool = Math.max(0, totalMonthlyBudget - allocatedEMI - allocatedGold - allocatedEmergency);

    allocationsMap["EMI & Loan Obligations"] = allocatedEMI;
    allocationsMap["Gold & Metal Accumulation"] = allocatedGold;
    allocationsMap["Emergency Liquidity Buffer"] = allocatedEmergency;

    // Distribute remaining variable pool among remaining 5 envelopes
    const allocatedGroceries = Math.round(variablePool * 0.35);
    const allocatedShopping = Math.round(variablePool * 0.20);
    const allocatedFuel = Math.round(variablePool * 0.15);
    const allocatedUtility = Math.round(variablePool * 0.15);
    const allocatedEntertainment = Math.max(
      0,
      variablePool - (allocatedGroceries + allocatedShopping + allocatedFuel + allocatedUtility)
    );

    allocationsMap["Groceries & Food"] = allocatedGroceries;
    allocationsMap["Shopping & Lifestyle"] = allocatedShopping;
    allocationsMap["Fuel & Transport"] = allocatedFuel;
    allocationsMap["Utility Bills & Internet"] = allocatedUtility;
    allocationsMap["Entertainment & Dining Out"] = allocatedEntertainment;
  }

  // 3. Fetch actual real Expenses for target month/year & compute envelope spent
  const startDate = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  const [expenses, rules] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId: dbUserId,
        type: ExpenseType.EXPENSE,
        spentAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { category: true },
    }),
    prisma.transactionRule.findMany({
      where: { userId: dbUserId, isActive: true },
    }),
  ]);

  const spentMap: Record<string, number> = {};
  for (const envDef of STANDARD_ENVELOPES) {
    spentMap[envDef.name] = 0;
  }

  for (const exp of expenses) {
    const titleLower = (exp.title || "").toLowerCase();
    const noteLower = (exp.note || "").toLowerCase();
    const catLower = (exp.category?.name || "").toLowerCase();

    // Check transaction rules first
    const matchedRule = rules.find(
      (r) =>
        r.envelope &&
        (titleLower.includes(r.keyword.toLowerCase()) ||
          noteLower.includes(r.keyword.toLowerCase()) ||
          catLower.includes(r.keyword.toLowerCase()))
    );

    let targetEnv = matchedRule?.envelope;

    if (!targetEnv) {
      if (
        titleLower.includes("emi") ||
        titleLower.includes("loan") ||
        catLower.includes("emi") ||
        catLower.includes("loan")
      ) {
        targetEnv = "EMI & Loan Obligations";
      } else if (
        titleLower.includes("gold") ||
        titleLower.includes("silver") ||
        titleLower.includes("metal") ||
        catLower.includes("gold")
      ) {
        targetEnv = "Gold & Metal Accumulation";
      } else if (
        titleLower.includes("emergency") ||
        titleLower.includes("buffer") ||
        catLower.includes("emergency")
      ) {
        targetEnv = "Emergency Liquidity Buffer";
      } else if (
        titleLower.includes("fuel") ||
        titleLower.includes("petrol") ||
        titleLower.includes("diesel") ||
        titleLower.includes("uber") ||
        titleLower.includes("ola") ||
        titleLower.includes("cab") ||
        catLower.includes("transport") ||
        catLower.includes("fuel")
      ) {
        targetEnv = "Fuel & Transport";
      } else if (
        titleLower.includes("bill") ||
        titleLower.includes("utility") ||
        titleLower.includes("electricity") ||
        titleLower.includes("internet") ||
        titleLower.includes("wifi") ||
        catLower.includes("utility") ||
        catLower.includes("bill")
      ) {
        targetEnv = "Utility Bills & Internet";
      } else if (
        titleLower.includes("movie") ||
        titleLower.includes("cinema") ||
        titleLower.includes("netflix") ||
        titleLower.includes("dining") ||
        titleLower.includes("restaurant") ||
        catLower.includes("entertainment") ||
        catLower.includes("dining")
      ) {
        targetEnv = "Entertainment & Dining Out";
      } else if (
        titleLower.includes("shop") ||
        titleLower.includes("cloth") ||
        titleLower.includes("amazon") ||
        titleLower.includes("flipkart") ||
        catLower.includes("shopping") ||
        catLower.includes("lifestyle")
      ) {
        targetEnv = "Shopping & Lifestyle";
      } else {
        targetEnv = "Groceries & Food";
      }
    }

    spentMap[targetEnv] = Math.round(((spentMap[targetEnv] || 0) + exp.amount) * 100) / 100;
  }

  // 4. Reconcile existing EnvelopeBudget records in DB for user/month/year
  const envelopes = [];
  for (const envDef of STANDARD_ENVELOPES) {
    const allocated = allocationsMap[envDef.name] || 0;
    const spent = spentMap[envDef.name] || 0;

    const existing = await prisma.envelopeBudget.findFirst({
      where: {
        userId: dbUserId,
        month: targetMonth,
        year: targetYear,
        name: envDef.name,
      },
    });

    let record;
    if (existing) {
      record = await prisma.envelopeBudget.update({
        where: { id: existing.id },
        data: {
          allocated,
          spent,
          carryForward: envDef.carryForward,
        },
      });
    } else {
      record = await prisma.envelopeBudget.create({
        data: {
          userId: dbUserId,
          month: targetMonth,
          year: targetYear,
          name: envDef.name,
          allocated,
          spent,
          carryForward: envDef.carryForward,
        },
      });
    }
    envelopes.push(record);
  }

  const totalAllocated = envelopes.reduce((acc, e) => acc + e.allocated, 0);
  const totalSpent = envelopes.reduce((acc, e) => acc + e.spent, 0);
  const totalRemaining = Math.max(0, totalAllocated - totalSpent);

  // AI Reallocation Suggestions (only for real overspend)
  const aiReallocations = envelopes
    .filter((e) => e.allocated > 0 && e.spent > e.allocated)
    .map((e) => ({
      envelope: e.name,
      overspend: Math.round((e.spent - e.allocated) * 100) / 100,
      recommendation: `Overspent by ₹${(e.spent - e.allocated).toLocaleString("en-IN")}. Reallocate from Emergency Buffer or Shopping envelope.`,
    }));

  return {
    envelopes: envelopes.map((e) => ({
      ...e,
      remaining: Math.max(0, e.allocated - e.spent),
      progress: e.allocated > 0 ? Math.min(100, Math.round((e.spent / e.allocated) * 100)) : 0,
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
  const dbUserId = await getDbUserId(userId);
  const existing = await prisma.envelopeBudget.findFirst({
    where: { id, userId: dbUserId },
  });
  if (!existing) throw new Error("Envelope record not found");

  return prisma.envelopeBudget.update({
    where: { id },
    data: {
      ...(data.allocated !== undefined ? { allocated: Math.max(0, Number(data.allocated)) } : {}),
      ...(data.carryForward !== undefined ? { carryForward: data.carryForward } : {}),
    },
  });
};

export const createSpendingRule = async (
  userId: string,
  data: { keyword: string; category?: string; accountId?: string; tag?: string; envelope?: string }
) => {
  const dbUserId = await getDbUserId(userId);
  return prisma.transactionRule.create({
    data: {
      userId: dbUserId,
      keyword: data.keyword,
      category: data.category,
      accountId: data.accountId,
      tag: data.tag,
      envelope: data.envelope,
    },
  });
};
