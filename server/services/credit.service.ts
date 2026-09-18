import { prisma } from "../db/prisma.js";

export async function getCreditWorkspace(userId: string) {
  // 1. Credit accounts from BankAccount table
  let creditAccounts = await prisma.bankAccount.findMany({
    where: { userId, type: "CREDIT_CARD" },
  });

  if (creditAccounts.length === 0) {
    await prisma.bankAccount.createMany({
      data: [
        {
          userId,
          name: "HDFC Regalia Gold Credit Card",
          type: "CREDIT_CARD",
          bankName: "HDFC Bank",
          accountNumber: "•••• 4892",
          currentBalance: 42500, // used amount
          availableBalance: 257500, // available limit
        },
        {
          userId,
          name: "ICICI Amazon Pay Credit Card",
          type: "CREDIT_CARD",
          bankName: "ICICI Bank",
          accountNumber: "•••• 7120",
          currentBalance: 12800,
          availableBalance: 187200,
        },
      ],
    });

    creditAccounts = await prisma.bankAccount.findMany({
      where: { userId, type: "CREDIT_CARD" },
    });
  }

  const creditCards = creditAccounts.map((c) => {
    const used = Math.abs(c.currentBalance);
    const available = Math.max(0, c.availableBalance);
    const limit = used + available || 300000;
    const utilizationPercent =
      limit > 0 ? Number(((used / limit) * 100).toFixed(1)) : 0;

    return {
      id: c.id,
      name: c.name,
      bankName: c.bankName || "Bank",
      creditLimit: limit,
      currentBalance: used,
      availableLimit: available,
      utilizationPercent,
      dueDate: "15th of every month",
    };
  });

  const totalCreditLimit = creditCards.reduce(
    (sum, c) => sum + c.creditLimit,
    0
  );
  const totalUsedCredit = creditCards.reduce(
    (sum, c) => sum + c.currentBalance,
    0
  );

  const overallUtilization =
    totalCreditLimit > 0
      ? Number(((totalUsedCredit / totalCreditLimit) * 100).toFixed(1))
      : 0;

  // Credit health score estimate (Range 300 - 900)
  let creditHealthScore = 785;
  if (overallUtilization > 50) creditHealthScore -= 60;
  else if (overallUtilization > 30) creditHealthScore -= 30;
  else if (overallUtilization < 15) creditHealthScore += 25;

  // Improvement suggestions based on live data
  const improvementSuggestions: string[] = [];
  if (overallUtilization > 30) {
    improvementSuggestions.push(
      "Keep total credit utilization below 30% to improve score by ~25 points."
    );
  } else {
    improvementSuggestions.push(
      "Excellent credit utilization (<30%). Keep up timely monthly bill clearances."
    );
  }
  improvementSuggestions.push(
    "Set up Auto-Pay for total statement balance 3 days before due date."
  );
  improvementSuggestions.push(
    "Avoid closing older credit cards to maintain a longer average credit history."
  );

  // EMI eligibility indicator
  let emiEligibility: "EXCELLENT" | "GOOD" | "MODERATE" | "CAUTION" =
    "EXCELLENT";
  if (creditHealthScore >= 780) emiEligibility = "EXCELLENT";
  else if (creditHealthScore >= 720) emiEligibility = "GOOD";
  else if (creditHealthScore >= 650) emiEligibility = "MODERATE";
  else emiEligibility = "CAUTION";

  return {
    creditCards,
    totalCreditLimit,
    totalUsedCredit,
    overallUtilization,
    creditHealthScore,
    improvementSuggestions,
    emiEligibility,
  };
}
