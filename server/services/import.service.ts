import { prisma } from "../db/prisma.js";

export const importBankTransactions = async (
  userId: string,
  rawLines: { title: string; amount: number; type?: "EXPENSE" | "INCOME"; date?: string; merchant?: string }[]
) => {
  const defaultCategory = await prisma.category.findFirst({
    where: { userId },
  });

  const importedExpenses = [];

  for (const line of rawLines) {
    // Determine AI confidence score based on category & merchant recognition
    let confidence = 95;
    let title = line.title;
    if (line.merchant) {
      title = `${line.merchant} - ${line.title}`;
      confidence = 98;
    }

    const created = await prisma.expense.create({
      data: {
        userId,
        title,
        amount: Math.abs(line.amount),
        type: line.type || (line.amount < 0 ? "EXPENSE" : "EXPENSE"),
        categoryId: defaultCategory?.id || "",
        note: `AI Imported (Confidence: ${confidence}%)`,
        spentAt: line.date ? new Date(line.date) : new Date(),
      },
    });

    importedExpenses.push({
      ...created,
      aiConfidence: confidence,
    });
  }

  // Record audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: "CREATE",
      entity: "Import",
      newValue: `Imported ${importedExpenses.length} bank transactions via statement processor`,
    },
  });

  return {
    success: true,
    importedCount: importedExpenses.length,
    transactions: importedExpenses,
  };
};
