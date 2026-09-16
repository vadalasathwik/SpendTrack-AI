import { prisma } from "../db/prisma.js";

export interface CreateInvestmentData {
  title: string;
  provider: string;
  amount: number;
  type: string; // "SIP", "GOLD_SIP", "MUTUAL_FUND", "STOCKS"
  frequency?: string;
  nextDate?: string | Date;
  isActive?: boolean;
}

export interface UpdateInvestmentData {
  title?: string;
  provider?: string;
  amount?: number;
  type?: string;
  frequency?: string;
  nextDate?: string | Date;
  isActive?: boolean;
}

export async function getInvestments(userId: string) {
  return prisma.investmentItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createInvestment(userId: string, data: CreateInvestmentData) {
  if (!data.title || !data.title.trim()) {
    throw new Error("Investment title is required");
  }
  if (!data.provider || !data.provider.trim()) {
    throw new Error("Provider is required");
  }
  if (data.amount === undefined || data.amount <= 0) {
    throw new Error("Valid investment amount is required");
  }

  return prisma.investmentItem.create({
    data: {
      userId,
      title: data.title.trim(),
      provider: data.provider.trim(),
      amount: Number(data.amount),
      type: data.type || "SIP",
      frequency: data.frequency || "MONTHLY",
      nextDate: data.nextDate ? new Date(data.nextDate) : new Date(),
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

export async function updateInvestment(userId: string, id: string, data: UpdateInvestmentData) {
  const existing = await prisma.investmentItem.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Investment not found");
  }

  return prisma.investmentItem.update({
    where: { id },
    data: {
      ...(data.title ? { title: data.title.trim() } : {}),
      ...(data.provider ? { provider: data.provider.trim() } : {}),
      ...(data.amount !== undefined ? { amount: Number(data.amount) } : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.frequency ? { frequency: data.frequency } : {}),
      ...(data.nextDate ? { nextDate: new Date(data.nextDate) } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export async function deleteInvestment(userId: string, id: string) {
  const existing = await prisma.investmentItem.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Investment not found");
  }

  return prisma.investmentItem.delete({
    where: { id },
  });
}
