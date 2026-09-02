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
  name: string;
  category: string;
  subcategory?: string;
  typicalPrice?: number;
  typicalQuantity?: number;
  unit: string;
  usageTrackingEnabled: boolean;
  notes?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dueDay: number; // day of month (1-31) or next due date YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  calendarReminderEnabled?: boolean;
  calendarEventId?: string;
  lastRecordedDate?: string;
  createdAt: string;
  updatedAt: string;
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
  history: Expense[];
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
