import { prisma } from "../db/prisma.js";

export interface CreateIncomeData {
  title: string;
  amount: number;
}

export async function getIncomes(userId: string) {
  return prisma.income.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createIncome(userId: string, data: CreateIncomeData) {
  if (!data.title || !data.title.trim()) {
    throw new Error("Income title is required");
  }
  if (data.amount === undefined || data.amount < 0) {
    throw new Error("Valid income amount is required");
  }

  return prisma.income.create({
    data: {
      userId,
      title: data.title.trim(),
      amount: Number(data.amount),
    },
  });
}

export async function deleteIncome(userId: string, id: string) {
  const existing = await prisma.income.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error("Income record not found");
  }

  return prisma.income.delete({
    where: { id },
  });
}
