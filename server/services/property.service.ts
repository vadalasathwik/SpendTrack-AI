import { prisma } from "../db/prisma.js";

export async function getPropertyIntelligence(userId: string) {
  let properties = await prisma.propertyAsset.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Seed initial sample data if none exists so user always has live context
  if (properties.length === 0) {
    await prisma.propertyAsset.createMany({
      data: [
        {
          userId,
          title: "Prime Residency Apartment 3BHK",
          propertyType: "APARTMENT",
          purchaseValue: 8500000,
          currentMarketValue: 11500000,
          loanLinked: 4200000,
          rentalIncome: 32000,
          appreciationRate: 7.2,
          documentsLinked: 3,
          notes: "Occupied by tenant since 2023",
        },
        {
          userId,
          title: "Greenfield Villa Plot (Plot #42)",
          propertyType: "LAND",
          purchaseValue: 3500000,
          currentMarketValue: 5200000,
          loanLinked: 0,
          rentalIncome: 0,
          appreciationRate: 9.5,
          documentsLinked: 2,
          notes: "Clear title, DTCP approved",
        },
      ],
    });

    properties = await prisma.propertyAsset.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  const totalPropertyWealth = properties.reduce(
    (sum, p) => sum + p.currentMarketValue,
    0
  );
  const totalLoansLinked = properties.reduce(
    (sum, p) => sum + p.loanLinked,
    0
  );
  const totalEquityOwned = totalPropertyWealth - totalLoansLinked;
  const totalMonthlyRental = properties.reduce(
    (sum, p) => sum + p.rentalIncome,
    0
  );
  const totalPurchaseValue = properties.reduce(
    (sum, p) => sum + p.purchaseValue,
    0
  );

  const averageAppreciationRate =
    properties.length > 0
      ? Number(
          (
            properties.reduce((sum, p) => sum + p.appreciationRate, 0) /
            properties.length
          ).toFixed(1)
        )
      : 0;

  const overallRentalYield =
    totalPropertyWealth > 0
      ? Number(
          (((totalMonthlyRental * 12) / totalPropertyWealth) * 100).toFixed(2)
        )
      : 0;

  const overallRoi =
    totalPurchaseValue > 0
      ? Number(
          (
            ((totalPropertyWealth - totalPurchaseValue + totalMonthlyRental * 12) /
              totalPurchaseValue) *
            100
          ).toFixed(1)
        )
      : 0;

  return {
    properties,
    totalPropertyWealth,
    totalEquityOwned,
    totalLoansLinked,
    totalMonthlyRental,
    averageAppreciationRate,
    overallRentalYield,
    overallRoi,
  };
}

export async function createPropertyAsset(
  userId: string,
  data: {
    title: string;
    propertyType: string;
    purchaseValue: number;
    currentMarketValue: number;
    loanLinked?: number;
    rentalIncome?: number;
    appreciationRate?: number;
    documentsLinked?: number;
    notes?: string;
  }
) {
  const property = await prisma.propertyAsset.create({
    data: {
      userId,
      title: data.title,
      propertyType: data.propertyType || "RESIDENTIAL",
      purchaseValue: Number(data.purchaseValue),
      currentMarketValue: Number(data.currentMarketValue),
      loanLinked: Number(data.loanLinked || 0),
      rentalIncome: Number(data.rentalIncome || 0),
      appreciationRate: Number(data.appreciationRate || 6.5),
      documentsLinked: Number(data.documentsLinked || 0),
      notes: data.notes || "",
    },
  });

  // Automatically update general AssetItem for Net Worth sync
  await prisma.assetItem.create({
    data: {
      userId,
      name: data.title,
      category: data.propertyType === "LAND" ? "Land" : "House",
      amount: Number(data.currentMarketValue),
    },
  });

  return property;
}
