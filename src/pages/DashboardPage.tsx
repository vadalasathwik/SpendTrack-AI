import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Target,
  ArrowRight,
  Clock,
  Loader2,
  Bell,
  ExternalLink,
} from 'lucide-react';
import { Expense, DateRange, MonthlyItem, RecurringExpense, ConsumptionLog, UserSettings } from '../types.js';
import {
  calculateCategoryTotals,
  filterExpensesByDateRange,
  formatCurrency,
  generateConsumptionInsights,
  calculateBudgetMetrics,
} from '../utils/calculations.js';
import { formatDisplayDate } from '../utils/dateRanges.js';
import { CATEGORY_COLORS } from '../data/defaults.js';
import { getCalendarUrl } from '../utils/calendar.js';

interface DashboardPageProps {
  expenses: Expense[];
  dateRange: DateRange;
  monthlyItems?: MonthlyItem[];
  recurringExpenses?: RecurringExpense[];
  consumptionLogs?: ConsumptionLog[];
  userSettings?: UserSettings;
  onOpenAddExpense: () => void;
  onOpenScanReceipt?: () => void;
  onViewExpenseHistory: () => void;
  onViewMonthlyItems?: () => void;
  onViewRecurringBills?: () => void;
  onSelectItemAnalytics: (itemName: string) => void;
  onOpenAIWithQuestion?: (question: string) => void;
  onQuickAddFromItem?: (item: MonthlyItem) => void;
  onOpenConsumeModal?: (item: MonthlyItem) => void;
  onOpenSettings?: () => void;
  onMarkAsPaid?: (bill: RecurringExpense) => Promise<void> | void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  expenses,
  dateRange,
  recurringExpenses = [],
  userSettings,
  onViewExpenseHistory,
  onViewRecurringBills,
  onSelectItemAnalytics,
  onOpenAIWithQuestion,
  onMarkAsPaid,
}) => {
  const [payingBillId, setPayingBillId] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Filtered expenses for active date range
  const filteredExpenses = React.useMemo(() => {
    return filterExpensesByDateRange(expenses, dateRange.startDate, dateRange.endDate);
  }, [expenses, dateRange.startDate, dateRange.endDate]);

  // Daily Spending Trend Data
  const spendingTrend = React.useMemo(() => {
    const trendMap: Record<string, number> = {};
    for (const exp of filteredExpenses) {
      if (exp.purchaseDate) {
        const dateKey = exp.purchaseDate.split('T')[0];
        trendMap[dateKey] = (trendMap[dateKey] || 0) + (Number(exp.totalPrice) || 0);
      }
    }

    const sortedTrendDates = Object.keys(trendMap).sort();
    return sortedTrendDates.map((date) => ({
      date,
      displayDate: formatDisplayDate(date),
      amount: trendMap[date],
    }));
  }, [filteredExpenses]);

  // Generate top deterministic insight
  const topInsight = React.useMemo(() => {
    const insights = generateConsumptionInsights(expenses);
    return insights.length > 0
      ? insights[0]
      : {
          title: 'Smart Spending Insight',
          description: 'Groceries & Utilities account for the bulk of your recent variable spending. Consider automated limits.',
        };
  }, [expenses]);

  // Unpaid Recurring Bills
  const unpaidBills = React.useMemo(() => {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    return recurringExpenses.filter(
      (r) => r.isActive !== false && r.lastGeneratedMonth !== currentMonthStr
    );
  }, [recurringExpenses]);

  // Single Next Reminder Payment
  const nextReminderPayment = React.useMemo(() => {
    if (unpaidBills.length === 0) return null;
    const currentDay = new Date().getDate();
    return [...unpaidBills].sort((a, b) => {
      const dayA = a.dueDay || 1;
      const dayB = b.dueDay || 1;
      const diffA = dayA >= currentDay ? dayA - currentDay : dayA + 31 - currentDay;
      const diffB = dayB >= currentDay ? dayB - currentDay : dayB + 31 - currentDay;
      return diffA - diffB;
    })[0];
  }, [unpaidBills]);

  const formatNextReminderTime = React.useCallback((item: RecurringExpense) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowObj = new Date(today);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

    const reminderDateStr = item.reminderDate || item.dueDate || '';
    const time24 = item.reminderTime || '20:00';

    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) h = 20;
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const time12 = `${h}:${m} ${ampm}`;

    if (reminderDateStr === todayStr) {
      return `Today · ${time12}`;
    } else if (reminderDateStr === tomorrowStr) {
      return `Tomorrow · ${time12}`;
    } else if (reminderDateStr) {
      const d = new Date(reminderDateStr + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${monthNames[d.getMonth()]} · ${time12}`;
      }
    }
    return `Due ${item.dueDay || 1}th · ${time12}`;
  }, []);

  // Recent 5 Expenses
  const recentExpenses = React.useMemo(() => {
    return [...filteredExpenses]
      .sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || ''))
      .slice(0, 5);
  }, [filteredExpenses]);

  // Budget Overview Metrics
  const budgetMetrics = React.useMemo(() => {
    return calculateBudgetMetrics(expenses, userSettings, dateRange);
  }, [expenses, userSettings, dateRange]);

  const currencySymbol = userSettings?.currencySymbol || '₹';

  const handlePayBill = async (bill: RecurringExpense) => {
    if (!onMarkAsPaid) return;
    setPayingBillId(bill.id);
    try {
      await onMarkAsPaid(bill);
      showToast('✓ Bill marked as paid');
    } catch (err) {
      console.error('Failed to pay bill:', err);
      showToast('Unable to update bill.');
    } finally {
      setPayingBillId(null);
    }
  };

  // Savings goal metrics (20% surplus target)
  const savingsTarget = (userSettings?.monthlyBudget || 50000) * 0.2;
  const currentSavings = Math.max(0, budgetMetrics.remainingBudget);
  const savingsProgress = Math.min(100, Math.round((currentSavings / (savingsTarget || 1)) * 100));

  return (
    <div className="space-y-6 pb-12" id="dashboard-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-[14px] shadow-xl border border-slate-800 flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
      {/* SECTION 1: REMAINING BUDGET HERO */}
      <section id="section-remaining-budget-hero" className="hero-emerald-gradient text-white rounded-[20px] p-4 sm:p-6 lg:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between gap-5 border border-emerald-500/30 w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col space-y-4 z-10 w-full">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                Remaining Budget
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {dateRange.label}
              </span>
            </div>
            <div className="text-[28px] sm:text-4xl lg:text-5xl font-black tracking-tight text-white mt-1">
              {formatCurrency(budgetMetrics.remainingBudget, currencySymbol)}
            </div>
          </div>

          <div className="space-y-2 w-full">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-200 w-full">
              <span>Spent {formatCurrency(budgetMetrics.totalSpent, currencySymbol)}</span>
              <span className="text-right">Target {formatCurrency(budgetMetrics.monthlyBudget, currencySymbol)}</span>
            </div>
            {/* Budget Progress Bar */}
            <div className="w-full bg-emerald-950/60 h-3 rounded-full overflow-hidden p-0.5 border border-emerald-500/30">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetMetrics.colorState === 'red'
                    ? 'bg-rose-500'
                    : budgetMetrics.colorState === 'orange'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, budgetMetrics.progressPercentage)}%` }}
              />
            </div>
            <div className="text-[11px] font-medium text-slate-300">
              Budget Progress: <strong>{budgetMetrics.progressPercentage}%</strong> used
            </div>
          </div>
        </div>

        {/* Circular Budget Health Score */}
        <div className="flex items-center justify-between sm:justify-start gap-4 z-10 w-full bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-emerald-900/40"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-300 transition-all duration-700 ease-out"
                  strokeDasharray={`${budgetMetrics.budgetHealthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-black text-base sm:text-lg text-white">
                {budgetMetrics.budgetHealthScore}
              </span>
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">
                Health Score
              </div>
              <div className="text-sm font-black text-white">
                {budgetMetrics.budgetHealthScore >= 80 ? 'Excellent' : budgetMetrics.budgetHealthScore >= 60 ? 'On Track' : 'High Burn'}
              </div>
              <div className="text-[11px] text-slate-300">
                Out of 100
              </div>
            </div>
          </div>

          <div className="text-right sm:hidden">
            <div className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">
              Safe Today
            </div>
            <div className="text-sm font-black text-white">
              {formatCurrency(budgetMetrics.dailySafeSpend, currencySymbol)}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SAFE TO SPEND TODAY */}
      <section id="section-safe-to-spend" className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/60">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Safe to Spend Today
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(budgetMetrics.dailySafeSpend, currencySymbol)}
              <span className="text-xs font-normal text-slate-400 ml-1">/ day</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-600 dark:text-slate-300 w-full sm:w-auto justify-center">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="whitespace-nowrap">{budgetMetrics.daysRemaining ?? 30} days remaining in cycle</span>
        </div>
      </section>

      {/* COMPACT NEXT REMINDER WIDGET */}
      {nextReminderPayment && (
        <section id="section-next-reminder" className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Next Reminder</h3>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
              Upcoming
            </span>
          </div>

          <div className="p-4 rounded-[16px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                {nextReminderPayment.name || nextReminderPayment.title}
              </h4>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatNextReminderTime(nextReminderPayment)}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-black text-base text-slate-900 dark:text-white">
                {formatCurrency(nextReminderPayment.amount, currencySymbol)}
              </span>
              <a
                href={getCalendarUrl(nextReminderPayment)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-[12px] shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Open Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: UPCOMING PAYMENTS */}
      <section id="section-upcoming-payments" className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Upcoming Payments</h3>
              <p className="text-[11px] text-slate-400">Keep track of your upcoming monthly payments</p>
            </div>
          </div>
        </div>

        {unpaidBills.length > 0 ? (
          <div className="space-y-2.5">
            {unpaidBills.slice(0, 3).map((bill) => {
              const today = new Date();
              const todayStr = today.toISOString().split('T')[0];
              const tomorrowObj = new Date(today);
              tomorrowObj.setDate(tomorrowObj.getDate() + 1);
              const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

              const dueDateStr = bill.dueDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(bill.dueDay || 1).padStart(2, '0')}`;

              let dayText = `Due ${bill.dueDay || 1}th`;
              if (dueDateStr === todayStr) {
                dayText = 'Today';
              } else if (dueDateStr === tomorrowStr) {
                dayText = 'Tomorrow';
              } else {
                const currentDay = today.getDate();
                const dueDayNum = bill.dueDay || 1;
                if (currentDay > dueDayNum && (!bill.dueDate || bill.dueDate.slice(0, 7) <= todayStr.slice(0, 7))) {
                  dayText = 'Overdue';
                } else {
                  const d = new Date(dueDateStr + 'T00:00:00');
                  if (!isNaN(d.getTime())) {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    dayText = `${d.getDate()} ${monthNames[d.getMonth()]}`;
                  }
                }
              }

              const isPaying = payingBillId === bill.id;

              return (
                <div
                  key={bill.id}
                  className="p-3.5 rounded-[16px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-extrabold text-sm shrink-0">
                      {bill.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {bill.name || bill.title}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {dayText} • {formatCurrency(bill.amount, currencySymbol)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePayBill(bill)}
                    disabled={isPaying}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[14px] shadow-xs flex items-center gap-1 shrink-0 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPaying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Pay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-[14px] border border-emerald-200/60 dark:border-emerald-800/60">
            ✓ All upcoming payments completed for this month!
          </div>
        )}

        {onViewRecurringBills && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={onViewRecurringBills}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all payments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* SECTION 4: SAVINGS GOAL */}
      <section id="section-savings-goal" className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Savings Goal</h3>
              <p className="text-[11px] text-slate-400">Target surplus & monthly reserve goal</p>
            </div>
          </div>
          <span className="text-xs font-black text-teal-600 dark:text-teal-400">
            {savingsProgress}% Achieved
          </span>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${savingsProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>Saved: <strong className="text-slate-900 dark:text-white">{formatCurrency(currentSavings, currencySymbol)}</strong></span>
            <span>Target: <strong className="text-slate-900 dark:text-white">{formatCurrency(savingsTarget, currencySymbol)}</strong></span>
          </div>
        </div>
      </section>

      {/* SECTION 5: ONE AI INSIGHT */}
      <section id="section-ai-insight" className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-[20px] shadow-md border border-slate-700/60 flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
              AI Insight
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-100 line-clamp-2 mt-0.5">
              {topInsight.title}: {topInsight.description}
            </p>
          </div>
        </div>

        {onOpenAIWithQuestion && (
          <button
            onClick={() => onOpenAIWithQuestion('View spend analysis')}
            className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-[14px] cursor-pointer whitespace-nowrap shrink-0 transition-colors flex items-center gap-1"
          >
            <span>View Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </section>

      {/* SECTION 6: MONTHLY TREND */}
      <section id="section-monthly-trend" className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Monthly Trend</h3>
            <p className="text-xs text-slate-400">Daily trajectory for active period</p>
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
                  tickFormatter={(val) => `${currencySymbol}${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`${formatCurrency(Number(val), currencySymbol)}`, 'Daily Total']}
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
            <p className="text-xs">No daily expenditure points recorded yet.</p>
          </div>
        )}
      </section>

      {/* SECTION 7: RECENT EXPENSES */}
      <section id="section-recent-expenses" className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Recent Expenses</h3>
            <p className="text-xs text-slate-400">Latest 5 logged transactions</p>
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
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentExpenses.map((exp) => (
              <div
                key={exp.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-2xs flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[exp.category] || '#64748B' }}
                  >
                    {exp.itemName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectItemAnalytics(exp.itemName)}
                        className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 text-xs sm:text-sm text-left cursor-pointer"
                      >
                        {exp.itemName}
                      </button>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                        {exp.category}
                      </span>
                      {exp.receiptDriveFileId && (
                        <span
                          className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold"
                          title="Receipt saved in Google Drive"
                        >
                          Receipt ✓
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {formatDisplayDate(exp.purchaseDate)}
                      {exp.quantity !== undefined && ` • ${exp.quantity} ${exp.unit || 'unit'}`}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-3">
                  <div className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                    {formatCurrency(exp.totalPrice, currencySymbol)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No transactions logged yet.
          </div>
        )}
      </section>
    </div>
  );
};
