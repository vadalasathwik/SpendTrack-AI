import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  Receipt,
  PiggyBank,
  CreditCard,
  Plus,
  Camera,
  ArrowUpRight,
  TrendingDown,
  ChevronRight,
  Sparkles,
  QrCode,
  Brain,
  Zap,
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
  onNavigateToTab: (tab: string) => void;
  onOpenScanReceipt?: () => void;
  onOpenWizard?: () => void;
}

export const FinanceHomePage: React.FC<FinanceHomePageProps> = ({
  user,
  cashFlow,
  upcomingTimeline = [],
  expenses = [],
  userSettings,
  incomes = [],
  emis = [],
  savings = [],
  onOpenAddExpense,
  onNavigateToTab,
  onOpenScanReceipt,
}) => {
  const [dailyBrief, setDailyBrief] = useState<any>(null);

  useEffect(() => {
    SpendTrackApi.getDailyBrief()
      .then(setDailyBrief)
      .catch((err) => console.warn('Daily brief fetch notice:', err));
  }, [expenses, incomes]);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Member');

  // Calculations for strictly 4 KPIs
  const totalIncome = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + (Number(e.totalPrice) || Number(e.amount) || 0), 0);
  const totalEmis = emis.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalSavings = savings.reduce((s, st) => s + (Number(st.monthlyContribution) || Number(st.currentAmount) || 0), 0);

  // Available liquid balance (Income - Expense - EMIs)
  const availableBalance = Math.max(0, totalIncome - totalExpense - totalEmis);

  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-5 rounded-[28px] bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome back</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Hello, {displayName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your personal finance intelligence
          </p>
        </div>

        {/* Quick Scan Action */}
        <button
          onClick={onOpenScanReceipt}
          className="p-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Scan Receipt</span>
        </button>
      </motion.div>

      {/* 4 CORE KPI CARDS */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Card 1: Available Balance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="p-4 rounded-[28px] bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 text-white shadow-lg border border-emerald-400/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">Available Balance</span>
            <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatCurrency(availableBalance)}
          </p>
          <span className="text-[10px] text-emerald-200 mt-1 block">Liquid cash after outlays</span>
        </motion.div>

        {/* Card 2: Monthly Spending */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="p-4 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monthly Spend</span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(totalExpense)}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">Logged expenses</span>
        </motion.div>

        {/* Card 3: Savings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="p-4 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Savings</span>
            <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(totalSavings)}
          </p>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mt-1 block">Savings & RDs/FDs</span>
        </motion.div>

        {/* Card 4: Upcoming EMI */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="p-4 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Upcoming EMI</span>
            <div className="w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(totalEmis)}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">Monthly bank EMIs</span>
        </motion.div>
      </div>

      {/* 5. AI DAILY BRIEF CARD */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="p-5 rounded-[28px] bg-gradient-to-r from-purple-900/30 via-slate-900 to-slate-950 border border-purple-500/30 text-white shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">AI Daily Brief</h3>
              <p className="text-[10px] text-purple-300">Live Cashflow Intelligence</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
            Gemini AI
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {dailyBrief?.summary || dailyBrief?.brief || (
            `You have ${formatCurrency(availableBalance)} in available cash buffer after accounting for monthly outlays. Your current monthly burn rate is ${formatCurrency(totalExpense + totalEmis)}.`
          )}
        </p>

        {dailyBrief?.recommendation && (
          <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center gap-2 text-[11px] text-purple-300 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{dailyBrief.recommendation}</span>
          </div>
        )}
      </motion.div>

      {/* Quick Action Buttons Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={onOpenAddExpense}
          className="p-3.5 rounded-[24px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex flex-col items-center text-center cursor-pointer"
        >
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">Add Expense</span>
        </button>

        <button
          onClick={() => onNavigateToTab('wallet')}
          className="p-3.5 rounded-[24px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex flex-col items-center text-center cursor-pointer"
        >
          <div className="w-9 h-9 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-1.5">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">QR Vault</span>
        </button>

        <button
          onClick={() => onNavigateToTab('planner')}
          className="p-3.5 rounded-[24px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex flex-col items-center text-center cursor-pointer"
        >
          <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-1.5">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">Planner</span>
        </button>
      </div>

      {/* Recent Activity List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Activity</h2>
          <button
            onClick={() => onNavigateToTab('expenses')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentExpenses.length > 0 ? (
          <div className="space-y-2">
            {recentExpenses.map((exp) => {
              const name = exp.merchant || exp.itemName || exp.description || 'Expense';
              const amount = Number(exp.totalPrice) || Number(exp.amount) || 0;
              return (
                <div
                  key={exp.id}
                  className="p-3.5 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white">{name}</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{exp.category || 'General'} • {exp.date || 'Today'}</p>
                    </div>
                  </div>
                  <span className="font-black text-xs text-slate-900 dark:text-white font-mono">
                    -{formatCurrency(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500">
            No expenses recorded for this period.
          </div>
        )}
      </div>
    </div>
  );
};
