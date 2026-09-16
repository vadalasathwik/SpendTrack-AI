import { prisma } from "../db/prisma.js";

export interface CreateEmiData {
  title: string;
  bank: string;
  amount: number;
  dueDay: number;
  interestRate?: number;
  outstanding?: number;
  reminder?: boolean;
}

export interface UpdateEmiData {
  title?: string;
  bank?: string;
  amount?: number;
  dueDay?: number;
  interestRate?: number;
  outstanding?: number;
  reminder?: boolean;
}

export async function getEmis(userId: string) {
  return prisma.emiItem.findMany({
    where: { userId },
    orderBy: { dueDay: "asc" },
  });
}

export async function createEmi(userId: string, data: CreateEmiData) {
  if (!data.title || !data.title.trim()) {
    throw new Error("EMI title is required");
  }
  if (!data.bank || !data.bank.trim()) {
    throw new Error("Bank name is required");
  }
  if (data.amount === undefined || data.amount <= 0) {
    throw new Error("Valid EMI amount is required");
  }

  return prisma.emiItem.create({
    data: {
      userId,
      title: data.title.trim(),
      bank: data.bank.trim(),
      amount: Number(data.amount),
      dueDay: Number(data.dueDay || 1),
      interestRate: data.interestRate !== undefined ? Number(data.interestRate) : null,
      outstanding: data.outstanding !== undefined ? Number(data.outstanding) : null,
      reminder: data.reminder !== undefined ? data.reminder : true,
    },
  });
}

export async function updateEmi(userId: string, id: string, data: UpdateEmiData) {
  const existing = await prisma.emiItem.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("EMI not found");
  }

  return prisma.emiItem.update({
    where: { id },
    data: {
      ...(data.title ? { title: data.title.trim() } : {}),
      ...(data.bank ? { bank: data.bank.trim() } : {}),
      ...(data.amount !== undefined ? { amount: Number(data.amount) } : {}),
      ...(data.dueDay !== undefined ? { dueDay: Number(data.dueDay) } : {}),
      ...(data.interestRate !== undefined ? { interestRate: data.interestRate ? Number(data.interestRate) : null } : {}),
      ...(data.outstanding !== undefined ? { outstanding: data.outstanding ? Number(data.outstanding) : null } : {}),
      ...(data.reminder !== undefined ? { reminder: data.reminder } : {}),
    },
  });
}

export async function deleteEmi(userId: string, id: string) {
  const existing = await prisma.emiItem.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("EMI not found");
  }

  return prisma.emiItem.delete({
    where: { id },
  });
}
