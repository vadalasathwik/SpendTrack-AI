import { prisma } from "../db/prisma.js";

export const getBankSyncStatus = async (userId: string) => {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const syncedCount = accounts.filter((a) => a.lastSync).length;
  const accountsHealthScore = accounts.length > 0 ? Math.round((syncedCount / accounts.length) * 100) : 100;

  const mismatches = accounts
    .filter((a) => Math.abs(a.currentBalance - a.availableBalance) > 1000)
    .map((a) => ({
      accountId: a.id,
      name: a.name,
      ledgerBalance: a.currentBalance,
      availableBalance: a.availableBalance,
      mismatchAmount: Math.abs(a.currentBalance - a.availableBalance),
    }));

  return {
    accountsHealthScore,
    totalAccounts: accounts.length,
    lastSyncTime: new Date().toISOString(),
    mismatchesCount: mismatches.length,
    mismatches,
    accounts: accounts.map((a) => ({
      ...a,
      syncStatus: "SYNCED",
    })),
  };
};

export const syncBankAccount = async (userId: string, accountId: string) => {
  const account = await prisma.bankAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  return prisma.bankAccount.update({
    where: { id: accountId },
    data: {
      lastSync: new Date(),
    },
  });
};
