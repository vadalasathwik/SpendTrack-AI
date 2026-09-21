import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Calendar,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Activity,
  CreditCard,
  Building2,
  Trash2,
  Edit2,
  ExternalLink,
  Award,
  DollarSign,
  ArrowUpDown,
  Store,
  BarChart2,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Expense, CategoryItem, DateRange } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { formatDisplayDate } from '../utils/dateRanges.js';
import { CATEGORY_COLORS } from '../data/defaults.js';

interface ExpensesPageProps {
  expenses: Expense[];
  categories: CategoryItem[];
  dateRange: DateRange;
  incomes?: any[];
  onOpenAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onSelectItemAnalytics: (itemName: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Food & Dining': Utensils,
  Transportation: Car,
  'Shopping & Retail': ShoppingBag,
  'Bills & Utilities': Zap,
  Entertainment: Film,
  'Health & Medical': Activity,
  Housing: Building2,
  Personal: CreditCard,
};

const PALETTE = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses = [],
  categories = [],
  incomes = [],
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense,
  onSelectItemAnalytics,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'insights' | 'charts' | 'merchants'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // -------------------------------------------------------------------
  // 1. TIMELINE CATEGORIZATION & FILTERS
  // -------------------------------------------------------------------
  const filtered = useMemo(() => {
    return expenses.filter((exp) => {
      const name = (exp.merchant || exp.itemName || '').toLowerCase();
      const notes = (exp.notes || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = name.includes(query) || notes.includes(query);

      const matchesCat = selectedCategory === 'ALL' || exp.category === selectedCategory;

      const acc = exp.account || (exp.source === 'AI Copilot' ? 'Google Pay' : 'HDFC Bank');
      const matchesAcc = selectedAccount === 'ALL' || acc.toLowerCase().includes(selectedAccount.toLowerCase());

      return matchesSearch && matchesCat && matchesAcc;
    });
  }, [expenses, searchQuery, selectedCategory, selectedAccount]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        const diff = (a.purchaseDate || '').localeCompare(b.purchaseDate || '');
        return sortOrder === 'desc' ? -diff : diff;
      }
      if (sortBy === 'price') {
        const diff = (a.totalPrice || 0) - (b.totalPrice || 0);
        return sortOrder === 'desc' ? -diff : diff;
      }
      if (sortBy === 'name') {
        const nameA = a.merchant || a.itemName;
        const nameB = b.merchant || b.itemName;
        const diff = nameA.localeCompare(nameB);
        return sortOrder === 'desc' ? -diff : diff;
      }
      return 0;
    });
  }, [filtered, sortBy, sortOrder]);

  // Group sorted transactions by time buckets
  const timelineGroups = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: {
      today: Expense[];
      yesterday: Expense[];
      thisWeek: Expense[];
      earlier: Expense[];
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };

    sorted.forEach((exp) => {
      const dStr = exp.purchaseDate || '';
      const expDate = new Date(dStr);

      if (dStr === todayStr) {
        groups.today.push(exp);
      } else if (dStr === yesterdayStr) {
        groups.yesterday.push(exp);
      } else if (expDate >= weekAgo) {
        groups.thisWeek.push(exp);
      } else {
        groups.earlier.push(exp);
      }
    });

    return groups;
  }, [sorted]);

  // -------------------------------------------------------------------
  // 2. FINANCIAL INSIGHTS MATH
  // -------------------------------------------------------------------
  const insightsMetrics = useMemo(() => {
    const totalSpent = sorted.reduce((sum, e) => sum + (Number(e.totalPrice) || 0), 0);
    const now = new Date();
    const daysInMonthSoFar = Math.max(1, now.getDate());
    const avgPerDay = Math.round(totalSpent / daysInMonthSoFar);

    // Highest category
    const catTotals: Record<string, number> = {};
    sorted.forEach((e) => {
      catTotals[e.category] = (catTotals[e.category] || 0) + (Number(e.totalPrice) || 0);
    });
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const highestCategory = sortedCats[0] ? sortedCats[0][0] : 'None';
    const highestCatAmount = sortedCats[0] ? sortedCats[0][1] : 0;

    // Biggest single expense
    const biggestExp = [...sorted].sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0))[0];

    // Previous month comparison
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
    }

    const prevMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.purchaseDate);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });
    const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + (Number(e.totalPrice) || 0), 0);

    let momChange = 0;
    if (prevMonthTotal > 0) {
      momChange = Math.round(((totalSpent - prevMonthTotal) / prevMonthTotal) * 100);
    }

    return {
      totalSpent,
      avgPerDay,
      highestCategory,
      highestCatAmount,
      biggestExp,
      momChange,
      prevMonthTotal,
    };
  }, [sorted, expenses]);

  // -------------------------------------------------------------------
  // 3. RECHARTS DATA PREPARATION
  // -------------------------------------------------------------------
  const areaChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7 = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];

      const dayTotal = sorted
        .filter((e) => e.purchaseDate === dateStr)
        .reduce((sum, e) => sum + (Number(e.totalPrice) || 0), 0);

      return {
        day: dayName,
        date: dateStr,
        amount: dayTotal,
      };
    });
    return last7;
  }, [sorted]);

  const pieChartData = useMemo(() => {
    const catTotals: Record<string, number> = {};
    sorted.forEach((e) => {
      catTotals[e.category] = (catTotals[e.category] || 0) + (Number(e.totalPrice) || 0);
    });

    return Object.entries(catTotals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [sorted]);

  const barChartData = useMemo(() => {
    const totalInflow = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 140000;
    const totalOutflow = sorted.reduce((s, e) => s + (Number(e.totalPrice) || 0), 0);

    return [
      { name: 'Income', amount: totalInflow },
      { name: 'Expenses', amount: totalOutflow },
    ];
  }, [sorted, incomes]);

  // -------------------------------------------------------------------
  // 4. MERCHANT INTELLIGENCE (Top 5 Leaderboard)
  // -------------------------------------------------------------------
  const merchantIntelligence = useMemo(() => {
    const merchantMap: Record<
      string,
      { merchant: string; category: string; visitCount: number; totalSpent: number }
    > = {};

    sorted.forEach((e) => {
      const name = e.merchant || e.itemName || 'General Merchant';
      if (!merchantMap[name]) {
        merchantMap[name] = {
          merchant: name,
          category: e.category || 'General',
          visitCount: 0,
          totalSpent: 0,
        };
      }
      merchantMap[name].visitCount += 1;
      merchantMap[name].totalSpent += Number(e.totalPrice) || 0;
    });

    const leaderboard = Object.values(merchantMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return leaderboard;
  }, [sorted]);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200" id="expenses-page-container">
      {/* ------------------------------------------------------------- */}
      {/* Header Banner & Add Action                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-5 text-white border border-emerald-500/30 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-300 uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Pay Workspace</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Transactions
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Intelligent ledger, merchant ranks & Recharts analytics
            </p>
          </div>

          <button
            onClick={onOpenAddExpense}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Spend</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Filter Segment Pills & Search Bar                             */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions by merchant, item or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-xs"
          />
        </div>

        {/* Tab Segment Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'timeline', label: `Timeline (${sorted.length})` },
            { id: 'insights', label: 'Insights' },
            { id: 'charts', label: 'Charts' },
            { id: 'merchants', label: 'Merchants' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. TIMELINE TAB (Categorized Time Groups)                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {sorted.length === 0 ? (
            <div className="p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Transactions Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {searchQuery
                  ? 'No transactions match your search filter.'
                  : 'Record your first expense to populate your Google Pay timeline.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* TODAY */}
              {timelineGroups.today.length > 0 && (
                <TimelineGroupSection
                  title="Today"
                  items={timelineGroups.today}
                  onSelectItemAnalytics={onSelectItemAnalytics}
                  onEditExpense={onEditExpense}
                  onDeleteExpense={(exp) => setExpenseToDelete(exp)}
                />
              )}

              {/* YESTERDAY */}
              {timelineGroups.yesterday.length > 0 && (
                <TimelineGroupSection
                  title="Yesterday"
                  items={timelineGroups.yesterday}
                  onSelectItemAnalytics={onSelectItemAnalytics}
                  onEditExpense={onEditExpense}
                  onDeleteExpense={(exp) => setExpenseToDelete(exp)}
                />
              )}

              {/* THIS WEEK */}
              {timelineGroups.thisWeek.length > 0 && (
                <TimelineGroupSection
                  title="This Week"
                  items={timelineGroups.thisWeek}
                  onSelectItemAnalytics={onSelectItemAnalytics}
                  onEditExpense={onEditExpense}
                  onDeleteExpense={(exp) => setExpenseToDelete(exp)}
                />
              )}

              {/* EARLIER */}
              {timelineGroups.earlier.length > 0 && (
                <TimelineGroupSection
                  title="Earlier"
                  items={timelineGroups.earlier}
                  onSelectItemAnalytics={onSelectItemAnalytics}
                  onEditExpense={onEditExpense}
                  onDeleteExpense={(exp) => setExpenseToDelete(exp)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. INSIGHTS TAB (Metrics & Comparisons)                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'insights' && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            {/* Metric 1: Total Spending */}
            <div className="p-4 rounded-[28px] bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg border border-emerald-400/20">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">Total Spending</span>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">
                {formatCurrency(insightsMetrics.totalSpent)}
              </p>
              <span className="text-[10px] text-emerald-200 mt-1 block">Current month outflow</span>
            </div>

            {/* Metric 2: Average / Day */}
            <div className="p-4 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Average / Day</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(insightsMetrics.avgPerDay)}
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Daily burn rate</span>
            </div>

            {/* Metric 3: Highest Category */}
            <div className="p-4 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Highest Category</span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-1 truncate">
                {insightsMetrics.highestCategory}
              </p>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-1 block">
                {formatCurrency(insightsMetrics.highestCatAmount)}
              </span>
            </div>

            {/* Metric 4: MoM Comparison */}
            <div className="p-4 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">MoM Change</span>
              <p className={`text-xl sm:text-2xl font-black mt-1 ${insightsMetrics.momChange > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {insightsMetrics.momChange > 0 ? `+${insightsMetrics.momChange}%` : `${insightsMetrics.momChange}%`}
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">vs last month</span>
            </div>
          </div>

          {/* Metric 5: Biggest Expense */}
          {insightsMetrics.biggestExp && (
            <div className="p-4 rounded-[28px] bg-slate-900 text-white border border-slate-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Biggest Single Expense</span>
                  <h4 className="font-extrabold text-sm text-white">
                    {insightsMetrics.biggestExp.merchant || insightsMetrics.biggestExp.itemName}
                  </h4>
                  <p className="text-[10px] text-slate-400">{insightsMetrics.biggestExp.category}</p>
                </div>
              </div>
              <span className="text-base font-black text-amber-400 font-mono">
                {formatCurrency(insightsMetrics.biggestExp.totalPrice)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. CHARTS TAB (Recharts Area, Donut & Bar Charts)              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          {/* Chart 1: 7-Day Area Spending Trend */}
          <div className="p-5 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-500" />
                <span>7-Day Spending Trend</span>
              </h3>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Spent']}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category Donut Chart */}
          <div className="p-5 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-cyan-500" />
              <span>Category Breakdown</span>
            </h3>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Amount']}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Income vs Expense Bar Chart */}
          <div className="p-5 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span>Income vs Expense Flow</span>
            </h3>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Total']}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.name === 'Income' ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MERCHANT INTELLIGENCE TAB (Top 5 Leaderboard)              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'merchants' && (
        <div className="space-y-3 px-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-500" />
              Top 5 Merchants Leaderboard
            </h2>
          </div>

          <div className="space-y-2.5">
            {merchantIntelligence.map((item, idx) => (
              <div
                key={item.merchant}
                className="p-4 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">{item.merchant}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {item.category} • {item.visitCount} visits
                    </p>
                  </div>
                </div>

                <span className="font-black text-xs text-slate-900 dark:text-white font-mono">
                  {formatCurrency(item.totalSpent)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[380px] rounded-[28px] p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Delete Transaction?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">"{expenseToDelete.merchant || expenseToDelete.itemName}"</strong> ({formatCurrency(expenseToDelete.totalPrice)}) from PostgreSQL?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteExpense(expenseToDelete);
                  setExpenseToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------------
// TIMELINE GROUP COMPONENT
// -------------------------------------------------------------------
const TimelineGroupSection: React.FC<{
  title: string;
  items: Expense[];
  onSelectItemAnalytics: (name: string) => void;
  onEditExpense: (exp: Expense) => void;
  onDeleteExpense: (exp: Expense) => void;
}> = ({ title, items, onSelectItemAnalytics, onEditExpense, onDeleteExpense }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </h3>
        <span className="text-[10px] font-bold text-slate-400">
          {items.length} items
        </span>
      </div>

      <div className="p-2 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
        {items.map((exp) => (
          <TransactionRowItem
            key={exp.id}
            exp={exp}
            onSelectItemAnalytics={onSelectItemAnalytics}
            onEditExpense={onEditExpense}
            onDeleteExpense={onDeleteExpense}
          />
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------
// TRANSACTION ROW ITEM (With Swipe Delete Gesture)
// -------------------------------------------------------------------
const TransactionRowItem: React.FC<{
  exp: Expense;
  onSelectItemAnalytics: (name: string) => void;
  onEditExpense: (exp: Expense) => void;
  onDeleteExpense: (exp: Expense) => void;
}> = ({ exp, onSelectItemAnalytics, onEditExpense, onDeleteExpense }) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const name = exp.merchant || exp.itemName || 'Expense';
  const amount = Number(exp.totalPrice) || 0;
  const category = exp.category || 'General';
  const CategoryIcon = CATEGORY_ICONS[category] || Receipt;
  const account = exp.account || (exp.source === 'AI Copilot' ? 'Google Pay' : 'HDFC Bank');

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      onDeleteExpense(exp);
    } else if (distance < -50) {
      onEditExpense(exp);
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={() => onEditExpense(exp)}
      className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Merchant Logo Avatar */}
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs"
          style={{ backgroundColor: CATEGORY_COLORS[category] || '#10B981' }}
        >
          {name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
              {name}
            </h4>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
              {account}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            <span className="flex items-center gap-1">
              <CategoryIcon className="w-3 h-3" />
              {category}
            </span>
            <span>•</span>
            <span>{exp.purchaseDate || 'Today'}</span>
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 flex items-center gap-2">
        <div>
          <span className="font-black text-xs text-slate-900 dark:text-white font-mono block">
            -{formatCurrency(amount)}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteExpense(exp);
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};


