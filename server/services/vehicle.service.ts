import { prisma } from "../db/prisma.js";

export async function getVehicleManager(userId: string) {
  let vehicles = await prisma.vehicleAsset.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Seed default vehicle data if none exists
  if (vehicles.length === 0) {
    await prisma.vehicleAsset.createMany({
      data: [
        {
          userId,
          name: "Hyundai Creta SX (O) Turbo",
          vehicleType: "CAR",
          purchasePrice: 1850000,
          insurance: 38000,
          serviceHistoryCost: 14000,
          fuelCost: 7500,
          emi: 22500,
          resaleValue: 1320000,
          purchaseYear: 2022,
          notes: "Comprehensive insurance active",
        },
        {
          userId,
          name: "Royal Enfield Hunter 350",
          vehicleType: "BIKE",
          purchasePrice: 210000,
          insurance: 6500,
          serviceHistoryCost: 4500,
          fuelCost: 2800,
          emi: 0,
          resaleValue: 165000,
          purchaseYear: 2023,
          notes: "3rd free service completed",
        },
      ],
    });

    vehicles = await prisma.vehicleAsset.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  const currentYear = new Date().getFullYear();

  const totalPurchaseValue = vehicles.reduce(
    (sum, v) => sum + v.purchasePrice,
    0
  );
  const totalResaleValue = vehicles.reduce(
    (sum, v) => sum + v.resaleValue,
    0
  );
  const totalDepreciation = totalPurchaseValue - totalResaleValue;

  const totalAnnualOwnershipCost = vehicles.reduce((sum, v) => {
    const annualFuel = v.fuelCost * 12;
    const annualEmi = v.emi * 12;
    return sum + annualFuel + annualEmi + v.insurance + v.serviceHistoryCost;
  }, 0);

  // Best resale year: weighted recommendation (typically 4-5 years post purchase)
  const averagePurchaseYear =
    vehicles.length > 0
      ? Math.round(
          vehicles.reduce((sum, v) => sum + v.purchaseYear, 0) / vehicles.length
        )
      : currentYear - 2;

  const bestResaleYear = averagePurchaseYear + 5;

  return {
    vehicles,
    totalPurchaseValue,
    totalResaleValue,
    totalDepreciation,
    totalAnnualOwnershipCost,
    bestResaleYear,
  };
}

export async function createVehicleAsset(
  userId: string,
  data: {
    name: string;
    vehicleType: string;
    purchasePrice: number;
    insurance?: number;
    serviceHistoryCost?: number;
    fuelCost?: number;
    emi?: number;
    resaleValue?: number;
    purchaseYear?: number;
    notes?: string;
  }
) {
  const vehicle = await prisma.vehicleAsset.create({
    data: {
      userId,
      name: data.name,
      vehicleType: data.vehicleType || "CAR",
      purchasePrice: Number(data.purchasePrice),
      insurance: Number(data.insurance || 0),
      serviceHistoryCost: Number(data.serviceHistoryCost || 0),
      fuelCost: Number(data.fuelCost || 0),
      emi: Number(data.emi || 0),
      resaleValue: Number(data.resaleValue || data.purchasePrice * 0.75),
      purchaseYear: Number(data.purchaseYear || new Date().getFullYear()),
      notes: data.notes || "",
    },
  });

  return vehicle;
}
