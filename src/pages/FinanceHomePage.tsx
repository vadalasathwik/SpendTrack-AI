import React from 'react';
import {
  TrendingUp,
  CreditCard,
  PiggyBank,
  DollarSign,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Activity,
} from 'lucide-react';
import {
  CashFlowCurrent,
  UpcomingReminder,
  Expense,
  DateRange,
  UserSettings,
} from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { MetricCard } from '../components/ui/MetricCard.js';

interface FinanceHomePageProps {
  user: any;
  cashFlow: CashFlowCurrent;
  upcomingTimeline: UpcomingReminder[];
  expenses: Expense[];
  dateRange: DateRange;
  userSettings?: UserSettings;
  onOpenAddExpense: () => void;
  onNavigateToTab: (tab: string) => void;
  onOpenScanReceipt?: () => void;
}

function getGreetingTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function calculateHealthScore(cashFlow: CashFlowCurrent): { score: number; colorClass: string; statusLabel: string } {
  let score = 70; // baseline

  // Savings Rate contribution (ideal >= 20%)
  if (cashFlow.savingRate >= 30) score += 15;
  else if (cashFlow.savingRate >= 20) score += 10;
  else if (cashFlow.savingRate < 10) score -= 15;

  // EMI Ratio penalty (ideal <= 40%)
  if (cashFlow.emiRatio > 50) score -= 20;
  else if (cashFlow.emiRatio > 40) score -= 10;
  else if (cashFlow.emiRatio <= 30 && cashFlow.emiRatio > 0) score += 10;

  // Free Cash safety check
  if (cashFlow.freeCash > 0) score += 5;
  else score -= 20;

  score = Math.max(10, Math.min(100, score));

  let colorClass = 'text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60';
  let statusLabel = 'Excellent Health';

  if (score < 50) {
    colorClass = 'text-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-950/60';
    statusLabel = 'Needs Attention';
  } else if (score <= 75) {
    colorClass = 'text-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-950/60';
    statusLabel = 'Moderate Health';
  }

  return { score, colorClass, statusLabel };
}

export const FinanceHomePage: React.FC<FinanceHomePageProps> = ({
  user,
  cashFlow,
  upcomingTimeline,
  onOpenAddExpense,
  onNavigateToTab,
  onOpenScanReceipt,
}) => {
  const greeting = getGreetingTime();
  const userName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'Friend';
  const monthName = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const health = calculateHealthScore(cashFlow);

  return (
    <div className="space-y-8 pb-16 max-w-[1440px] mx-auto" id="finance-home-page-container">
      {/* 1. GREETING HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              Personal Finance OS
            </span>
            <span className="text-xs font-semibold text-slate-400">• {monthName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {greeting}, {userName}! 👋
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Your automated monthly financial command center & notebook.
          </p>
        </div>

        {/* 2. FINANCIAL HEALTH SCORE BADGE */}
        <div className={`p-4 rounded-[20px] border flex items-center gap-3.5 shrink-0 ${health.colorClass}`}>
          <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center text-lg font-black shrink-0">
            {health.score}
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-80">
              Financial Health
            </span>
            <span className="text-sm font-extrabold block">{health.statusLabel}</span>
          </div>
        </div>
      </div>

      {/* AI DAILY BRIEF CARD */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 p-6 rounded-[24px] border border-violet-500/30 shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-violet-300 font-extrabold text-sm">
            <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
            <span>AI Daily CFO Brief</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
            Live Intelligence
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
          {greeting} {userName}. Here is your automated financial briefing for {monthName}:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-violet-500/20 text-xs">
            <span className="text-slate-400 block text-[10px]">Safe Daily Spend</span>
            <span className="text-emerald-400 font-extrabold text-sm">
              ₹{Math.max(0, Math.round(cashFlow.freeCash / Math.max(1, 30 - new Date().getDate()))).toLocaleString('en-IN')}/day
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-violet-500/20 text-xs">
            <span className="text-slate-400 block text-[10px]">Saving Velocity</span>
            <span className="text-blue-400 font-extrabold text-sm">{cashFlow.savingRate}% of income</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-violet-500/20 text-xs">
            <span className="text-slate-400 block text-[10px]">Upcoming EMI Commitments</span>
            <span className="text-purple-400 font-extrabold text-sm">₹{cashFlow.emi.toLocaleString('en-IN')}/mo</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-violet-500/20 text-xs">
            <span className="text-slate-400 block text-[10px]">Uncommitted Surplus</span>
            <span className="text-amber-400 font-extrabold text-sm">₹{cashFlow.freeCash.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* 5. QUICK ADD BUTTONS */}
      <div className="bg-slate-900 text-white p-5 rounded-[20px] border border-slate-800 shadow-xl flex items-center justify-between gap-3 overflow-x-auto">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 shrink-0 hidden sm:inline">
          Quick Actions:
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={onOpenAddExpense}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-[12px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Expense</span>
          </button>
          {onOpenScanReceipt && (
            <button
              onClick={onOpenScanReceipt}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-[12px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>+ Scan Receipt</span>
            </button>
          )}
          <button
            onClick={() => onNavigateToTab('notebook')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-[12px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all"
          >
            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
            <span>+ EMI</span>
          </button>
          <button
            onClick={() => onNavigateToTab('notebook')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-[12px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>+ SIP</span>
          </button>
          <button
            onClick={() => onNavigateToTab('notebook')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-[12px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all"
          >
            <PiggyBank className="w-3.5 h-3.5 text-amber-400" />
            <span>+ RD</span>
          </button>
          <button
            onClick={() => onNavigateToTab('notebook')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-[12px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ Note</span>
          </button>
          <button
            onClick={() => onNavigateToTab('notifications')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-[12px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all"
          >
            <Bell className="w-3.5 h-3.5 text-rose-400" />
            <span>+ Reminder</span>
          </button>
        </div>
      </div>

      {/* 3. INCOME VS EXPENSES SUMMARY CARDS (5 KPI METRICS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Monthly Income */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Monthly Income</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white block">
            {formatCurrency(cashFlow.income)}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">Total Monthly Inflow</span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Expenses</span>
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400 block">
            {formatCurrency(cashFlow.expenses + cashFlow.emi)}
          </span>
          <span className="text-[10px] text-rose-500 font-semibold">
            EMI Ratio: {cashFlow.emiRatio}%
          </span>
        </div>

        {/* Investments */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Investments (SIP)</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 block">
            {formatCurrency(cashFlow.investments)}
          </span>
          <span className="text-[10px] text-blue-500 font-semibold">Wealth Building</span>
        </div>

        {/* Savings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Savings (RD/FD)</span>
            <PiggyBank className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 block">
            {formatCurrency(cashFlow.savings)}
          </span>
          <span className="text-[10px] text-amber-500 font-semibold">
            Saving Rate: {cashFlow.savingRate}%
          </span>
        </div>

        {/* Remaining Cash */}
        <div className="bg-emerald-50 dark:bg-emerald-950/60 p-5 rounded-[20px] border border-emerald-200 dark:border-emerald-800/60 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span>Free Cash Surplus</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl font-black text-emerald-900 dark:text-emerald-200 block">
            {formatCurrency(cashFlow.freeCash)}
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
            Available Surplus
          </span>
        </div>
      </div>

      {/* 4. UPCOMING DUE TIMELINE (NEXT 10 ITEMS) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Upcoming Due Timeline (Next 7-10 Days)</span>
          </h2>
          <button
            onClick={() => onNavigateToTab('planner')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View Monthly Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingTimeline.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {upcomingTimeline.slice(0, 10).map((item) => {
              let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
              if (item.daysLeft <= 0) badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300';
              else if (item.daysLeft <= 2) badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-[16px] bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0">
                      {item.type}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Due: {item.dueDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    {item.amount !== undefined && (
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                      {item.daysLeft <= 0 ? 'Due Today' : `In ${item.daysLeft} d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs font-semibold text-slate-400">
            No upcoming bills or reminders due within the next 7 days.
          </div>
        )}
      </div>
    </div>
  );
};
