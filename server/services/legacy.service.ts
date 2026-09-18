import { prisma } from "../db/prisma.js";

export async function getLegacyWorkspace(userId: string) {
  const [
    familyMembers,
    assets,
    liabilities,
    insurancePolicies,
    documents,
    properties,
    emis,
  ] = await Promise.all([
    prisma.familyMember.findMany({ where: { userId } }),
    prisma.assetItem.findMany({ where: { userId } }),
    prisma.liabilityItem.findMany({ where: { userId } }),
    prisma.insurancePolicy.findMany({ where: { userId } }),
    prisma.financialDocument.findMany({ where: { userId } }),
    prisma.propertyAsset.findMany({ where: { userId } }),
    prisma.emiItem.findMany({ where: { userId } }),
  ]);

  // Family Members with assigned node status
  const familyNodes = familyMembers.map((m) => {
    const isOwner = m.role === "OWNER";
    return {
      id: m.id,
      name: m.name,
      relation: m.relation,
      role: m.role,
      avatar: m.avatar || undefined,
      assignedAssetsCount: isOwner ? assets.length + properties.length : 1,
      assignedLiabilitiesCount: isOwner ? liabilities.length + emis.length : 0,
      nomineeStatus:
        m.role === "OWNER"
          ? "COMPLETE"
          : insurancePolicies.length > 0
          ? "COMPLETE"
          : "PARTIAL",
    };
  });

  const totalHouseholdAssets =
    assets.reduce((sum, a) => sum + a.amount, 0) +
    properties.reduce((sum, p) => sum + p.currentMarketValue, 0);

  const totalHouseholdLiabilities =
    liabilities.reduce((sum, l) => sum + l.amount, 0) +
    emis.reduce((sum, e) => sum + (e.outstanding || e.amount * 12), 0);

  const netFamilyWealth = totalHouseholdAssets - totalHouseholdLiabilities;
  const insuranceCoverageTotal = insurancePolicies.reduce(
    (sum, i) => sum + i.coverageAmount,
    0
  );

  // Legacy AI Verification Checklist
  const hasWill = documents.some(
    (d) =>
      d.category === "SALE_DEED" ||
      d.title.toLowerCase().includes("will") ||
      d.title.toLowerCase().includes("deed")
  );
  const hasNominees = familyMembers.length > 1;
  const hasInsuranceBeneficiaries = insurancePolicies.length > 0;
  const hasPropertyDocuments =
    properties.length === 0 ||
    documents.some((d) => d.category === "SALE_DEED" || d.category === "LOAN_PAPERS");
  const hasLoanNominees = emis.length === 0 || familyMembers.length > 1;

  const checklist = [
    {
      id: "chk_will",
      title: "Registered Will Deed",
      category: "WILL" as const,
      status: hasWill ? ("COMPLETED" as const) : ("ACTION_NEEDED" as const),
      critical: true,
    },
    {
      id: "chk_nominees",
      title: "Bank & Demat Account Nominees Added",
      category: "NOMINEE" as const,
      status: hasNominees ? ("COMPLETED" as const) : ("ACTION_NEEDED" as const),
      critical: true,
    },
    {
      id: "chk_insurance",
      title: "Insurance Policy Beneficiaries Assigned",
      category: "INSURANCE" as const,
      status: hasInsuranceBeneficiaries
        ? ("COMPLETED" as const)
        : ("ACTION_NEEDED" as const),
      critical: true,
    },
    {
      id: "chk_property",
      title: "Property Sale Deeds & Tax Receipts Vaulted",
      category: "PROPERTY" as const,
      status: hasPropertyDocuments
        ? ("COMPLETED" as const)
        : ("PENDING" as const),
      critical: false,
    },
    {
      id: "chk_loan",
      title: "Loan Insurance / Nominee Protection Active",
      category: "LOAN" as const,
      status: hasLoanNominees ? ("COMPLETED" as const) : ("PENDING" as const),
      critical: false,
    },
  ];

  const completedCount = checklist.filter(
    (c) => c.status === "COMPLETED"
  ).length;
  const completenessPercentage = Math.round(
    (completedCount / checklist.length) * 100
  );

  return {
    familyMembers: familyNodes,
    totalHouseholdAssets,
    totalHouseholdLiabilities,
    netFamilyWealth,
    insuranceCoverageTotal,
    completenessPercentage,
    checklist,
  };
}
