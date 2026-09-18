import { prisma } from "../db/prisma.js";

export const getAccounts = async (userId: string) => {
  let accounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  // Seed default accounts if user has none
  if (accounts.length === 0) {
    const defaultAccounts = [
      { name: "HDFC Salary Account", type: "SAVINGS", bankName: "HDFC Bank", currentBalance: 125000, availableBalance: 125000, isDefault: true, logoUrl: "hdfc" },
      { name: "SBI Emergency Account", type: "SAVINGS", bankName: "SBI", currentBalance: 65000, availableBalance: 65000, isDefault: false, logoUrl: "sbi" },
      { name: "ICICI Rewards Card", type: "CREDIT_CARD", bankName: "ICICI Bank", currentBalance: -18500, availableBalance: 200000, isDefault: false, logoUrl: "icici" },
      { name: "GPay / UPI Wallet", type: "WALLET", bankName: "UPI Wallet", currentBalance: 4200, availableBalance: 4200, isDefault: false, logoUrl: "upi" },
      { name: "Cash Wallet", type: "CASH", bankName: "Physical Cash", currentBalance: 3500, availableBalance: 3500, isDefault: false, logoUrl: "cash" },
    ];

    for (const acc of defaultAccounts) {
      await prisma.bankAccount.create({
        data: {
          ...acc,
          userId,
        },
      });
    }

    accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  const totalAssets = accounts.reduce((acc, a) => (a.currentBalance > 0 ? acc + a.currentBalance : acc), 0);
  const totalLiabilities = accounts.reduce((acc, a) => (a.currentBalance < 0 ? acc + Math.abs(a.currentBalance) : acc), 0);
  const netLiquidity = totalAssets - totalLiabilities;

  return {
    accounts,
    summary: {
      totalAccounts: accounts.length,
      totalAssets,
      totalLiabilities,
      netLiquidity,
      defaultAccount: accounts.find((a) => a.isDefault) || accounts[0],
    },
  };
};

export const createAccount = async (
  userId: string,
  data: { name: string; type: string; bankName?: string; currentBalance?: number; availableBalance?: number; isDefault?: boolean }
) => {
  if (data.isDefault) {
    await prisma.bankAccount.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  return prisma.bankAccount.create({
    data: {
      userId,
      name: data.name,
      type: data.type || "SAVINGS",
      bankName: data.bankName || "Bank",
      currentBalance: data.currentBalance ?? 0,
      availableBalance: data.availableBalance ?? (data.currentBalance ?? 0),
      isDefault: data.isDefault ?? false,
    },
  });
};

export const updateAccount = async (
  userId: string,
  id: string,
  data: { name?: string; currentBalance?: number; availableBalance?: number; isDefault?: boolean }
) => {
  if (data.isDefault) {
    await prisma.bankAccount.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  return prisma.bankAccount.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.currentBalance !== undefined ? { currentBalance: data.currentBalance } : {}),
      ...(data.availableBalance !== undefined ? { availableBalance: data.availableBalance } : {}),
      ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
      lastSync: new Date(),
    },
  });
};

export const transferBetweenAccounts = async (
  userId: string,
  data: { fromAccountId: string; toAccountId: string; amount: number; notes?: string }
) => {
  const { fromAccountId, toAccountId, amount, notes } = data;
  if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
    throw new Error("Invalid transfer parameters");
  }

  const fromAcc = await prisma.bankAccount.findFirst({ where: { id: fromAccountId, userId } });
  const toAcc = await prisma.bankAccount.findFirst({ where: { id: toAccountId, userId } });

  if (!fromAcc || !toAcc) {
    throw new Error("Source or destination bank account not found");
  }

  // Execute transfer in Prisma transaction
  return prisma.$transaction(async (tx) => {
    const updatedFrom = await tx.bankAccount.update({
      where: { id: fromAccountId },
      data: {
        currentBalance: fromAcc.currentBalance - amount,
        availableBalance: fromAcc.availableBalance - amount,
        lastSync: new Date(),
      },
    });

    const updatedTo = await tx.bankAccount.update({
      where: { id: toAccountId },
      data: {
        currentBalance: toAcc.currentBalance + amount,
        availableBalance: toAcc.availableBalance + amount,
        lastSync: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entity: "BankAccountTransfer",
        entityId: `${fromAccountId}->${toAccountId}`,
        previousValue: `From: ${fromAcc.name} (₹${fromAcc.currentBalance}), To: ${toAcc.name} (₹${toAcc.currentBalance})`,
        newValue: `Transferred ₹${amount}. Notes: ${notes || "Inter-account transfer"}`,
      },
    });

    return {
      success: true,
      fromAccount: updatedFrom,
      toAccount: updatedTo,
      amountTransferred: amount,
    };
  });
};
