export interface Expense {
  id: string;
  itemName: string;
  category: string;
  subcategory?: string;
  quantity?: number;
  unit?: string;
  totalPrice: number;
  purchaseDate: string; // YYYY-MM-DD
  usageStartDate?: string; // YYYY-MM-DD
  usageEndDate?: string; // YYYY-MM-DD
  durationDays?: number;
  pricePerUnit?: number;
  dailyCost?: number;
  dailyQuantity?: number;
  notes?: string;
  receiptDriveFileId?: string;
  receiptFileName?: string;
  receiptViewLink?: string;
  calendarEventId?: string;
  source?: 'manual' | 'recurring' | 'receipt' | 'quick';
  recurringId?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CategoryItem {
  name: string;
  subcategories: string[];
  color: string;
  icon?: string;
}

export interface MonthlyItem {
  id: string;
  name: string; // itemName
  category: string;
  subcategory?: string;
  typicalPrice?: number;
  typicalQuantity?: number;
  unit: string;
  purchasedDate?: string; // YYYY-MM-DD
  startUsingDate?: string; // YYYY-MM-DD
  quantityPurchased?: number;
  openingStock?: number;
  remainingQuantity?: number;
  minimumThreshold?: number;
  usageTrackingEnabled: boolean;
  notes?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExpense {
  id: string;
  name: string; // title
  title?: string;
  category: string;
  subcategory?: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dueDay: number; // day of month (1-31)
  dueDate?: string; // YYYY-MM-DD
  autopost?: boolean;
  reminderDays?: number;
  isActive?: boolean;
  lastGeneratedMonth?: string; // YYYY-MM
  notes?: string;
  calendarReminderEnabled?: boolean;
  calendarEventId?: string;
  lastRecordedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsumptionLog {
  id: string;
  itemId: string;
  itemName: string;
  consumedQuantity: number;
  unit: string;
  consumedDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  type: 'bill_upcoming' | 'bill_due' | 'bill_overdue' | 'stock_low';
  title: string;
  message: string;
  state: 'Upcoming' | 'Due Today' | 'Overdue' | 'Low Stock';
  date?: string;
  itemId?: string;
  billId?: string;
  read?: boolean;
}

export interface UserSettings {
  currencySymbol: string;
  dateFormat: string;
  spreadsheetId?: string;
  driveFolderId?: string;
  receiptsFolderId?: string;
  backupsFolderId?: string;
  exportsFolderId?: string;
}

export type DateRangePreset =
  | 'today'
  | 'last7days'
  | 'last30days'
  | 'currentMonth'
  | 'previousMonth'
  | 'last3months'
  | 'last6months'
  | 'currentYear'
  | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string;
}

export interface ItemAnalyticsSummary {
  itemName: string;
  category: string;
  unit: string;
  totalSpent: number;
  totalQuantity: number;
  purchaseCount: number;
  averagePrice: number;
  averagePricePerUnit: number;
  averageDurationDays: number;
  averageDailyCost: number;
  latestPurchaseDate: string;
  latestPrice: number;
  previousPrice?: number;
  priceChange?: number;
  percentagePriceChange?: number;
  // Consumption intelligence metrics
  remainingQuantity?: number;
  minimumThreshold?: number;
  dailyUsage?: number;
  weeklyUsage?: number;
  monthlyAverage?: number;
  daysRemaining?: number;
  estimatedDepletionDate?: string;
  recommendedReorderDate?: string;
  history: Expense[];
  consumptionLogs?: ConsumptionLog[];
}

export interface CategorySpending {
  category: string;
  totalAmount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface DashboardMetrics {
  totalSpending: number;
  expenseCount: number;
  averageDailySpending: number;
  highestCategory: { name: string; amount: number; percentage: number } | null;
  mostExpensiveExpense: Expense | null;
  totalQuantityMap: Record<string, { quantity: number; unit: string }>;
  recentExpenses: Expense[];
  categoryTotals: CategorySpending[];
  spendingTrend: { date: string; label: string; amount: number }[];
}

export interface PeriodComparisonResult {
  currentPeriod: {
    startDate: string;
    endDate: string;
    totalSpending: number;
    expenseCount: number;
    dailyAverage: number;
  };
  previousPeriod: {
    startDate: string;
    endDate: string;
    totalSpending: number;
    expenseCount: number;
    dailyAverage: number;
  };
  difference: number;
  percentageChange: number;
  categoryChanges: {
    category: string;
    currentAmount: number;
    previousAmount: number;
    difference: number;
    percentageChange: number;
  }[];
  itemPriceChanges: {
    itemName: string;
    currentPrice: number;
    previousPrice: number;
    difference: number;
    percentageChange: number;
    unit?: string;
  }[];
}

export interface SyncStatus {
  state: 'idle' | 'saving' | 'saved' | 'error' | 'syncing';
  lastSyncedAt: Date | null;
  errorMessage?: string;
}
