import { prisma } from "../db/prisma.js";

export interface CreateSavingData {
  title: string;
  type: string; // "RD", "FD", "EMERGENCY_FUND"
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  interestRate?: number;
  maturityDate?: string | Date;
}

export interface UpdateSavingData {
  title?: string;
  type?: string;
  targetAmount?: number;
  currentAmount?: number;
  monthlyContribution?: number;
  interestRate?: number;
  maturityDate?: string | Date;
}

export async function getSavings(userId: string) {
  return prisma.savingItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createSaving(userId: string, data: CreateSavingData) {
  if (!data.title || !data.title.trim()) {
    throw new Error("Savings plan title is required");
  }

  return prisma.savingItem.create({
    data: {
      userId,
      title: data.title.trim(),
      type: data.type || "RD",
      targetAmount: Number(data.targetAmount || 0),
      currentAmount: Number(data.currentAmount || 0),
      monthlyContribution: Number(data.monthlyContribution || 0),
      interestRate: data.interestRate !== undefined ? Number(data.interestRate) : null,
      maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
    },
  });
}

export async function updateSaving(userId: string, id: string, data: UpdateSavingData) {
  const existing = await prisma.savingItem.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Savings record not found");
  }

  return prisma.savingItem.update({
    where: { id },
    data: {
      ...(data.title ? { title: data.title.trim() } : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.targetAmount !== undefined ? { targetAmount: Number(data.targetAmount) } : {}),
      ...(data.currentAmount !== undefined ? { currentAmount: Number(data.currentAmount) } : {}),
      ...(data.monthlyContribution !== undefined ? { monthlyContribution: Number(data.monthlyContribution) } : {}),
      ...(data.interestRate !== undefined ? { interestRate: data.interestRate ? Number(data.interestRate) : null } : {}),
      ...(data.maturityDate !== undefined ? { maturityDate: data.maturityDate ? new Date(data.maturityDate) : null } : {}),
    },
  });
}

export async function deleteSaving(userId: string, id: string) {
  const existing = await prisma.savingItem.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Savings record not found");
  }

  return prisma.savingItem.delete({
    where: { id },
  });
}
