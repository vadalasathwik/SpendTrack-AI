import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Receipt,
  CreditCard,
  Award,
  Calendar as CalendarIcon,
  RefreshCw,
  ShoppingBag,
  Layers,
  AlertTriangle,
  Target,
  Flame,
} from 'lucide-react';
import { Expense, DateRange } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { SpendTrackApi } from '../services/api.js';
import { AnalyticsSkeleton } from '../components/SkeletonLoader.js';
import { EmptyState } from '../components/ui/EmptyState.js';

interface AnalyticsPageProps {
  expenses?: Expense[];
  currentDateRange?: DateRange;
}

interface StatsData {
  totalExpenses: number;
  transactionCount: number;
  averageExpense: number;
  highestExpense: number;
}

interface MonthlyTrendItem {
  month: string;
  label: string;
  totalAmount: number;
}

interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  color: string;
  totalAmount: number;
  count: number;
}

interface WeeklySpendingItem {
  date: string;
  day: string;
  amount: number;
}

interface TopMerchantItem {
  merchant: string;
  totalAmount: number;
  count: number;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  expenses = [],
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  // Analytics state from PostgreSQL API
  const [stats, setStats] = useState<StatsData>({
    totalExpenses: 0,
    transactionCount: 0,
    averageExpense: 0,
    highestExpense: 0,
  });
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendItem[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [weeklySpending, setWeeklySpending] = useState<WeeklySpendingItem[]>([]);
  const [topMerchants, setTopMerchants] = useState<TopMerchantItem[]>([]);
  const [budgetInsights, setBudgetInsights] = useState<any>(null);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [fetchedStats, fetchedMonthly, fetchedCategories, fetchedWeekly, fetchedMerchants, fetchedBudgets] =
        await Promise.all([
          SpendTrackApi.getAnalyticsStats().catch(() => null),
          SpendTrackApi.getMonthlyTrend().catch(() => []),
          SpendTrackApi.getCategoryBreakdown(selectedMonth, selectedYear).catch(() => []),
          SpendTrackApi.getWeeklySpending().catch(() => []),
          SpendTrackApi.getTopMerchants().catch(() => []),
          SpendTrackApi.getBudgetInsights(selectedMonth, selectedYear).catch(() => null),
        ]);

      if (fetchedStats) {
        setStats(fetchedStats);
      } else {
        // Fallback calculations from client expenses if backend returns empty/null
        const total = expenses.reduce((sum, e) => sum + (Number(e.totalPrice) || 0), 0);
        const count = expenses.length;
        const highest = expenses.reduce((max, e) => Math.max(max, Number(e.totalPrice) || 0), 0);
        setStats({
          totalExpenses: total,
          transactionCount: count,
          averageExpense: count > 0 ? Number((total / count).toFixed(2)) : 0,
          highestExpense: highest,
        });
      }

      setMonthlyTrend(fetchedMonthly || []);
      setCategoryBreakdown(fetchedCategories || []);
      setWeeklySpending(fetchedWeekly || []);
      setTopMerchants(fetchedMerchants || []);
      setBudgetInsights(fetchedBudgets || null);
    } catch (err) {
      console.warn("Analytics fetch notice:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedMonth, selectedYear]);

  // Year options for selector (current year ± 2)
  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const maxMerchantSpend = topMerchants.length > 0 ? Math.max(...topMerchants.map((m) => m.totalAmount)) : 1;

  if (isLoading && (!expenses || expenses.length === 0)) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1440px] mx-auto" id="analytics-page-container">
      {/* Header Banner & Month/Year Selector */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              PostgreSQL Intelligence
            </span>
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                Updating...
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Analytics & Spending Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time financial metrics, 12-month trends, category breakdowns, and top merchant activity
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-[14px] border border-slate-200/60 dark:border-slate-700/60 self-start md:self-auto">
          <div className="flex items-center gap-1.5 px-2 text-slate-400">
            <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Period:</span>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-[10px] focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-[10px] focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            {yearOptions.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses & Burn Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Monthly Burn Rate Tracked
            </p>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Transaction Count */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Transaction Count
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.transactionCount} <span className="text-sm font-normal text-slate-400">purchases</span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Total logged items
            </p>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Average Expense */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Average Expense
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(stats.averageExpense)}
            </div>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Mean value per order
            </p>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-800/60 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Highest Expense */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Highest Expense
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(stats.highestExpense)}
            </div>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Peak single transaction
            </p>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60 shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts Grid: Monthly Trend (Line) & Category Distribution (Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 12-Month Spending Trend Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                12-Month Spending Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historical monthly total spend across the past 12 months
              </p>
            </div>
          </div>

          {monthlyTrend.length > 0 ? (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${formatCurrency(Number(val))}`, 'Total Spent']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: '1px solid #334155',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 4 }}
                    activeDot={{ r: 6, stroke: '#34D399', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No historical trend data available yet.
            </div>
          )}
        </div>

        {/* Category Breakdown Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Category Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {monthNames[selectedMonth - 1]} {selectedYear} spending share
            </p>
          </div>

          {categoryBreakdown.length > 0 ? (
            <>
              <div className="h-52 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="totalAmount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {categoryBreakdown.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color || '#10B981'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${formatCurrency(Number(val))}`, 'Spent']}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        border: '1px solid #334155',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                {categoryBreakdown.slice(0, 5).map((cat) => (
                  <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || '#10B981' }}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {cat.categoryName}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white shrink-0">
                      {formatCurrency(cat.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No expenses found for {monthNames[selectedMonth - 1]} {selectedYear}.
            </div>
          )}
        </div>
      </div>

      {/* Secondary Grid: Weekly Bar Chart & Top Merchant Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Spending Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Current Week Daily Spending</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily burn rate for the active week (Monday to Sunday)
            </p>
          </div>

          {weeklySpending.length > 0 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySpending} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${formatCurrency(Number(val))}`, 'Daily Spend']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: '1px solid #334155',
                    }}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No spending recorded for this week.
            </div>
          )}
        </div>

        {/* Top 5 Merchant Ranking */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Top 5 Merchants & Outlets</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked merchant locations by cumulative spending volume
            </p>
          </div>

          {topMerchants.length > 0 ? (
            <div className="space-y-3 pt-1">
              {topMerchants.map((m, idx) => {
                const percent = Math.round((m.totalAmount / maxMerchantSpend) * 100);
                return (
                  <div key={m.merchant} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-[10px] shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {m.merchant}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({m.count} order{m.count > 1 ? 's' : ''})
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-900 dark:text-white shrink-0">
                        {formatCurrency(m.totalAmount)}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No merchant transactions logged yet.
            </div>
          )}
        </div>
      </div>

      {/* Budget Intelligence Grid: Budget vs Actual Bar Chart & Overspend Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Budget vs Actual Spend</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly category budget limit compared to actual expense logs
              </p>
            </div>
            {budgetInsights && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {budgetInsights.categoryCount || 0} Categories
              </span>
            )}
          </div>

          {budgetInsights?.categories && budgetInsights.categories.length > 0 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budgetInsights.categories.map((c: any) => ({
                    category: c.category,
                    Limit: Number(c.monthlyLimit) || 0,
                    Spent: Number(c.spent) || 0,
                  }))}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${formatCurrency(Number(val))}`]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: '1px solid #334155',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Limit" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <Target className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>No active category budgets set for this month.</span>
            </div>
          )}
        </div>

        {/* Category Overspend Ranking */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Category Overspend Ranking</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categories ordered by percentage of monthly budget consumed
              </p>
            </div>
            {budgetInsights && budgetInsights.overspendCount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {budgetInsights.overspendCount} Overbudget
              </span>
            )}
          </div>

          {budgetInsights?.categories && budgetInsights.categories.length > 0 ? (
            <div className="space-y-3 pt-1 max-h-72 overflow-y-auto pr-1">
              {[...budgetInsights.categories]
                .sort((a: any, b: any) => b.percentageUsed - a.percentageUsed)
                .map((cat: any, idx: number) => {
                  const isOver = cat.percentageUsed > 100;
                  const isWarning = cat.percentageUsed >= 80 && !isOver;
                  return (
                    <div
                      key={cat.id || cat.category}
                      className={`p-3 rounded-[14px] border ${
                        isOver
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/80'
                          : isWarning
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/80'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                              isOver
                                ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {cat.category}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(cat.spent)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            of {formatCurrency(cat.monthlyLimit)}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(cat.percentageUsed, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] mt-1 font-semibold text-slate-500 dark:text-slate-400">
                        <span>{cat.percentageUsed}% used</span>
                        <span className={isOver ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                          {isOver
                            ? `Exceeded by ${formatCurrency(cat.spent - cat.monthlyLimit)}`
                            : `${formatCurrency(cat.remaining)} remaining`}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <Flame className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>No category overspend ranking data available.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
