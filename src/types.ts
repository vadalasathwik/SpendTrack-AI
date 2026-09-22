export interface Expense {
  id: string;
  itemName: string;
  category: string;
  subcategory?: string;
  merchant?: string;
  taxAmount?: number;
  currency?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  account?: string;
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
  source?: 'manual' | 'recurring' | 'receipt' | 'quick' | 'ai' | 'AI Copilot';
  recurringId?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface ExtractedReceiptResult {
  title: string;
  merchant: string;
  amount: number;
  taxAmount?: number;
  currency?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  purchaseDate: string;
  category: string;
  confidences?: Record<string, 'High' | 'Medium' | 'Low'>;
  items?: Array<{
    name: string;
    price: number;
    quantity?: number;
    unit?: string;
    category?: string;
  }>;
  receiptDriveFileId?: string;
  receiptFileName?: string;
  receiptViewLink?: string;
}

export interface CategoryItem {
  id?: string;
  name: string;
  subcategories?: string[];
  color: string;
  icon?: string;
  userId?: string;
  createdAt?: string;
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
  rowIndex?: number;
  name?: string;
  title?: string;
  category?: string | any;
  categoryId?: string;
  subcategory?: string;
  amount: number;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | string;
  dueDay?: number;
  dueDate?: string;
  startDate?: string;
  nextRun?: string;
  note?: string;
  notes?: string;
  autopost?: boolean;
  reminderDays?: number;
  isActive?: boolean;
  isPaid?: boolean;
  paidDate?: string;
  lastGeneratedMonth?: string;
  calendarReminderEnabled?: boolean;
  calendarEventId?: string;
  calendarHtmlLink?: string;
  calendarSyncStatus?: 'synced' | 'syncing' | 'error';
  reminderDate?: string;
  reminderTime?: string;
  notifyBefore?: string;
  lastRecordedDate?: string;
  createdAt: string;
  updatedAt?: string;
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
  type: 'bill_upcoming' | 'bill_due' | 'bill_overdue' | 'stock_low' | 'ai_insight' | 'success';
  title: string;
  message: string;
  state: 'Upcoming' | 'Due Today' | 'Overdue' | 'Low Stock' | 'AI Insight' | 'Success';
  date?: string;
  itemId?: string;
  billId?: string;
  read?: boolean;
  createdAt?: string;
}

export interface AIChatRecord {
  chatId: string;
  messageId: string;
  role: 'user' | 'assistant' | 'model';
  message: string;
  timestamp: string;
}

export interface AIChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    status?: 'sending' | 'sent' | 'error';
  }>;
}

export interface UserSettings {
  currencySymbol: string;
  currency?: string;
  dateFormat: string;
  monthlyBudget?: number;
  budgetStartDay?: number;
  homeMode?: 'default' | 'calendar' | 'notebook' | 'quickadd' | 'aicfo';
  onboardingCompleted?: boolean;
}

export interface BudgetMetrics {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  progressPercentage: number;
  colorState: 'green' | 'orange' | 'red';
  dailySafeSpend: number;
  dailyBurnRate: number;
  predictedMonthEndSpend: number;
  budgetHealthScore: number;
  daysElapsed: number;
  daysRemaining: number;
}

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'currentMonth'
  | 'previousMonth'
  | 'currentQuarter'
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

export interface IncomeItem {
  id: string;
  title: string;
  amount: number;
  userId?: string;
  createdAt?: string;
}

export interface EmiItem {
  id: string;
  title: string;
  bank: string;
  amount: number;
  dueDay: number;
  interestRate?: number | null;
  outstanding?: number | null;
  reminder?: boolean;
  userId?: string;
  createdAt?: string;
}

export interface InvestmentItem {
  id: string;
  title: string;
  provider: string;
  amount: number;
  type: 'SIP' | 'GOLD_SIP' | 'MUTUAL_FUND' | 'STOCKS' | string;
  frequency?: string;
  nextDate: string;
  isActive?: boolean;
  userId?: string;
  createdAt?: string;
}

export interface SavingItem {
  id: string;
  title: string;
  type: 'RD' | 'FD' | 'EMERGENCY_FUND' | string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  interestRate?: number | null;
  maturityDate?: string | null;
  userId?: string;
  createdAt?: string;
}

export interface FinancialNote {
  id: string;
  title?: string;
  content: string;
  tags?: string;
  pinned?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderItem {
  id: string;
  userId?: string;
  title: string;
  description?: string | null;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  completed: boolean;
  createdAt?: string;
}

export interface PlannerSummary {
  income: number;
  emi: number;
  investments: number;
  savings: number;
  living: number;
  buffer: number;
}

export interface UpcomingReminder {
  id: string;
  title: string;
  type: 'EMI' | 'SIP' | 'RD' | 'FD' | 'REMINDER' | 'RECURRING';
  amount?: number;
  dueDate: string;
  daysLeft: number;
}

export interface CashFlowCurrent {
  income: number;
  expenses: number;
  emi: number;
  investments: number;
  savings: number;
  freeCash: number;
  savingRate: number;
  emiRatio: number;
}

export interface GoalItem {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  category?: string | null;
  createdAt?: string;
  progressPercent?: number;
  remainingAmount?: number;
  estimatedCompletionMonth?: string;
  requiredMonthlyContribution?: number;
  isAheadOfSchedule?: boolean;
}

export interface AssetItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  isAuto?: boolean;
  createdAt?: string;
}

export interface LiabilityItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  isAuto?: boolean;
  createdAt?: string;
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetsByCategory: Record<string, number>;
  liabilitiesByCategory: Record<string, number>;
  assetsList: AssetItem[];
  liabilitiesList: LiabilityItem[];
}

export interface CfoFinancialHealth {
  healthScore: number;
  freeCash: number;
  savingRate: number;
  emiRatio: number;
  investmentRatio: number;
  emergencyFundMonths: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  insights: string[];
}

export interface AffordabilityResult {
  affordable: boolean;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  remainingCash: number;
  message: string;
}

export interface MonthlyClosingReport {
  monthName: string;
  year: number;
  income: number;
  spent: number;
  emi: number;
  investments: number;
  savings: number;
  freeCash: number;
  savingRate: number;
  healthScore: number;
  topCategories: { category: string; amount: number; percent: number }[];
  biggestPurchase: { title: string; amount: number; date: string; category: string } | null;
  aiSummary: string;
}

export interface SmartCfoNotification {
  id: string;
  type: 'EMI_DUE' | 'SIP_DUE' | 'RD_MATURITY' | 'FD_MATURITY' | 'BUDGET_WARNING' | 'EMERGENCY_LOW';
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  dueDate?: string;
  createdAt: string;
}

// TrackPay v4.7.0 AI Life Finance Ecosystem Interfaces

export interface PropertyAsset {
  id: string;
  userId?: string;
  title: string;
  propertyType: 'RESIDENTIAL' | 'APARTMENT' | 'LAND' | 'COMMERCIAL';
  purchaseValue: number;
  currentMarketValue: number;
  loanLinked: number;
  rentalIncome: number;
  appreciationRate: number;
  documentsLinked: number;
  notes?: string;
  createdAt?: string;
}

export interface PropertyIntelligenceSummary {
  properties: PropertyAsset[];
  totalPropertyWealth: number;
  totalEquityOwned: number;
  totalLoansLinked: number;
  totalMonthlyRental: number;
  averageAppreciationRate: number;
  overallRentalYield: number;
  overallRoi: number;
}

export interface VehicleAsset {
  id: string;
  userId?: string;
  name: string;
  vehicleType: 'CAR' | 'BIKE';
  purchasePrice: number;
  insurance: number;
  serviceHistoryCost: number;
  fuelCost: number;
  emi: number;
  resaleValue: number;
  purchaseYear: number;
  notes?: string;
  createdAt?: string;
}

export interface VehicleManagerSummary {
  vehicles: VehicleAsset[];
  totalPurchaseValue: number;
  totalResaleValue: number;
  totalDepreciation: number;
  totalAnnualOwnershipCost: number;
  bestResaleYear: number;
}

export interface EducationGoalItem {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  category: string;
  inflationRate: number;
  futureCost: number;
  requiredMonthly: number;
  completionProbability: number;
}

export interface HealthcareFinanceSummary {
  annualHealthcareSpend: number;
  coverageAdequacy: number;
  totalCoverageAmount: number;
  remainingInsuredAmount: number;
  medicalEmergencyFund: number;
  recentMedicalExpenses: any[];
  insurancePolicies: any[];
}

export interface CreditCardProfile {
  id: string;
  name: string;
  bankName: string;
  creditLimit: number;
  currentBalance: number;
  availableLimit: number;
  utilizationPercent: number;
  dueDate?: string;
}

export interface CreditWorkspaceSummary {
  creditCards: CreditCardProfile[];
  totalCreditLimit: number;
  totalUsedCredit: number;
  overallUtilization: number;
  creditHealthScore: number;
  improvementSuggestions: string[];
  emiEligibility: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'CAUTION';
}

export interface PrepaymentSimulationResult {
  originalOutstanding: number;
  partPaymentAmount: number;
  newBalance: number;
  monthsSaved: number;
  interestSaved: number;
  newTenureMonths: number;
  effectiveRoi: number;
  investmentComparisonAdvice: string;
}

export interface FamilyWealthMemberNode {
  id: string;
  name: string;
  relation: string;
  role: string;
  avatar?: string;
  assignedAssetsCount: number;
  assignedLiabilitiesCount: number;
  nomineeStatus: 'COMPLETE' | 'PARTIAL' | 'PENDING';
}

export interface FamilyWealthTreeData {
  familyMembers: FamilyWealthMemberNode[];
  totalHouseholdAssets: number;
  totalHouseholdLiabilities: number;
  netFamilyWealth: number;
  insuranceCoverageTotal: number;
}

export interface LegacyChecklistItem {
  id: string;
  title: string;
  category: 'WILL' | 'NOMINEE' | 'INSURANCE' | 'PROPERTY' | 'LOAN';
  status: 'COMPLETED' | 'PENDING' | 'ACTION_NEEDED';
  critical: boolean;
}

export interface LegacyChecklistSummary {
  completenessPercentage: number;
  checklist: LegacyChecklistItem[];
}

// TrackPay v4.8.0 AI Financial Operating System Interfaces

export interface SmartOcrExtractedData {
  documentId?: string;
  name?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  institution?: string;
  amount?: number;
  propertyDetails?: string;
  loanDetails?: string;
  ocrConfidence: number;
  summary: string;
  tags: string[];
}

export interface StatementImportRow {
  id: string;
  date: string;
  description: string;
  merchant: string;
  category: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  gstAmount?: number;
  isRecurring: boolean;
  confidenceScore: number;
  mappedAccount: string;
}

export interface StatementImportResult {
  fileName: string;
  totalRowsProcessed: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  averageConfidence: number;
  transactions: StatementImportRow[];
}

export interface TaxRegimeComparison {
  regimeName: 'OLD' | 'NEW';
  taxableIncome: number;
  estimatedTax: number;
  totalDeductionsClaimed: number;
  breakdown: { label: string; amount: number }[];
}

export interface TaxPlannerProSummary {
  selectedFy: string;
  grossIncome: number;
  oldRegime: TaxRegimeComparison;
  newRegime: TaxRegimeComparison;
  recommendedRegime: 'OLD' | 'NEW';
  taxSavedWithRecommendation: number;
  missingDeductions: { section: string; title: string; maxLimit: number; claimed: number; gap: number }[];
  investmentDeadline: string;
  taxUtilizationPercent: number;
}

export interface MarketIndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface MarketIntelligenceData {
  indices: MarketIndexQuote[];
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  goldTrend: string;
  equityOutlook: string;
  etfOpportunity: string;
}

export interface WatchlistItem {
  id: string;
  userId?: string;
  symbol: string;
  name: string;
  assetType: 'STOCK' | 'ETF' | 'GOLD' | 'SILVER';
  targetBuyPrice: number;
  currentPrice: number;
  alertPrice: number;
  convictionScore: number;
  notes?: string;
  createdAt?: string;
}

export interface FinancialCalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: 'SALARY' | 'EMI' | 'SIP' | 'INSURANCE' | 'GST' | 'PROPERTY_TAX' | 'VEHICLE_SERVICE' | 'BIRTHDAY' | 'ANNIVERSARY';
  amount?: number;
  status: 'UPCOMING' | 'COMPLETED' | 'OVERDUE';
}

export interface AutomationTriggerAlert {
  id: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  triggerType: 'EMI_DUE' | 'SIP_DUE' | 'SALARY_CREDIT' | 'INSURANCE_RENEWAL' | 'PROPERTY_TAX' | 'GOLD_TARGET' | 'BUDGET_EXCEEDED' | 'CREDIT_UTILIZATION_HIGH';
  triggerDate: string;
  actionRequired?: string;
}



