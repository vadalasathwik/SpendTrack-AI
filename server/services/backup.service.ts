import { prisma } from "../db/prisma.js";

export const exportUserData = async (userId: string) => {
  const [
    user,
    categories,
    expenses,
    incomes,
    emis,
    investments,
    savings,
    notes,
    reminders,
    goals,
    bankAccounts,
    propertyAssets,
    vehicleAssets,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.category.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.income.findMany({ where: { userId } }),
    prisma.emiItem.findMany({ where: { userId } }),
    prisma.investmentItem.findMany({ where: { userId } }),
    prisma.savingItem.findMany({ where: { userId } }),
    prisma.financialNote.findMany({ where: { userId } }),
    prisma.reminder.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.bankAccount.findMany({ where: { userId } }),
    prisma.propertyAsset.findMany({ where: { userId } }),
    prisma.vehicleAsset.findMany({ where: { userId } }),
  ]);

  return {
    version: "5.1.0",
    exportedAt: new Date().toISOString(),
    user: { email: user?.email, name: user?.name },
    data: {
      categories,
      expenses,
      incomes,
      emis,
      investments,
      savings,
      notes,
      reminders,
      goals,
      bankAccounts,
      propertyAssets,
      vehicleAssets,
    },
  };
};

export const importUserData = async (userId: string, backupPayload: any) => {
  if (!backupPayload || !backupPayload.data) {
    throw new Error("Invalid backup file payload format");
  }

  const { data } = backupPayload;

  return prisma.$transaction(async (tx) => {
    let importedCounts = { expenses: 0, goals: 0, notes: 0, bankAccounts: 0 };

    if (Array.isArray(data.expenses)) {
      for (const exp of data.expenses) {
        if (!exp.title || !exp.amount) continue;
        await tx.expense.create({
          data: {
            userId,
            title: exp.title,
            amount: Number(exp.amount),
            type: exp.type || "EXPENSE",
            note: exp.note || "",
            location: exp.location || "",
            spentAt: exp.spentAt ? new Date(exp.spentAt) : new Date(),
            categoryId: exp.categoryId || "cat-1",
          },
        });
        importedCounts.expenses++;
      }
    }

    if (Array.isArray(data.goals)) {
      for (const g of data.goals) {
        if (!g.title || !g.targetAmount) continue;
        await tx.goal.create({
          data: {
            userId,
            title: g.title,
            targetAmount: Number(g.targetAmount),
            currentAmount: Number(g.currentAmount || 0),
            targetDate: g.targetDate ? new Date(g.targetDate) : new Date(),
            monthlyContribution: Number(g.monthlyContribution || 0),
            category: g.category || "General",
          },
        });
        importedCounts.goals++;
      }
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "BackupRestore",
        newValue: `Restored ${importedCounts.expenses} expenses & ${importedCounts.goals} goals from backup file`,
      },
    });

    return {
      success: true,
      importedCounts,
    };
  });
};
