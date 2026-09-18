import { prisma } from "../db/prisma.js";

export const getEstatePlanner = async (userId: string) => {
  const [accounts, portfolio, metals, insurance, liabilities, documents, family] = await Promise.all([
    prisma.bankAccount.findMany({ where: { userId } }),
    prisma.portfolioHolding.findMany({ where: { userId } }),
    prisma.preciousMetalHolding.findMany({ where: { userId } }),
    prisma.insurancePolicy.findMany({ where: { userId } }),
    prisma.liabilityItem.findMany({ where: { userId } }),
    prisma.financialDocument.findMany({ where: { userId } }),
    prisma.familyMember.findMany({ where: { userId } }),
  ]);

  const bankValue = accounts.reduce((acc, a) => acc + (a.currentBalance > 0 ? a.currentBalance : 0), 0);
  const portfolioValue = portfolio.reduce((acc, p) => acc + (p.currentValue || p.invested), 0);
  const goldValue = metals.reduce((acc, m) => acc + (m.currentValue || m.totalCost), 0);
  const totalInsuranceCoverage = insurance.reduce((acc, i) => acc + i.coverageAmount, 0);

  const grossAssets = bankValue + portfolioValue + goldValue;
  const totalLiabilities = liabilities.reduce((acc, l) => acc + l.amount, 0);
  const netEstateValue = grossAssets - totalLiabilities;

  const nomineeCompleteness = family.length > 0 && insurance.length > 0 ? 85 : 45;

  const missingLegalChecklist = [
    { title: "Registered Will Deed", status: "PENDING", critical: true },
    { title: "Primary Bank Account Nominee Assignment", status: "COMPLETED", critical: true },
    { title: "Mutual Fund & Demat Nominee Declaration", status: "COMPLETED", critical: false },
    { title: "Power of Attorney (POA) Document", status: "RECOMMENDED", critical: false },
  ];

  return {
    netEstateValue,
    grossAssets,
    totalLiabilities,
    totalInsuranceCoverage,
    nomineeCompleteness,
    assetBreakdown: {
      bankValue,
      portfolioValue,
      goldValue,
    },
    familyMembersCount: family.length,
    missingLegalChecklist,
  };
};
