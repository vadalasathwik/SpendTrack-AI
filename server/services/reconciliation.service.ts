import { prisma } from "../db/prisma.js";

export const getReconciliationStatus = async (userId: string) => {
  const expenses = await prisma.expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { spentAt: "desc" },
    take: 50,
  });

  const reconciliations = await prisma.reconciliationRecord.findMany({
    where: { userId },
  });

  // AI & heuristic duplicate detection
  const duplicateCandidates: { id1: string; id2: string; title: string; amount: number; date: string }[] = [];
  const seenMap: Record<string, any> = {};

  expenses.forEach((e) => {
    const key = `${e.amount}_${e.title.toLowerCase().trim()}_${new Date(e.spentAt).toISOString().split("T")[0]}`;
    if (seenMap[key]) {
      duplicateCandidates.push({
        id1: seenMap[key].id,
        id2: e.id,
        title: e.title,
        amount: e.amount,
        date: new Date(e.spentAt).toLocaleDateString(),
      });
    } else {
      seenMap[key] = e;
    }
  });

  const matchedCount = reconciliations.filter((r) => r.status === "MATCHED").length;
  const pendingCount = expenses.length - matchedCount;
  const duplicateCount = duplicateCandidates.length;

  const totalTransactions = expenses.length || 1;
  const reconciliationProgress = Math.min(100, Math.round((matchedCount / totalTransactions) * 100));

  return {
    reconciliationProgress,
    matchedCount,
    pendingCount,
    duplicateCount,
    duplicateCandidates,
    recentReconciliations: reconciliations.slice(0, 10),
    unreconciledExpenses: expenses.filter(
      (e) => !reconciliations.some((r) => r.expenseId === e.id && r.status === "MATCHED")
    ),
  };
};

export const updateReconciliation = async (
  userId: string,
  id: string,
  data: { status: "MATCHED" | "PENDING" | "DUPLICATE" | "MANUAL"; notes?: string; expenseId?: string }
) => {
  let record = await prisma.reconciliationRecord.findFirst({
    where: { id, userId },
  });

  if (!record && data.expenseId) {
    record = await prisma.reconciliationRecord.create({
      data: {
        userId,
        expenseId: data.expenseId,
        status: data.status,
        notes: data.notes || "Manual status update",
      },
    });
  } else if (record) {
    record = await prisma.reconciliationRecord.update({
      where: { id: record.id },
      data: {
        status: data.status,
        notes: data.notes ?? record.notes,
        matchedAt: new Date(),
      },
    });
  }

  return record;
};
