import { Expense, CategorySpending, PeriodComparisonResult, ItemAnalyticsSummary, MonthlyItem, ConsumptionLog, BudgetMetrics, UserSettings, DateRange, RecurringExpense } from '../types.js';
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
export function calculateCategoryTotals(expenses: Expense[] = []): CategorySpending[] {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const totals: Record<string, { amount: number; count: number }> = {};
  let totalAll = 0;

  for (const exp of safeExpenses) {
    if (!exp) continue;
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
  expenses: Expense[] = [],
  startDate?: string,
  endDate?: string
): Expense[] {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  if (!startDate || !endDate) return safeExpenses;

  const startUTC = parseDateToUTC(startDate);
  const endUTC = parseDateToUTC(endDate);

  if (startUTC === undefined || endUTC === undefined) {
    return safeExpenses;
  }

  // Set endUTC to end of that calendar day (23:59:59.999)
  const endOfDayUTC = endUTC + (24 * 60 * 60 * 1000 - 1);

  return safeExpenses.filter((exp) => {
    if (!exp || !exp.purchaseDate) return false;
    const expUTC = parseDateToUTC(exp.purchaseDate);
    if (expUTC === undefined) return false;
    return expUTC >= startUTC && expUTC <= endOfDayUTC;
  });
}

/**
 * Generates item-level analytics summary
 */
export function generateItemAnalytics(expenses: Expense[] = [], targetItemName?: string): ItemAnalyticsSummary[] {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const itemMap: Record<string, Expense[]> = {};

  for (const exp of safeExpenses) {
    if (!exp) continue;
    const name = (exp.itemName || '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!itemMap[key]) {
      itemMap[key] = [];
    }
    itemMap[key].push(exp);
  }

  const summaries: ItemAnalyticsSummary[] = Object.keys(itemMap).map((key) => {
    const list = itemMap[key].sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || '')); // latest first
    const first = list[0] || {} as Expense;
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

    const avgPrice = list.length > 0 ? Number((totalSpent / list.length).toFixed(2)) : 0;
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
      itemName: first.itemName || 'Unknown Item',
      category: first.category || 'Other',
      unit,
      totalSpent: Number(totalSpent.toFixed(2)),
      totalQuantity: Number(totalQty.toFixed(2)),
      purchaseCount: list.length,
      averagePrice: avgPrice,
      averagePricePerUnit: avgPricePerUnit,
      averageDurationDays: avgDuration,
      averageDailyCost: avgDailyCost,
      latestPurchaseDate: first.purchaseDate || '',
      latestPrice,
      previousPrice,
      priceChange,
      percentagePriceChange,
      history: list,
    };
  });

  if (targetItemName) {
    const filterKey = targetItemName.trim().toLowerCase();
    return summaries.filter((s) => (s.itemName || '').toLowerCase() === filterKey);
  }

  return summaries.sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Compares two date ranges
 */
export function comparePeriods(
  expenses: Expense[] = [],
  currentRange: { startDate: string; endDate: string },
  previousRange: { startDate: string; endDate: string }
): PeriodComparisonResult {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const currentExpenses = filterExpensesByDateRange(safeExpenses, currentRange?.startDate, currentRange?.endDate);
  const previousExpenses = filterExpensesByDateRange(safeExpenses, previousRange?.startDate, previousRange?.endDate);

  const currentTotal = currentExpenses.reduce((s, e) => s + (Number(e.totalPrice) || 0), 0);
  const previousTotal = previousExpenses.reduce((s, e) => s + (Number(e.totalPrice) || 0), 0);

  const curStart = currentRange?.startDate ? new Date(currentRange.startDate) : new Date();
  const curEnd = currentRange?.endDate ? new Date(currentRange.endDate) : new Date();
  const curDays = Math.max(1, Math.round((curEnd.getTime() - curStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const prevStart = previousRange?.startDate ? new Date(previousRange.startDate) : new Date();
  const prevEnd = previousRange?.endDate ? new Date(previousRange.endDate) : new Date();
  const prevDays = Math.max(1, Math.round((prevEnd.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const currentDailyAvg = Number((currentTotal / curDays).toFixed(2));
  const previousDailyAvg = Number((previousTotal / prevDays).toFixed(2));

  const diff = Number((currentTotal - previousTotal).toFixed(2));
  const pctChange = calculatePercentageChange(currentTotal, previousTotal);

  // Category changes
  const curCatMap = new Map<string, number>();
  for (const e of currentExpenses) {
    if (!e) continue;
    curCatMap.set(e.category, (curCatMap.get(e.category) || 0) + (Number(e.totalPrice) || 0));
  }
  const prevCatMap = new Map<string, number>();
  for (const e of previousExpenses) {
    if (!e) continue;
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
  const itemSummary = generateItemAnalytics(safeExpenses);
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
      startDate: currentRange?.startDate || '',
      endDate: currentRange?.endDate || '',
      totalSpending: Number(currentTotal.toFixed(2)),
      expenseCount: currentExpenses.length,
      dailyAverage: currentDailyAvg,
    },
    previousPeriod: {
      startDate: previousRange?.startDate || '',
      endDate: previousRange?.endDate || '',
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
export function formatCurrency(amount: number = 0, symbol: string = '₹'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
  }).format(safeAmount);
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
export function generateConsumptionInsights(expenses: Expense[] = []): ConsumptionInsight[] {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const summaries = generateItemAnalytics(safeExpenses);
  const insights: ConsumptionInsight[] = [];

  for (const item of summaries) {
    if (!item || !item.history) continue;
    const history = item.history.filter((h) => h && h.durationDays && h.durationDays > 0);

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
 * Helper to check if a monthly item is a physical inventory/consumable item
 * Excludes recurring bills, utilities, subscriptions, WiFi, Electricity, Rent, Netflix
 */
export function isInventoryItem(item?: MonthlyItem): boolean {
  if (!item || item.usageTrackingEnabled === false) return false;

  const cat = (item.category || '').toLowerCase();
  const nonInventoryCats = ['bills', 'utilities', 'subscription', 'subscriptions', 'rent', 'insurance', 'services'];
  if (nonInventoryCats.includes(cat)) return false;

  const name = (item.name || '').toLowerCase();
  const nonInventoryKeywords = ['wifi', 'electricity', 'rent', 'netflix', 'spotify', 'broadband', 'water bill', 'recharge', 'maintenance', 'mobile bill'];
  if (nonInventoryKeywords.some((kw) => name.includes(kw))) return false;

  return true;
}

/**
 * Calculates item consumption intelligence (daily/weekly/monthly usage, days remaining, estimated depletion date, recommended reorder date) from MonthlyItem and ConsumptionLogs
 */
export function calculateMonthlyItemIntelligence(
  item?: MonthlyItem,
  logs: ConsumptionLog[] = []
): MonthlyItemIntelligence {
  const safeItem: MonthlyItem = item || {
    id: 'unknown',
    name: 'Unknown Item',
    category: 'Other',
    unit: 'unit',
    usageTrackingEnabled: true,
    isEnabled: true,
    createdAt: '',
    updatedAt: '',
  };

  const safeLogs = Array.isArray(logs) ? logs : [];
  const itemNameLower = (safeItem.name || '').trim().toLowerCase();

  const itemLogs = safeLogs.filter(
    (l) => l && (l.itemId === safeItem.id || (l.itemName && l.itemName.trim().toLowerCase() === itemNameLower))
  );

  const remainingQuantity = safeItem.remainingQuantity !== undefined ? safeItem.remainingQuantity : (safeItem.openingStock || 0);
  const openingStock = safeItem.openingStock || 0;
  const minimumThreshold = safeItem.minimumThreshold || 0;

  let dailyUsage = 0;

  if (itemLogs.length > 0) {
    const totalConsumed = itemLogs.reduce((sum, l) => sum + (Number(l.consumedQuantity) || 0), 0);
    const dates = itemLogs.map((l) => parseDateToUTC(l.consumedDate)).filter((d): d is number => d !== undefined);
    if (safeItem.startUsingDate) {
      const startMs = parseDateToUTC(safeItem.startUsingDate);
      if (startMs !== undefined) dates.push(startMs);
    }
    const minDateMs = dates.length > 0 ? Math.min(...dates) : Date.now();
    const maxDateMs = dates.length > 0 ? Math.max(...dates, Date.now()) : Date.now();

    const diffDays = Math.max(1, Math.round((maxDateMs - minDateMs) / (1000 * 60 * 60 * 24)));
    dailyUsage = Number((totalConsumed / diffDays).toFixed(3));
  } else if (safeItem.startUsingDate && remainingQuantity < openingStock) {
    const startMs = parseDateToUTC(safeItem.startUsingDate);
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

  const isInventory = isInventoryItem(safeItem);
  const isLowStock = isInventory && minimumThreshold > 0 && remainingQuantity <= minimumThreshold;

  return {
    itemId: safeItem.id,
    itemName: safeItem.name,
    category: safeItem.category,
    unit: safeItem.unit,
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

/**
 * Calculates budget overview metrics (total budget, spent, remaining, burn rate, safe daily spend, predicted month-end spend, health score)
 */
export function calculateBudgetMetrics(
  expenses: Expense[] = [],
  userSettings?: UserSettings,
  dateRange?: DateRange
): BudgetMetrics {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const totalBudget = Number(userSettings?.monthlyBudget) || 0;
  const startDay = Number(userSettings?.budgetStartDay) || 1;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  let cycleStartDate: Date;
  let cycleEndDate: Date;

  if (currentDate >= startDay) {
    cycleStartDate = new Date(currentYear, currentMonth, startDay);
    cycleEndDate = new Date(currentYear, currentMonth + 1, startDay - 1, 23, 59, 59);
  } else {
    cycleStartDate = new Date(currentYear, currentMonth - 1, startDay);
    cycleEndDate = new Date(currentYear, currentMonth, startDay - 1, 23, 59, 59);
  }

  const cycleStartMs = cycleStartDate.getTime();
  const cycleEndMs = cycleEndDate.getTime();
  const todayMs = today.getTime();

  const cycleExpenses = safeExpenses.filter((exp) => {
    if (!exp || !exp.purchaseDate) return false;
    const expMs = parseDateToUTC(exp.purchaseDate);
    if (expMs === undefined) return false;
    return expMs >= cycleStartMs && expMs <= cycleEndMs;
  });

  const totalSpent = Number(cycleExpenses.reduce((s, e) => s + (Number(e.totalPrice) || 0), 0).toFixed(2));
  const remainingBudget = Number((totalBudget - totalSpent).toFixed(2));

  const progressPercentage = totalBudget > 0
    ? Number(Math.min(100, Math.max(0, (totalSpent / totalBudget) * 100)).toFixed(1))
    : 0;

  let colorState: 'green' | 'orange' | 'red' = 'green';
  if (progressPercentage >= 90) {
    colorState = 'red';
  } else if (progressPercentage >= 70) {
    colorState = 'orange';
  } else {
    colorState = 'green';
  }

  const totalDaysInCycle = Math.max(1, Math.round((cycleEndMs - cycleStartMs) / (1000 * 60 * 60 * 24)) + 1);
  const daysElapsed = Math.max(1, Math.round((todayMs - cycleStartMs) / (1000 * 60 * 60 * 24)) + 1);
  const daysRemaining = Math.max(0, totalDaysInCycle - daysElapsed);

  const dailyBurnRate = Number((totalSpent / daysElapsed).toFixed(2));
  const dailySafeSpend = daysRemaining > 0 && remainingBudget > 0
    ? Number((remainingBudget / daysRemaining).toFixed(2))
    : 0;

  const predictedMonthEndSpend = Number((totalSpent + dailyBurnRate * daysRemaining).toFixed(2));

  let budgetHealthScore = 100;
  if (totalBudget > 0) {
    if (predictedMonthEndSpend <= totalBudget) {
      const marginRatio = (totalBudget - predictedMonthEndSpend) / totalBudget;
      budgetHealthScore = Math.min(100, Math.round(80 + marginRatio * 20));
    } else {
      const overspendRatio = (predictedMonthEndSpend - totalBudget) / totalBudget;
      budgetHealthScore = Math.max(0, Math.round(80 - overspendRatio * 100));
    }
  }

  return {
    totalBudget,
    totalSpent,
    remainingBudget,
    progressPercentage,
    colorState,
    dailySafeSpend,
    dailyBurnRate,
    predictedMonthEndSpend,
    budgetHealthScore,
    daysElapsed,
    daysRemaining,
  };
}

/**
 * Priority order matching for recurring bills:
 * 1. Google Sheets Row ID / persistent ID (exact match)
 * 2. Exact match of Name + Category + Due Day + Amount
 * 3. Match of Name + Category + Amount
 * 4. Match of Name + Category
 * 5. Match of Name
 */
export function findMatchingRecurringBill(
  target: RecurringExpense,
  candidates: RecurringExpense[]
): RecurringExpense | undefined {
  if (!candidates || candidates.length === 0) return undefined;

  const targetName = (target.name || target.title || '').trim().toLowerCase();

  // 1 & 2. Persistent ID match
  if (target.id) {
    const idMatch = candidates.find((c) => c.id === target.id);
    if (idMatch) return idMatch;
  }

  // 3. Match of Name + Category + Due Day + Amount
  const exact4Way = candidates.find((c) => {
    const cName = (c.name || c.title || '').trim().toLowerCase();
    const sameName = cName === targetName;
    const sameCategory = (c.category || '').toLowerCase() === (target.category || '').toLowerCase();
    const sameDueDay = Number(c.dueDay) === Number(target.dueDay);
    const sameAmount = Math.abs(Number(c.amount) - Number(target.amount)) < 0.01;
    return sameName && sameCategory && sameDueDay && sameAmount;
  });
  if (exact4Way) return exact4Way;

  // 4. Match of Name + Category + Amount
  const nameCatAmount = candidates.find((c) => {
    const cName = (c.name || c.title || '').trim().toLowerCase();
    const sameName = cName === targetName;
    const sameCategory = (c.category || '').toLowerCase() === (target.category || '').toLowerCase();
    const sameAmount = Math.abs(Number(c.amount) - Number(target.amount)) < 0.01;
    return sameName && sameCategory && sameAmount;
  });
  if (nameCatAmount) return nameCatAmount;

  // 5. Match of Name + Category
  const nameCat = candidates.find((c) => {
    const cName = (c.name || c.title || '').trim().toLowerCase();
    const sameName = cName === targetName;
    const sameCategory = (c.category || '').toLowerCase() === (target.category || '').toLowerCase();
    return sameName && sameCategory;
  });
  if (nameCat) return nameCat;

  // 6. Match of Name
  return candidates.find((c) => {
    const cName = (c.name || c.title || '').trim().toLowerCase();
    return cName && cName === targetName;
  });
}

/**
 * Sanitizes technical error messages to prevent exposing internal IDs or technical stack traces.
 */
export function sanitizeErrorMessage(msg?: string | null): string {
  if (!msg) return "Couldn't sync changes. Tap Retry.";
  const lower = msg.toLowerCase();
  if (
    lower.includes('rec_') ||
    lower.includes('not found') ||
    lower.includes('id ') ||
    lower.includes('failed to fetch') ||
    lower.includes('unable') ||
    lower.includes('error')
  ) {
    return "Couldn't sync changes. Tap Retry.";
  }
  return msg;
}
export interface DynamicHealthScoreResult {
  score: number;
  rating: 'Poor' | 'Good' | 'Excellent';
  trend: number;
}

export function calculateDynamicHealthScore(params: {
  savingRate: number;
  totalIncome: number;
  totalExpenses: number;
  totalEmis: number;
  monthlyBudget: number;
  savingsTotal?: number;
  portfolioValue?: number;
  hasInvestments?: boolean;
}): DynamicHealthScoreResult {
  const {
    savingRate = 0,
    totalIncome = 0,
    totalExpenses = 0,
    totalEmis = 0,
    monthlyBudget = 0,
    savingsTotal = 0,
    portfolioValue = 0,
    hasInvestments = false,
  } = params;

  if (totalIncome <= 0 && totalExpenses <= 0) {
    return { score: 100, rating: 'Excellent', trend: 0 };
  }

  // 1. Savings rate weight (20 points max)
  const savingsScore = Math.min(20, Math.max(0, Math.round((savingRate / 25) * 20)));

  // 2. EMI Ratio weight (20 points max)
  const emiRatio = totalIncome > 0 ? totalEmis / totalIncome : 0;
  let emiScore = 20;
  if (emiRatio > 0.4) {
    emiScore = Math.max(0, Math.round((1 - emiRatio) * 20));
  } else if (emiRatio > 0.3) {
    emiScore = 15;
  }

  // 3. Budget discipline weight (20 points max)
  let budgetScore = 20;
  if (monthlyBudget > 0) {
    if (totalExpenses > monthlyBudget) {
      const overspendRatio = (totalExpenses - monthlyBudget) / monthlyBudget;
      budgetScore = Math.max(0, Math.round(20 - overspendRatio * 20));
    }
  }

  // 4. Emergency Fund weight (15 points max)
  const monthlyNeed = (totalExpenses || monthlyBudget || 30000);
  const emergencyCoverageMonths = monthlyNeed > 0 ? savingsTotal / monthlyNeed : 0;
  const emergencyScore = Math.min(15, Math.max(0, Math.round((emergencyCoverageMonths / 3) * 15)));

  // 5. Net worth / Portfolio Growth weight (15 points max)
  const wealthScore = portfolioValue > 0 || savingsTotal > 0 ? 15 : 8;

  // 6. Investment consistency weight (10 points max)
  const investmentScore = hasInvestments || portfolioValue > 0 ? 10 : 5;

  const totalScore = Math.min(100, Math.max(0, savingsScore + emiScore + budgetScore + emergencyScore + wealthScore + investmentScore));

  let rating: 'Poor' | 'Good' | 'Excellent' = 'Excellent';
  if (totalScore < 60) rating = 'Poor';
  else if (totalScore < 80) rating = 'Good';

  const trend = totalScore >= 80 ? 3 : totalScore >= 60 ? 1 : -2;

  return {
    score: totalScore,
    rating,
    trend,
  };
}




