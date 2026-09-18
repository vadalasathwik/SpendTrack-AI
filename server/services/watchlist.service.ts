import { prisma } from "../db/prisma.js";

export async function getWatchlist(userId: string) {
  let watchlist = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (watchlist.length === 0) {
    await prisma.watchlistItem.createMany({
      data: [
        {
          userId,
          symbol: "TATASTEEL",
          name: "Tata Steel Ltd",
          assetType: "STOCK",
          targetBuyPrice: 142.0,
          currentPrice: 154.5,
          alertPrice: 145.0,
          convictionScore: 88,
          notes: "Accumulate on dips near 200-DMA",
        },
        {
          userId,
          symbol: "SETFGOLD",
          name: "SBI Gold ETF",
          assetType: "GOLD",
          targetBuyPrice: 66.5,
          currentPrice: 68.2,
          alertPrice: 67.0,
          convictionScore: 92,
          notes: "Monthly SIP target for precious metals bucket",
        },
        {
          userId,
          symbol: "NIFTYBEES",
          name: "Nippon India ETF Nifty 50 BeES",
          assetType: "ETF",
          targetBuyPrice: 265.0,
          currentPrice: 272.4,
          alertPrice: 268.0,
          convictionScore: 95,
          notes: "Core index allocation target",
        },
      ],
    });

    watchlist = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  // Active target alerts
  const triggeredAlerts = watchlist.filter(
    (w) => w.currentPrice <= w.alertPrice
  );

  return {
    watchlist,
    totalWatchlistCount: watchlist.length,
    triggeredAlertsCount: triggeredAlerts.length,
    triggeredAlerts,
  };
}

export async function addToWatchlist(
  userId: string,
  data: {
    symbol: string;
    name: string;
    assetType?: string;
    targetBuyPrice: number;
    currentPrice?: number;
    alertPrice?: number;
    convictionScore?: number;
    notes?: string;
  }
) {
  const item = await prisma.watchlistItem.create({
    data: {
      userId,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      assetType: data.assetType || "STOCK",
      targetBuyPrice: Number(data.targetBuyPrice),
      currentPrice: Number(data.currentPrice || data.targetBuyPrice * 1.05),
      alertPrice: Number(data.alertPrice || data.targetBuyPrice * 1.02),
      convictionScore: Number(data.convictionScore || 85),
      notes: data.notes || "",
    },
  });

  return item;
}
