import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  Receipt,
  PiggyBank,
  CreditCard,
  Plus,
  Camera,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Sparkles,
  QrCode,
  Brain,
  Zap,
  PieChart,
  Calendar,
  ArrowDownLeft,
  X,
  Check,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  CashFlowCurrent,
  UpcomingReminder,
  Expense,
  DateRange,
  UserSettings,
} from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { SpendTrackApi } from '../services/api.js';

interface FinanceHomePageProps {
  user: any;
  cashFlow: CashFlowCurrent;
  upcomingTimeline: UpcomingReminder[];
  expenses: Expense[];
  dateRange: DateRange;
  userSettings?: UserSettings;
  incomes?: any[];
  emis?: any[];
  investments?: any[];
  savings?: any[];
  onOpenAddExpense: () => void;
  onOpenAddIncome?: () => void;
  onNavigateToTab: (tab: string) => void;
  onOpenScanReceipt?: () => void;
  onOpenWizard?: () => void;
  onOpenOnboarding?: () => void;
  onAddIncome?: (data: { title: string; amount: number }) => Promise<void>;
}

export const FinanceHomePage: React.FC<FinanceHomePageProps> = ({
  user,
  upcomingTimeline = [],
  expenses = [],
  userSettings,
  incomes = [],
  emis = [],
  investments = [],
  savings = [],
  onOpenAddExpense,
  onOpenAddIncome,
  onNavigateToTab,
  onOpenScanReceipt,
  onOpenOnboarding,
  onAddIncome,
}) => {
  const [dailyBrief, setDailyBrief] = useState<any>(null);
  const [budgetInsights, setBudgetInsights] = useState<any>(null);

  // Add Income modal state
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [incomeTitle, setIncomeTitle] = useState('Salary');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [isSubmittingIncome, setIsSubmittingIncome] = useState(false);
  const [incomeError, setIncomeError] = useState<string | null>(null);

  useEffect(() => {
    SpendTrackApi.getDailyBrief()
      .then(setDailyBrief)
      .catch((err) => console.warn('Daily brief fetch notice:', err));

    SpendTrackApi.getBudgetInsights()
      .then(setBudgetInsights)
      .catch((err) => console.warn('Budget insights fetch notice:', err));
  }, [expenses, incomes]);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Member');

  // --- Real User Financial Metrics ---
  const monthlyBudget =
    Number(userSettings?.monthlyBudget) ||
    Number(budgetInsights?.totalBudget) ||
    0;

  const totalSpent = expenses.reduce(
    (sum, e) => sum + (Number(e.totalPrice) || Number(e.amount) || 0),
    0
  );

  const remainingBudget = monthlyBudget > 0 ? monthlyBudget - totalSpent : 0;

  const percentageUsed =
    monthlyBudget > 0
      ? Math.min(100, Math.round((totalSpent / monthlyBudget) * 100))
      : 0;

  // Days in month calculation for daily safe spend
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1);
  const dailySafeSpend = remainingBudget > 0 ? Math.round(remainingBudget / remainingDays) : 0;

  // Combine real user transactions (expenses + incomes) sorted by date desc
  const formattedExpenses = expenses.map((e) => ({
    id: e.id || `exp_${Math.random()}`,
    type: 'expense' as const,
    title: e.merchant || e.itemName || e.title || 'Expense',
    category: e.category || 'General',
    amount: Number(e.totalPrice) || Number(e.amount) || 0,
    date: e.spentAt || e.purchaseDate || e.createdAt || new Date().toISOString(),
  }));

  const formattedIncomes = incomes.map((i) => ({
    id: i.id || `inc_${Math.random()}`,
    type: 'income' as const,
    title: i.title || i.source || 'Income Credit',
    category: 'Income',
    amount: Number(i.amount) || 0,
    date: i.createdAt || i.date || new Date().toISOString(),
  }));

  const recentTransactions = [...formattedExpenses, ...formattedIncomes]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Synthesize upcoming commitments from real user timeline / EMIs
  const upcomingCommitments =
    upcomingTimeline.length > 0
      ? upcomingTimeline.slice(0, 4)
      : (emis || []).map((emi) => ({
          id: emi.id,
          title: `${emi.title}${emi.bank ? ` (${emi.bank})` : ''}`,
          amount: Number(emi.amount) || 0,
          date: `Due on day ${emi.dueDay}`,
          category: 'Loan EMI',
          type: 'EMI',
        })).slice(0, 4);

  const handleSaveIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(incomeAmount);
    if (!incomeTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setIncomeError('Please enter a valid title and positive amount.');
      return;
    }

    if (!onAddIncome) {
      setIncomeError('Income saving service is unavailable.');
      return;
    }

    setIsSubmittingIncome(true);
    setIncomeError(null);
    try {
      await onAddIncome({ title: incomeTitle.trim(), amount: parsedAmount });
      setIsAddIncomeOpen(false);
      setIncomeTitle('Salary');
      setIncomeAmount('');
    } catch (err: any) {
      setIncomeError(err.message || 'Failed to save income.');
    } finally {
      setIsSubmittingIncome(false);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header & Primary Action                                    */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="p-4 sm:p-5 rounded-[28px] bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-slate-900/40 border border-emerald-500/20 flex items-center justify-between gap-3 shadow-xs"
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
            Hello, {displayName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Track your spending, budget, and upcoming commitments.
          </p>
        </div>

        {/* Prominent Primary Action: + Add Expense */}
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Expense</span>
        </button>
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Monthly Budget Summary Card (Primary Financial Metrics)   */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="p-5 rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Card Header: Title & Target Action */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                MONTHLY BUDGET
              </h2>
              <span className="text-[10px] text-slate-400">
                {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {monthlyBudget > 0 ? (
            <span
              className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-full border ${
                percentageUsed >= 100
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : percentageUsed >= 80
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {percentageUsed}% Used
            </span>
          ) : (
            onOpenOnboarding && (
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-600/80 hover:bg-emerald-500 text-white transition-all cursor-pointer border border-emerald-400/40"
              >
                Set Target
              </button>
            )
          )}
        </div>

        {/* 3 Core KPI Metrics */}
        <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-4">
          {/* KPI 1: Monthly Budget */}
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Budget Target
            </span>
            <p className="text-sm sm:text-base font-black text-white tracking-tight truncate mt-0.5 font-mono">
              {monthlyBudget > 0 ? formatCurrency(monthlyBudget) : 'Not Set'}
            </p>
          </div>

          {/* KPI 2: Spent */}
          <div className="min-w-0 border-x border-slate-800/80 px-2">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block truncate">
              Spent
            </span>
            <p className="text-sm sm:text-base font-black text-rose-300 tracking-tight truncate mt-0.5 font-mono">
              {formatCurrency(totalSpent)}
            </p>
          </div>

          {/* KPI 3: Remaining Budget */}
          <div className="min-w-0 pl-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block truncate">
              Remaining
            </span>
            <p
              className={`text-sm sm:text-base font-black tracking-tight truncate mt-0.5 font-mono ${
                remainingBudget < 0 ? 'text-rose-400' : 'text-emerald-300'
              }`}
            >
              {formatCurrency(remainingBudget)}
            </p>
          </div>
        </div>

        {/* Progress Bar Indicator */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                percentageUsed >= 100
                  ? 'from-rose-600 to-red-500'
                  : percentageUsed >= 80
                  ? 'from-amber-500 to-orange-500'
                  : 'from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(4, percentageUsed))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {monthlyBudget > 0
                ? `${formatCurrency(totalSpent)} of ${formatCurrency(monthlyBudget)}`
                : 'Budget unconfigured'}
            </span>
            {remainingBudget > 0 && (
              <span className="text-emerald-400 font-semibold">
                {formatCurrency(dailySafeSpend)}/day safe spend
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Quick Actions                                             */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-2">
        <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Action 1: + Expense */}
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="p-3 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[72px] group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate w-full">
              + Expense
            </span>
          </button>

          {/* Action 2: + Income */}
          <button
            type="button"
            onClick={() => {
              if (onOpenAddIncome) {
                onOpenAddIncome();
              } else {
                setIsAddIncomeOpen(true);
              }
            }}
            className="p-3 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[72px] group"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate w-full">
              + Income
            </span>
          </button>

          {/* Action 3: Scan Receipt */}
          <button
            type="button"
            onClick={onOpenScanReceipt}
            className="p-3 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-purple-500/50 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[72px] group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Camera className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate w-full">
              Scan Receipt
            </span>
          </button>

          {/* Action 4: Vault */}
          <button
            type="button"
            onClick={() => onNavigateToTab('wallet')}
            className="p-3 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500/50 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[72px] group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <QrCode className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate w-full">
              Vault
            </span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. AI Insight / Daily Brief                                   */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="p-4 rounded-[24px] bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 text-white shadow-lg relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              AI Daily Brief
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
            SpendTrack AI
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {dailyBrief?.summary ||
            dailyBrief?.brief ||
            (monthlyBudget > 0
              ? `You have spent ${formatCurrency(totalSpent)} of your ${formatCurrency(
                  monthlyBudget
                )} budget (${percentageUsed}%). You have ${formatCurrency(
                  remainingBudget
                )} remaining for the next ${remainingDays} days (${formatCurrency(
                  dailySafeSpend
                )}/day).`
              : `You have recorded ${formatCurrency(
                  totalSpent
                )} in outlays across ${expenses.length} transactions. Configure a monthly budget target to receive personalized daily spend allowances.`)}
        </p>

        {dailyBrief?.recommendation && (
          <div className="mt-2.5 pt-2.5 border-t border-purple-500/20 flex items-center gap-2 text-[11px] text-purple-300 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{dailyBrief.recommendation}</span>
          </div>
        )}
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 5. Recent Transactions & Upcoming Commitments Grid (Desktop 2-Col) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              Recent Transactions
            </h3>
            <button
              type="button"
              onClick={() => onNavigateToTab('expenses')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer min-h-[36px] px-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        isIncome
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {tx.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {tx.category} • {formatDateLabel(tx.date)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-black text-xs font-mono shrink-0 ml-2 ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-1">
            <Receipt className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No recent transactions recorded
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tap "+ Add Expense" above to log your first transaction.
            </p>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. Upcoming Commitments                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            Upcoming Commitments
          </h3>
          <button
            type="button"
            onClick={() => onNavigateToTab('planner')}
            className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer min-h-[36px] px-1"
          >
            <span>View Plan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingCommitments.length > 0 ? (
          <div className="space-y-2">
            {upcomingCommitments.map((item: any, idx: number) => {
              const title = item.title || item.name || 'Upcoming Bill';
              const amt = Number(item.amount) || 0;
              const dateLabel = item.dueDate || item.date || item.dateStr || 'Scheduled';
              const categoryLabel = item.category || item.type || 'Bill';

              return (
                <div
                  key={item.id || `up_${idx}`}
                  className="p-3.5 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-500 inline shrink-0" />
                        <span>{dateLabel} • {categoryLabel}</span>
                      </p>
                    </div>
                  </div>

                  <span className="font-black text-xs text-slate-900 dark:text-white font-mono shrink-0 ml-2">
                    {formatCurrency(amt)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-1">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No upcoming commitments scheduled
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Add recurring bills or EMIs in Plan to track future outlays.
            </p>
          </div>
        )}
      </div>
    </div>

      {/* ------------------------------------------------------------- */}
      {/* Add Income Modal Overlay                                      */}
      {/* ------------------------------------------------------------- */}
      {isAddIncomeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsAddIncomeOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-[380px] rounded-[24px] p-5 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Add Income Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddIncomeOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {incomeError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{incomeError}</span>
              </div>
            )}

            <form onSubmit={handleSaveIncomeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Income Title / Source
                </label>
                <input
                  type="text"
                  value={incomeTitle}
                  onChange={(e) => setIncomeTitle(e.target.value)}
                  placeholder="e.g. Salary, Freelance, Bonus"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddIncomeOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIncome}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingIncome ? 'Saving...' : 'Save Income'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
