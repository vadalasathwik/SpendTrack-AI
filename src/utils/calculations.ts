import { Expense, CategorySpending, PeriodComparisonResult, ItemAnalyticsSummary, MonthlyItem, ConsumptionLog } from '../types.js';
import { CATEGORY_COLORS } from '../data/defaults.js';

/**
 * Parses any date format (YYYY-MM-DD, MM/DD/YYYY, YYYY/MM/DD, ISO string) to UTC midnight milliseconds
 */
export function parseDateToUTC(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const cleanDateStr = dateStr.trim().split('T')[0];
  
  // YYYY-MM-DD format
  const dashParts = cleanDateStr.split('-');
  if (dashParts.length === 3) {
    const year = parseInt(dashParts[0], 10);
    const month = parseInt(dashParts[1], 10) - 1;
    const day = parseInt(dashParts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return Date.UTC(year, month, day);
    }
  }

  // Slash separator YYYY/MM/DD or MM/DD/YYYY
  const slashParts = cleanDateStr.split('/');
  if (slashParts.length === 3) {
    if (slashParts[0].length === 4) {
      // YYYY/MM/DD
      const year = parseInt(slashParts[0], 10);
      const month = parseInt(slashParts[1], 10) - 1;
      const day = parseInt(slashParts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return Date.UTC(year, month, day);
      }
    } else {
      // MM/DD/YYYY or D/M/YYYY
      const month = parseInt(slashParts[0], 10) - 1;
      const day = parseInt(slashParts[1], 10);
      const year = parseInt(slashParts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return Date.UTC(year, month, day);
      }
    }
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d.getTime();
}

/**
 * Calculates duration in days between two date strings
 */
export function calculateDuration(startDate?: string, endDate?: string): number | undefined {
  if (!startDate || !endDate) return undefined;
  const startUTC = parseDateToUTC(startDate);
  const endUTC = parseDateToUTC(endDate);
  if (startUTC === undefined || endUTC === undefined) return undefined;
  
  const diffTime = endUTC - startUTC;
  if (diffTime < 0) return undefined;
  
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 1;
}

/**
 * Checks if an expense or usage date range represents an active "currently in use" consumption period
 */
export function getCurrentlyInUseStatus(
  arg1?: Expense | string,
  arg2?: string,
  arg3?: number
): {
  isCurrentlyInUse: boolean;
  isInUse: boolean;
  daysSoFar: number;
  dailyCostSoFar?: number;
} {
  let startDate: string | undefined;
  let endDate: string | undefined;
  let totalPrice: number | undefined;

  if (typeof arg1 === 'object' && arg1 !== null) {
    startDate = arg1.usageStartDate || arg1.purchaseDate;
    endDate = arg1.usageEndDate;
    totalPrice = arg1.totalPrice;
  } else if (typeof arg1 === 'string') {
    startDate = arg1;
    endDate = arg2;
    totalPrice = arg3;
  } else {
    startDate = undefined;
    endDate = arg2;
    totalPrice = arg3;
  }

  const currentDate = new Date().toISOString().split('T')[0];

  if (!startDate) {
    return { isCurrentlyInUse: false, isInUse: false, daysSoFar: 0 };
  }

  // If endDate is not specified or empty, it is actively in use
  const isOngoing = !endDate || endDate.trim() === '';
  if (!isOngoing) {
    return { isCurrentlyInUse: false, isInUse: false, daysSoFar: 0 };
  }

  const startUTC = parseDateToUTC(startDate);
  const curUTC = parseDateToUTC(currentDate);
  if (startUTC === undefined || curUTC === undefined) {
    return { isCurrentlyInUse: false, isInUse: false, daysSoFar: 0 };
  }

  const diffTime = curUTC - startUTC;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const daysSoFar = diffDays > 0 ? diffDays : 1;
  const dailyCostSoFar = totalPrice && daysSoFar > 0
    ? Number((totalPrice / daysSoFar).toFixed(2))
    : undefined;

  return {
    isCurrentlyInUse: true,
    isInUse: true,
    daysSoFar,
    dailyCostSoFar,
  };
}

/**
 * Format unit-appropriate consumption velocity
 * e.g., for rice: "0.357 kg/day", for cylinder or month: returns undefined so misleading fractions are avoided
 */
export function formatConsumptionVelocity(
  quantity?: number,
  unit?: string,
  durationDays?: number
): string | undefined {
  if (!quantity || !durationDays || durationDays <= 0 || !unit) return undefined;
  
  const lowerUnit = unit.toLowerCase();
  // Only show quantity/day for physical mass/volume/countable goods
  const physicalUnits = ['kg', 'g', 'gram', 'grams', 'litre', 'liter', 'litres', 'liters', 'ml', 'packet', 'packets', 'piece', 'pieces', 'bottle', 'bottles'];
  if (!physicalUnits.includes(lowerUnit)) {
    return undefined;
  }

  const dailyQty = quantity / durationDays;
  if (lowerUnit === 'kg' && dailyQty < 1) {
    return `${dailyQty.toFixed(3)} kg/day`;
  }
  if (lowerUnit.startsWith('l') && dailyQty < 1) {
    return `${dailyQty.toFixed(3)} L/day`;
  }
  return `${dailyQty.toFixed(2)} ${unit}/day`;
}

/**
 * Calculates price per measurement unit safely
 */
export function calculatePricePerUnit(totalPrice: number, quantity?: number): number | undefined {
  if (!quantity || quantity <= 0 || !totalPrice || isNaN(totalPrice) || isNaN(quantity)) {
    return undefined;
  }
  return Number((totalPrice / quantity).toFixed(2));
}

/**
 * Calculates daily cost of an item based on totalPrice and durationDays
 */
export function calculateDailyCost(totalPrice: number, durationDays?: number): number | undefined {
  if (!durationDays || durationDays <= 0 || !totalPrice || isNaN(totalPrice) || isNaN(durationDays)) {
    return undefined;
  }
  return Number((totalPrice / durationDays).toFixed(2));
}

/**
 * Calculates daily quantity consumed
 */
export function calculateDailyQuantity(quantity?: number, durationDays?: number): number | undefined {
  if (!quantity || quantity <= 0 || !durationDays || durationDays <= 0) {
    return undefined;
  }
  return Number((quantity / durationDays).toFixed(3));
}

/**
 * Calculates weekly quantity consumed
 */
export function calculateWeeklyQuantity(dailyQuantity?: number): number | undefined {
  if (dailyQuantity === undefined || dailyQuantity <= 0) return undefined;
  return Number((dailyQuantity * 7).toFixed(3));
}

/**
 * Calculates monthly estimate based on daily cost
 */
export function calculateMonthlyEstimate(dailyCost?: number): number | undefined {
  if (dailyCost === undefined || dailyCost <= 0) return undefined;
  return Number((dailyCost * 30.417).toFixed(2)); // average days per month
}

/**
 * Calculates percentage change between current and previous values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

/**
 * Groups expenses by category and calculates totals and percentages
 */
export function calculateCategoryTotals(expenses: Expense[]): CategorySpending[] {
  const totals: Record<string, { amount: number; count: number }> = {};
  let totalAll = 0;

  for (const exp of expenses) {
    const cat = exp.category || 'Other';
    if (!totals[cat]) {
      totals[cat] = { amount: 0, count: 0 };
    }
    const price = Number(exp.totalPrice) || 0;
    totals[cat].amount += price;
    totals[cat].count += 1;
    totalAll += price;
  }

  const result: CategorySpending[] = Object.entries(totals).map(([category, data]) => {
    const percentage = totalAll > 0 ? Number(((data.amount / totalAll) * 100).toFixed(1)) : 0;
    return {
      category,
      totalAmount: Number(data.amount.toFixed(2)),
      count: data.count,
      percentage,
      color: CATEGORY_COLORS[category] || '#94A3B8',
    };
  });

  // Sort descending by amount
  return result.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Filters expenses by date range (inclusive)
 */
export function filterExpensesByDateRange(
  expenses: Expense[],
  startDate: string,
  endDate: string
): Expense[] {
  const startUTC = parseDateToUTC(startDate);
  const endUTC = parseDateToUTC(endDate);

  if (startUTC === undefined || endUTC === undefined) {
    return expenses;
  }

  // Set endUTC to end of that calendar day (23:59:59.999)
  const endOfDayUTC = endUTC + (24 * 60 * 60 * 1000 - 1);

  return expenses.filter((exp) => {
    if (!exp.purchaseDate) return false;
    const expUTC = parseDateToUTC(exp.purchaseDate);
    if (expUTC === undefined) return false;
    return expUTC >= startUTC && expUTC <= endOfDayUTC;
  });
}

/**
 * Generates item-level analytics summary
 */
export function generateItemAnalytics(expenses: Expense[], targetItemName?: string): ItemAnalyticsSummary[] {
  const itemMap: Record<string, Expense[]> = {};

  for (const exp of expenses) {
    const name = (exp.itemName || '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!itemMap[key]) {
      itemMap[key] = [];
    }
    itemMap[key].push(exp);
  }

  const summaries: ItemAnalyticsSummary[] = Object.keys(itemMap).map((key) => {
    const list = itemMap[key].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)); // latest first
    const first = list[0];
    const totalSpent = list.reduce((sum, e) => sum + (Number(e.totalPrice) || 0), 0);
    
    let totalQty = 0;
    let qtyCount = 0;
    let unit = first.unit || 'unit';
    let totalDuration = 0;
    let durationCount = 0;
    let totalDailyCost = 0;
    let dailyCostCount = 0;

    for (const e of list) {
      if (e.quantity && e.quantity > 0) {
        totalQty += Number(e.quantity);
        qtyCount++;
        if (e.unit) unit = e.unit;
      }
      if (e.durationDays && e.durationDays > 0) {
        totalDuration += e.durationDays;
        durationCount++;
      }
      if (e.dailyCost && e.dailyCost > 0) {
        totalDailyCost += e.dailyCost;
        dailyCostCount++;
      }
    }

    const avgPrice = Number((totalSpent / list.length).toFixed(2));
    const avgPricePerUnit = qtyCount > 0 && totalQty > 0 ? Number((totalSpent / totalQty).toFixed(2)) : 0;
    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
    const avgDailyCost = dailyCostCount > 0 ? Number((totalDailyCost / dailyCostCount).toFixed(2)) : 0;

    const latestPrice = Number(first.totalPrice) || 0;
    let previousPrice: number | undefined;
    let priceChange: number | undefined;
    let percentagePriceChange: number | undefined;

    if (list.length > 1) {
      previousPrice = Number(list[1].totalPrice) || 0;
      priceChange = Number((latestPrice - previousPrice).toFixed(2));
      percentagePriceChange = calculatePercentageChange(latestPrice, previousPrice);
    }

    return {
      itemName: first.itemName,
      category: first.category,
      unit,
      totalSpent: Number(totalSpent.toFixed(2)),
      totalQuantity: Number(totalQty.toFixed(2)),
      purchaseCount: list.length,
      averagePrice: avgPrice,
      averagePricePerUnit: avgPricePerUnit,
      averageDurationDays: avgDuration,
      averageDailyCost: avgDailyCost,
      latestPurchaseDate: first.purchaseDate,
      latestPrice,
      previousPrice,
      priceChange,
      percentagePriceChange,
      history: list,
    };
  });

  if (targetItemName) {
    const filterKey = targetItemName.trim().toLowerCase();
    return summaries.filter((s) => s.itemName.toLowerCase() === filterKey);
  }

  return summaries.sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Compares two date ranges
 */
export function comparePeriods(
  expenses: Expense[],
  currentRange: { startDate: string; endDate: string },
  previousRange: { startDate: string; endDate: string }
): PeriodComparisonResult {
  const currentExpenses = filterExpensesByDateRange(expenses, currentRange.startDate, currentRange.endDate);
  const previousExpenses = filterExpensesByDateRange(expenses, previousRange.startDate, previousRange.endDate);

  const currentTotal = currentExpenses.reduce((s, e) => s + (Number(e.totalPrice) || 0), 0);
  const previousTotal = previousExpenses.reduce((s, e) => s + (Number(e.totalPrice) || 0), 0);

  const curStart = new Date(currentRange.startDate);
  const curEnd = new Date(currentRange.endDate);
  const curDays = Math.max(1, Math.round((curEnd.getTime() - curStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const prevStart = new Date(previousRange.startDate);
  const prevEnd = new Date(previousRange.endDate);
  const prevDays = Math.max(1, Math.round((prevEnd.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const currentDailyAvg = Number((currentTotal / curDays).toFixed(2));
  const previousDailyAvg = Number((previousTotal / prevDays).toFixed(2));

  const diff = Number((currentTotal - previousTotal).toFixed(2));
  const pctChange = calculatePercentageChange(currentTotal, previousTotal);

  // Category changes
  const curCatMap = new Map<string, number>();
  for (const e of currentExpenses) {
    curCatMap.set(e.category, (curCatMap.get(e.category) || 0) + (Number(e.totalPrice) || 0));
  }
  const prevCatMap = new Map<string, number>();
  for (const e of previousExpenses) {
    prevCatMap.set(e.category, (prevCatMap.get(e.category) || 0) + (Number(e.totalPrice) || 0));
  }

  const allCategories = Array.from(new Set([...curCatMap.keys(), ...prevCatMap.keys()]));
  const categoryChanges = allCategories.map((cat) => {
    const curAmt = Number((curCatMap.get(cat) || 0).toFixed(2));
    const prevAmt = Number((prevCatMap.get(cat) || 0).toFixed(2));
    return {
      category: cat,
      currentAmount: curAmt,
      previousAmount: prevAmt,
      difference: Number((curAmt - prevAmt).toFixed(2)),
      percentageChange: calculatePercentageChange(curAmt, prevAmt),
    };
  }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  // Item price changes (items purchased in both or current)
  const itemSummary = generateItemAnalytics(expenses);
  const itemPriceChanges = itemSummary
    .filter((it) => it.previousPrice !== undefined)
    .map((it) => ({
      itemName: it.itemName,
      currentPrice: it.latestPrice,
      previousPrice: it.previousPrice || 0,
      difference: it.priceChange || 0,
      percentageChange: it.percentagePriceChange || 0,
      unit: it.unit,
    }));

  return {
    currentPeriod: {
      startDate: currentRange.startDate,
      endDate: currentRange.endDate,
      totalSpending: Number(currentTotal.toFixed(2)),
      expenseCount: currentExpenses.length,
      dailyAverage: currentDailyAvg,
    },
    previousPeriod: {
      startDate: previousRange.startDate,
      endDate: previousRange.endDate,
      totalSpending: Number(previousTotal.toFixed(2)),
      expenseCount: previousExpenses.length,
      dailyAverage: previousDailyAvg,
    },
    difference: diff,
    percentageChange: pctChange,
    categoryChanges,
    itemPriceChanges,
  };
}

/**
 * Format currency with symbol
 */
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
  return `${symbol}${formatted}`;
}

export interface ConsumptionInsight {
  id: string;
  itemName: string;
  type: 'duration' | 'cost_trend' | 'consumption_rate' | 'price_alert';
  title: string;
  description: string;
  metric?: string;
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * Derives verified, deterministic item-level consumption and inflation insights.
 * Never invents numbers; only emits insights when sufficient purchase history exists.
 */
export function generateConsumptionInsights(expenses: Expense[]): ConsumptionInsight[] {
  const summaries = generateItemAnalytics(expenses);
  const insights: ConsumptionInsight[] = [];

  for (const item of summaries) {
    const history = item.history.filter((h) => h.durationDays && h.durationDays > 0);

    // 1. Average duration insight (e.g. Cooking Gas lasts X days)
    if (item.averageDurationDays > 0 && history.length >= 1) {
      insights.push({
        id: `ins-dur-${item.itemName}`,
        itemName: item.itemName,
        type: 'duration',
        title: `${item.itemName} Lifespan`,
        description: `Your ${item.itemName.toLowerCase()} lasts an average of ${item.averageDurationDays} days per ${item.unit || 'unit'}.`,
        metric: `${item.averageDurationDays} days`,
        trend: 'neutral',
      });
    }

    // 2. Comparison between latest and previous duration
    if (history.length >= 2) {
      const latestDur = history[0].durationDays || 0;
      const prevDur = history[1].durationDays || 0;
      const durDiff = latestDur - prevDur;

      if (durDiff !== 0) {
        insights.push({
          id: `ins-dur-change-${item.itemName}`,
          itemName: item.itemName,
          type: 'duration',
          title: `${item.itemName} Usage Change`,
          description: `Your latest ${item.itemName.toLowerCase()} lasted ${Math.abs(durDiff)} day${Math.abs(durDiff) > 1 ? 's' : ''} ${
            durDiff > 0 ? 'longer' : 'shorter'
          } than the previous one (${latestDur} vs ${prevDur} days).`,
          metric: `${durDiff > 0 ? '+' : ''}${durDiff} days`,
          trend: durDiff > 0 ? 'up' : 'down',
        });
      }

      // Cost per day comparison
      const latestDaily = history[0].dailyCost;
      const prevDaily = history[1].dailyCost;
      if (latestDaily && prevDaily && latestDaily !== prevDaily) {
        const costDiff = Number((latestDaily - prevDaily).toFixed(2));
        insights.push({
          id: `ins-cost-change-${item.itemName}`,
          itemName: item.itemName,
          type: 'cost_trend',
          title: `${item.itemName} Daily Cost Shift`,
          description: `${item.itemName} now costs ₹${latestDaily}/day compared with ₹${prevDaily}/day previously (${
            costDiff > 0 ? `+₹${costDiff}` : `-₹${Math.abs(costDiff)}`
          }/day).`,
          metric: `₹${latestDaily}/day`,
          trend: costDiff > 0 ? 'up' : 'down',
        });
      }
    }

    // 3. Physical consumption velocity (e.g. 0.357 kg/day)
    const velocity = formatConsumptionVelocity(item.totalQuantity, item.unit, item.averageDurationDays * item.purchaseCount);
    if (velocity) {
      insights.push({
        id: `ins-rate-${item.itemName}`,
        itemName: item.itemName,
        type: 'consumption_rate',
        title: `${item.itemName} Consumption Velocity`,
        description: `${item.itemName} consumption averages ${velocity}.`,
        metric: velocity,
        trend: 'neutral',
      });
    }

    // 4. Price change alert
    if (item.previousPrice !== undefined && item.priceChange !== undefined && item.priceChange !== 0) {
      const isUp = item.priceChange > 0;
      insights.push({
        id: `ins-price-${item.itemName}`,
        itemName: item.itemName,
        type: 'price_alert',
        title: `${item.itemName} Price ${isUp ? 'Increase' : 'Decrease'}`,
        description: `Price changed from ₹${item.previousPrice} to ₹${item.latestPrice} (${
          isUp ? `+₹${item.priceChange}` : `-₹${Math.abs(item.priceChange)}`
        }, ${item.percentagePriceChange && item.percentagePriceChange > 0 ? '+' : ''}${item.percentagePriceChange}%).`,
        metric: `₹${item.latestPrice}`,
        trend: isUp ? 'up' : 'down',
      });
    }
  }

  return insights;
}

export interface MonthlyItemIntelligence {
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  remainingQuantity: number;
  openingStock: number;
  minimumThreshold: number;
  dailyUsage: number;
  weeklyUsage: number;
  monthlyAverage: number;
  daysRemaining: number | null;
  estimatedDepletionDate: string | null;
  recommendedReorderDate: string | null;
  isLowStock: boolean;
}

/**
 * Calculates item consumption intelligence (daily/weekly/monthly usage, days remaining, estimated depletion date, recommended reorder date) from MonthlyItem and ConsumptionLogs
 */
export function calculateMonthlyItemIntelligence(
  item: MonthlyItem,
  logs: ConsumptionLog[]
): MonthlyItemIntelligence {
  const itemLogs = logs.filter(
    (l) => l.itemId === item.id || (l.itemName && l.itemName.trim().toLowerCase() === item.name.trim().toLowerCase())
  );

  const remainingQuantity = item.remainingQuantity !== undefined ? item.remainingQuantity : (item.openingStock || 0);
  const openingStock = item.openingStock || 0;
  const minimumThreshold = item.minimumThreshold || 0;

  let dailyUsage = 0;

  if (itemLogs.length > 0) {
    const totalConsumed = itemLogs.reduce((sum, l) => sum + (Number(l.consumedQuantity) || 0), 0);
    const dates = itemLogs.map((l) => parseDateToUTC(l.consumedDate)).filter((d): d is number => d !== undefined);
    if (item.startUsingDate) {
      const startMs = parseDateToUTC(item.startUsingDate);
      if (startMs !== undefined) dates.push(startMs);
    }
    const minDateMs = Math.min(...dates);
    const maxDateMs = Math.max(...dates, Date.now());

    const diffDays = Math.max(1, Math.round((maxDateMs - minDateMs) / (1000 * 60 * 60 * 24)));
    dailyUsage = Number((totalConsumed / diffDays).toFixed(3));
  } else if (item.startUsingDate && remainingQuantity < openingStock) {
    const startMs = parseDateToUTC(item.startUsingDate);
    if (startMs) {
      const consumedSoFar = openingStock - remainingQuantity;
      const diffDays = Math.max(1, Math.round((Date.now() - startMs) / (1000 * 60 * 60 * 24)));
      dailyUsage = Number((consumedSoFar / diffDays).toFixed(3));
    }
  }

  const weeklyUsage = Number((dailyUsage * 7).toFixed(3));
  const monthlyAverage = Number((dailyUsage * 30.417).toFixed(2));

  let daysRemaining: number | null = null;
  let estimatedDepletionDate: string | null = null;
  let recommendedReorderDate: string | null = null;

  if (dailyUsage > 0 && remainingQuantity > 0) {
    daysRemaining = Math.floor(remainingQuantity / dailyUsage);
    const depletionMs = Date.now() + daysRemaining * 24 * 60 * 60 * 1000;
    estimatedDepletionDate = new Date(depletionMs).toISOString().split('T')[0];

    if (minimumThreshold > 0 && remainingQuantity > minimumThreshold) {
      const daysUntilThreshold = Math.max(0, Math.floor((remainingQuantity - minimumThreshold) / dailyUsage));
      const reorderMs = Date.now() + daysUntilThreshold * 24 * 60 * 60 * 1000;
      recommendedReorderDate = new Date(reorderMs).toISOString().split('T')[0];
    } else if (remainingQuantity <= minimumThreshold) {
      recommendedReorderDate = new Date().toISOString().split('T')[0];
    }
  }

  const isLowStock = remainingQuantity <= minimumThreshold || (daysRemaining !== null && daysRemaining <= 5);

  return {
    itemId: item.id,
    itemName: item.name,
    category: item.category,
    unit: item.unit,
    remainingQuantity,
    openingStock,
    minimumThreshold,
    dailyUsage,
    weeklyUsage,
    monthlyAverage,
    daysRemaining,
    estimatedDepletionDate,
    recommendedReorderDate,
    isLowStock,
  };
}

