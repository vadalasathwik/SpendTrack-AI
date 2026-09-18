import { prisma } from "../db/prisma.js";

export interface LedgerFilterOptions {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  merchant?: string;
  minAmount?: number;
  maxAmount?: number;
  type?: "EXPENSE" | "INCOME";
}

export const getLedger = async (userId: string, filters: LedgerFilterOptions = {}) => {
  const where: any = { userId };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.merchant) {
    where.title = { contains: filters.merchant, mode: "insensitive" };
  }

  if (filters.minAmount || filters.maxAmount) {
    where.amount = {};
    if (filters.minAmount) where.amount.gte = Number(filters.minAmount);
    if (filters.maxAmount) where.amount.lte = Number(filters.maxAmount);
  }

  if (filters.startDate || filters.endDate) {
    where.spentAt = {};
    if (filters.startDate) where.spentAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.spentAt.lte = new Date(filters.endDate);
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: { spentAt: "desc" },
  });

  const totalDebit = expenses.filter((e) => e.type === "EXPENSE").reduce((acc, e) => acc + e.amount, 0);
  const totalCredit = expenses.filter((e) => e.type === "INCOME").reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalCredit - totalDebit;

  return {
    transactions: expenses,
    summary: {
      totalCount: expenses.length,
      totalDebit,
      totalCredit,
      netBalance,
    },
  };
};

export const createLedgerEntry = async (
  userId: string,
  data: {
    title: string;
    amount: number;
    type?: "EXPENSE" | "INCOME";
    categoryId: string;
    note?: string;
    spentAt?: string;
    accountName?: string;
    merchant?: string;
    tags?: string;
    gstAmount?: number;
    location?: string;
    paymentMethod?: string;
  }
) => {
  // Check smart spending rules for auto-categorization
  const rules = await prisma.transactionRule.findMany({
    where: { userId, isActive: true },
  });

  let assignedCategoryId = data.categoryId;
  let noteAppend = data.note || "";

  for (const rule of rules) {
    if (data.title.toLowerCase().includes(rule.keyword.toLowerCase())) {
      if (rule.category) {
        const matchingCat = await prisma.category.findFirst({
          where: { userId, name: { contains: rule.category, mode: "insensitive" } },
        });
        if (matchingCat) assignedCategoryId = matchingCat.id;
      }
      if (rule.tag) {
        noteAppend = noteAppend ? `${noteAppend} #${rule.tag}` : `#${rule.tag}`;
      }
      break;
    }
  }

  const expense = await prisma.expense.create({
    data: {
      userId,
      title: data.merchant ? `${data.merchant} - ${data.title}` : data.title,
      amount: data.amount,
      type: data.type || "EXPENSE",
      categoryId: assignedCategoryId,
      note: noteAppend,
      spentAt: data.spentAt ? new Date(data.spentAt) : new Date(),
    },
    include: {
      category: true,
    },
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      userId,
      action: "CREATE",
      entity: "Expense",
      entityId: expense.id,
      newValue: JSON.stringify(expense),
    },
  });

  return expense;
};
