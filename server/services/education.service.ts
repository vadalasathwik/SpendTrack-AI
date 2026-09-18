import { prisma } from "../db/prisma.js";

export async function getEducationGoals(userId: string) {
  let goals = await prisma.goal.findMany({
    where: {
      userId,
      category: {
        in: [
          "Education",
          "Child Education",
          "Higher Studies",
          "Certifications",
          "Skill Learning",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Seed initial education goals if none exist
  if (goals.length === 0) {
    await prisma.goal.createMany({
      data: [
        {
          userId,
          title: "Child Higher Education Fund (Stanford / IIT)",
          targetAmount: 2500000,
          currentAmount: 650000,
          monthlyContribution: 25000,
          targetDate: new Date("2032-08-01"),
          category: "Child Education",
          inflationRate: 8.0,
        },
        {
          userId,
          title: "Executive MBA / AI Leadership Certification",
          targetAmount: 400000,
          currentAmount: 180000,
          monthlyContribution: 15000,
          targetDate: new Date("2027-06-01"),
          category: "Certifications",
          inflationRate: 6.5,
        },
      ],
    });

    goals = await prisma.goal.findMany({
      where: {
        userId,
        category: {
          in: [
            "Education",
            "Child Education",
            "Higher Studies",
            "Certifications",
            "Skill Learning",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  const currentYear = new Date().getFullYear();

  const educationGoalsProcessed = goals.map((g) => {
    const targetYear = new Date(g.targetDate).getFullYear();
    const yearsLeft = Math.max(1, targetYear - currentYear);
    const inflation = g.inflationRate || 7.5;

    // Future cost with inflation formula: FV = PV * (1 + inflation/100)^n
    const futureCost = Math.round(
      g.targetAmount * Math.pow(1 + inflation / 100, yearsLeft)
    );

    // Required monthly contribution to hit future cost
    const remainingAmount = Math.max(0, futureCost - g.currentAmount);
    const totalMonthsLeft = yearsLeft * 12;
    const requiredMonthly =
      totalMonthsLeft > 0 ? Math.round(remainingAmount / totalMonthsLeft) : 0;

    // Completion probability based on current savings + projected contributions vs future cost
    const projectedSavings =
      g.currentAmount + g.monthlyContribution * totalMonthsLeft;
    const completionProbability = Math.min(
      100,
      Math.max(15, Math.round((projectedSavings / futureCost) * 100))
    );

    return {
      id: g.id,
      title: g.title,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate.toISOString().split("T")[0],
      monthlyContribution: g.monthlyContribution,
      category: g.category || "Education",
      inflationRate: inflation,
      futureCost,
      requiredMonthly,
      completionProbability,
    };
  });

  const totalTargetValue = educationGoalsProcessed.reduce(
    (sum, e) => sum + e.targetAmount,
    0
  );
  const totalSavedValue = educationGoalsProcessed.reduce(
    (sum, e) => sum + e.currentAmount,
    0
  );
  const totalFutureCost = educationGoalsProcessed.reduce(
    (sum, e) => sum + e.futureCost,
    0
  );

  return {
    goals: educationGoalsProcessed,
    totalTargetValue,
    totalSavedValue,
    totalFutureCost,
    overallCompletionRate:
      totalFutureCost > 0
        ? Math.round((totalSavedValue / totalFutureCost) * 100)
        : 0,
  };
}
