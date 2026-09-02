import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  CreditCard,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ShoppingBag,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  Sparkles,
  Bot,
  Zap,
  CheckCircle2,
  Flame,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Expense, DateRange, CategorySpending, ItemAnalyticsSummary, MonthlyItem } from '../types';
import {
  calculateCategoryTotals,
  filterExpensesByDateRange,
  formatCurrency,
  generateItemAnalytics,
  generateConsumptionInsights,
  getCurrentlyInUseStatus,
  formatConsumptionVelocity,
} from '../utils/calculations';
import { formatDisplayDate } from '../utils/dateRanges';
import { CATEGORY_COLORS } from '../data/defaults';

interface DashboardPageProps {
  expenses: Expense[];
  dateRange: DateRange;
  monthlyItems?: MonthlyItem[];
  onOpenAddExpense: () => void;
  onViewExpenseHistory: () => void;
  onViewMonthlyItems?: () => void;
  onSelectItemAnalytics: (itemName: string) => void;
  onOpenAIWithQuestion?: (question: string) => void;
  onQuickAddFromItem?: (item: MonthlyItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  expenses,
  dateRange,
  monthlyItems = [],
  onOpenAddExpense,
  onViewExpenseHistory,
  onViewMonthlyItems,
  onSelectItemAnalytics,
  onOpenAIWithQuestion,
  onQuickAddFromItem,
}) => {
  // Determine dynamic time-of-day greeting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  // Filtered expenses for active date range
  const filteredExpenses = filterExpensesByDateRange(
    expenses,
    dateRange.startDate,
    dateRange.endDate
  );

  const totalSpending = filteredExpenses.reduce((s, e) => s + (Number(e.totalPrice) || 0), 0);
  const expenseCount = filteredExpenses.length;

  const startDateObj = new Date(dateRange.startDate);
  const endDateObj = new Date(dateRange.endDate);
  const totalDays = Math.max(
    1,
    Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const averageDailySpending = Number((totalSpending / totalDays).toFixed(2));

  // Category breakdown
  const categoryTotals = calculateCategoryTotals(filteredExpenses);
  const highestCategory = categoryTotals.length > 0 ? categoryTotals[0] : null;

  // Most expensive expense
  const mostExpensiveExpense =
    filteredExpenses.length > 0
      ? [...filteredExpenses].sort((a, b) => (Number(b.totalPrice) || 0) - (Number(a.totalPrice) || 0))[0]
      : null;

  // Daily Spending Trend Data
  const trendMap: Record<string, number> = {};
  for (const exp of filteredExpenses) {
    if (exp.purchaseDate) {
      trendMap[exp.purchaseDate] = (trendMap[exp.purchaseDate] || 0) + (Number(exp.totalPrice) || 0);
    }
  }

  const sortedTrendDates = Object.keys(trendMap).sort();
  const spendingTrend = sortedTrendDates.map((date) => ({
    date,
    displayDate: formatDisplayDate(date),
    amount: trendMap[date],
  }));

  // Find currently in-use expenses across all records
  const currentlyInUseList: {
    expense: Expense;
    daysSoFar: number;
    estimatedDailyCost?: number;
  }[] = [];

  for (const exp of expenses) {
    const status = getCurrentlyInUseStatus(exp);
    if (status.isInUse && status.daysSoFar !== undefined) {
      currentlyInUseList.push({
        expense: exp,
        daysSoFar: status.daysSoFar,
        estimatedDailyCost: status.dailyCostSoFar,
      });
    }
  }

  // Generate top deterministic insights
  const allInsights = generateConsumptionInsights(expenses).slice(0, 4);

  // Active Monthly Items for Quick Add
  const activeMonthlyTemplates = monthlyItems.filter((m) => m.isEnabled !== false);

  const recentExpenses = [...filteredExpenses]
    .sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || ''))
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12" id="dashboard-container">
      {/* 1. Header Greeting & Date Range Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            {greeting}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Here's where your money is going.
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active horizon: <strong className="text-slate-800">{dateRange.label}</strong> ({formatDisplayDate(dateRange.startDate)} → {formatDisplayDate(dateRange.endDate)})
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="dashboard-primary-add-btn"
            onClick={onOpenAddExpense}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Total Spending Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Total Spending Card */}
        <div
          id="hero-total-spending"
          className="md:col-span-2 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl border border-slate-700/60 shadow-lg flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Total Spending
            </span>
            <span className="text-[11px] font-semibold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              {expenseCount} Purchases
            </span>
          </div>

          <div className="my-4">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {formatCurrency(totalSpending)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Averaging <strong className="text-emerald-300">{formatCurrency(averageDailySpending)}/day</strong> across {totalDays} days in this period.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-300">
            <span>Est. monthly run rate: <strong>{formatCurrency(averageDailySpending * 30.42)}</strong></span>
            <button
              onClick={onViewExpenseHistory}
              className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Review Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Secondary Snapshot Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
          {/* Top Category Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Category</span>
            <div className="my-1">
              <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {highestCategory ? highestCategory.category : '—'}
              </div>
              <div className="text-xs text-emerald-700 font-bold mt-0.5">
                {highestCategory ? `${formatCurrency(highestCategory.totalAmount)} (${highestCategory.percentage}%)` : 'No expenses in range'}
              </div>
            </div>
          </div>

          {/* Max Single Purchase Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Max Single Item</span>
            <div className="my-1">
              <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {mostExpensiveExpense ? mostExpensiveExpense.itemName : '—'}
              </div>
              <div className="text-xs text-slate-600 font-semibold mt-0.5">
                {mostExpensiveExpense ? `${formatCurrency(mostExpensiveExpense.totalPrice)} • ${mostExpensiveExpense.category}` : 'No records'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Add Bar (One-Tap Speed Logging) */}
      {activeMonthlyTemplates.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Quick Add Essentials</span>
            </div>
            <button
              onClick={onViewMonthlyItems}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              Manage Templates ({activeMonthlyTemplates.length})
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Tap an item to immediately log a purchase with preset defaults:
          </p>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            {activeMonthlyTemplates.map((template) => (
              <button
                key={template.id}
                id={`quick-add-chip-${template.id}`}
                onClick={() => onQuickAddFromItem?.(template)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200/80 hover:border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>{template.name}</span>
                {template.typicalPrice !== undefined && (
                  <span className="text-[11px] font-semibold text-slate-400">
                    ~₹{template.typicalPrice}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. CONSUMPTION: Currently In-Use Household Items */}
      {currentlyInUseList.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-2xs space-y-3" id="consumption-in-use-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-black text-sm sm:text-base text-slate-900 tracking-tight">
                Consumption • Currently In-Use
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {currentlyInUseList.length} Active
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Live consumption run-rate
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentlyInUseList.map(({ expense, daysSoFar, estimatedDailyCost }) => (
              <div
                key={expense.id}
                onClick={() => onSelectItemAnalytics(expense.itemName)}
                className="p-3.5 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50/80 border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900">
                    {expense.itemName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Started {formatDisplayDate(expense.usageStartDate || expense.purchaseDate)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-emerald-800">
                    {daysSoFar} days in use
                  </div>
                  {estimatedDailyCost !== undefined && (
                    <div className="text-[11px] text-slate-600 font-bold">
                      ₹{estimatedDailyCost}/day
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Spending by Category & Daily Trajectory Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spending by Category Donut Chart */}
        <div
          id="chart-spending-category"
          className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">Spending by Category</h3>
              <p className="text-xs text-slate-400">Share of expenditures in {dateRange.label}</p>
            </div>
          </div>

          {categoryTotals.length > 0 ? (
            <div className="h-64 sm:h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="totalAmount"
                    nameKey="category"
                  >
                    {categoryTotals.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || CATEGORY_COLORS[entry.category] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${formatCurrency(Number(val))}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-600 font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Layers className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs">No expenses recorded in this period.</p>
              <button
                onClick={onOpenAddExpense}
                className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
              >
                + Record an expense
              </button>
            </div>
          )}

          {categoryTotals.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 max-h-40 overflow-y-auto">
              {categoryTotals.slice(0, 4).map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-slate-700">{cat.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-900">{formatCurrency(cat.totalAmount)}</span>
                    <span className="text-[11px] text-slate-400 ml-1 font-medium">({cat.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spending Trend Area Chart */}
        <div
          id="chart-spending-trend"
          className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">Spending Trajectory</h3>
              <p className="text-xs text-slate-400">Daily spending cadence</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              {dateRange.label}
            </span>
          </div>

          {spendingTrend.length > 0 ? (
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${formatCurrency(Number(val))}`, 'Daily Total']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#spendingGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <TrendingUp className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs">No daily expenditure points for this range.</p>
            </div>
          )}
        </div>
      </div>

      {/* 6. Human-Readable Insights */}
      {allInsights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Intelligent Insights</h3>
            <span className="text-xs text-slate-400">Deterministic household calculations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allInsights.map((ins) => (
              <div
                key={ins.id}
                onClick={() => onSelectItemAnalytics(ins.itemName)}
                className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer flex items-start gap-3.5"
              >
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 mt-0.5 flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{ins.title}</h4>
                    {ins.metric && (
                      <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md ml-2 flex-shrink-0">
                        {ins.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ins.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Recent Expenses List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs" id="recent-expenses-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">Recent Purchases</h3>
            <p className="text-xs text-slate-400">Latest logged expenditures with rate previews</p>
          </div>
          <button
            id="view-all-expenses-btn"
            onClick={onViewExpenseHistory}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExpenses.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentExpenses.map((exp) => (
              <div
                key={exp.id}
                className="py-3 sm:py-3.5 flex items-center justify-between hover:bg-slate-50/70 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-2xs flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[exp.category] || '#64748B' }}
                  >
                    {exp.itemName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectItemAnalytics(exp.itemName)}
                        className="font-bold text-slate-900 hover:text-emerald-600 text-xs sm:text-sm text-left cursor-pointer"
                      >
                        {exp.itemName}
                      </button>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {exp.category}
                      </span>
                      {exp.receiptDriveFileId && (
                        <span
                          className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold"
                          title="Receipt saved in Google Drive"
                        >
                          Receipt ✓
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 mt-1">
                      <span>{formatDisplayDate(exp.purchaseDate)}</span>

                      {exp.quantity !== undefined && (
                        <span>
                          • {exp.quantity} {exp.unit || 'unit'}
                        </span>
                      )}

                      {exp.durationDays !== undefined && (
                        <span className="text-emerald-700 font-bold">
                          • Lasted {exp.durationDays} days (~₹{exp.dailyCost}/day)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-3">
                  <div className="font-black text-sm sm:text-base text-slate-900">
                    {formatCurrency(exp.totalPrice)}
                  </div>
                  {exp.dailyQuantity !== undefined && (
                    <div className="text-[10px] text-slate-400 font-medium">
                      {exp.dailyQuantity} {exp.unit}/day
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No recent expenses recorded yet.
          </div>
        )}
      </div>

      {/* 8. Ask SpendTrack AI Command Card */}
      <div
        id="dashboard-ai-banner"
        className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 shrink-0 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white tracking-tight">Ask SpendTrack AI</h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-lg leading-relaxed">
              Have questions about your burn rate, price shifts, or recurring bills? SpendTrack AI calculates answers with zero hallucinations.
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenAIWithQuestion?.("Where did my money go this month?")}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <Bot className="w-4 h-4" />
          <span>Ask Question</span>
        </button>
      </div>
    </div>
  );
};
