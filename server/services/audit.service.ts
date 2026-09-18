import { prisma } from "../db/prisma.js";

export const getAuditLogs = async (userId: string, limit = 50) => {
  let logs = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  // Seed sample initial audit records if empty
  if (logs.length === 0) {
    const sampleLogs = [
      { action: "CREATE", entity: "BankAccount", newValue: "Created HDFC Savings Account", timestamp: new Date(Date.now() - 3600000) },
      { action: "UPDATE", entity: "EnvelopeBudget", previousValue: "Allocated: ₹20,000", newValue: "Allocated: ₹25,000", timestamp: new Date(Date.now() - 7200000) },
      { action: "CREATE", entity: "Expense", newValue: "Added ₹1,200 Fuel via UPI", timestamp: new Date(Date.now() - 14400000) },
      { action: "UPDATE", entity: "TransactionRule", newValue: "Added Rule: Swiggy -> Food & Dining", timestamp: new Date(Date.now() - 86400000) },
    ];

    for (const log of sampleLogs) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: log.action,
          entity: log.entity,
          previousValue: log.previousValue || null,
          newValue: log.newValue,
          timestamp: log.timestamp,
        },
      });
    }

    logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  return {
    logs,
    totalLogs: logs.length,
  };
};

export const createAuditLog = async (
  userId: string,
  data: { action: string; entity: string; entityId?: string; previousValue?: string; newValue?: string }
) => {
  return prisma.auditLog.create({
    data: {
      userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      previousValue: data.previousValue,
      newValue: data.newValue,
    },
  });
};
