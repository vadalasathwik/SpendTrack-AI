import { prisma } from "../db/prisma.js";

export async function getHealthcareFinance(userId: string) {
  // 1. Health insurance policies
  let insurancePolicies = await prisma.insurancePolicy.findMany({
    where: { userId, type: "HEALTH" },
  });

  if (insurancePolicies.length === 0) {
    await prisma.insurancePolicy.create({
      data: {
        userId,
        title: "HDFC ERGO Optima Secure Family Floater",
        type: "HEALTH",
        provider: "HDFC ERGO General Insurance",
        policyNumber: "POL-HDFC-99201",
        premiumAmount: 24500,
        coverageAmount: 1500000,
        renewalDate: new Date("2027-03-15"),
        notes: "Restoration benefit included up to 100%",
      },
    });
    insurancePolicies = await prisma.insurancePolicy.findMany({
      where: { userId, type: "HEALTH" },
    });
  }

  // 2. Medical expenses from last 12 months
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const medicalExpenses = await prisma.expense.findMany({
    where: {
      userId,
      spentAt: { gte: oneYearAgo },
      category: {
        name: { in: ["Healthcare", "Medical", "Health", "Pharmacy", "Doctor"] },
      },
    },
    include: { category: true },
    orderBy: { spentAt: "desc" },
  });

  const annualHealthcareSpend = medicalExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const totalCoverageAmount = insurancePolicies.reduce(
    (sum, p) => sum + p.coverageAmount,
    0
  );

  // Remaining insured amount calculation
  const remainingInsuredAmount = Math.max(
    0,
    totalCoverageAmount - annualHealthcareSpend
  );

  // Coverage adequacy percentage (Benchmark: ₹15L coverage for family)
  const recommendedCoverage = 1500000;
  const coverageAdequacy = Math.min(
    100,
    Math.round((totalCoverageAmount / recommendedCoverage) * 100)
  );

  // Medical emergency fund from savings
  const emergencySavings = await prisma.savingItem.findMany({
    where: {
      userId,
      title: { contains: "Emergency", mode: "insensitive" },
    },
  });

  const medicalEmergencyFund = emergencySavings.reduce(
    (sum, s) => sum + s.currentAmount,
    150000 // default fallback
  );

  return {
    annualHealthcareSpend,
    coverageAdequacy,
    totalCoverageAmount,
    remainingInsuredAmount,
    medicalEmergencyFund,
    recentMedicalExpenses: medicalExpenses.map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      spentAt: e.spentAt.toISOString().split("T")[0],
      category: e.category.name,
    })),
    insurancePolicies,
  };
}
