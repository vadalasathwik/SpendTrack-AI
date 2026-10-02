import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Edit3,
  Calendar,
  X,
  PieChart,
  Plus,
  ShoppingBag,
  Utensils,
  Fuel,
  FileText,
  CreditCard,
  Award,
  ShieldCheck,
  Check,
  Tag,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';
import { formatCurrency } from '../utils/calculations.js';
import { Expense, UserSettings } from '../types.js';

interface BudgetSummary {
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface BudgetDashboardPageProps {
  expenses?: Expense[];
  userSettings?: UserSettings;
  onOpenAddExpense?: () => void;
  onOpenOnboarding?: () => void;
}

export const BudgetDashboardPage: React.FC<BudgetDashboardPageProps> = ({
  expenses = [],
  userSettings,
  onOpenAddExpense,
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [summary, setSummary] = useState<BudgetSummary>({
    budget: 0,
    spent: 0,
    remaining: 0,
    percentage: 0,
  });
  const [envelopeData, setEnvelopeData] = useState<any>(null);
  const [, setCategoryBudgets] = useState<any[]>([]);

  // Set Budget Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [isSavingBudget, setIsSavingBudget] = useState<boolean>(false);

  const fetchSummary = async () => {
    try {
      const [summaryRes, envRes, catBudgetsRes] = await Promise.all([
        SpendTrackApi.getBudgetSummary(selectedMonth, selectedYear).catch(() => null),
        SpendTrackApi.getEnvelopes(selectedMonth, selectedYear).catch(() => null),
        SpendTrackApi.getCategoryBudgets(selectedMonth, selectedYear).catch(() => []),
      ]);

      if (summaryRes) {
        setSummary(summaryRes);
      }
      if (envRes) {
        setEnvelopeData(envRes);
      }
      if (Array.isArray(catBudgetsRes)) {
        setCategoryBudgets(catBudgetsRes);
      }
    } catch (err: any) {
      console.error('Failed to fetch budget summary:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth, selectedYear, expenses.length]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount < 0) return;

    setIsSavingBudget(true);
    try {
      await SpendTrackApi.setBudget(amount, selectedMonth, selectedYear);
      setIsEditModalOpen(false);
      await fetchSummary();
    } catch (err: any) {
      alert(err.message || 'Failed to save budget.');
    } finally {
      setIsSavingBudget(false);
    }
  };

  // Real-time client expenses calculation for selected month
  const clientMonthExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const d = new Date(exp.spentAt || exp.purchaseDate || exp.createdAt || '');
      return !isNaN(d.getTime()) && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const clientTotalSpent = useMemo(() => {
    return clientMonthExpenses.reduce(
      (sum, e) => sum + (Number(e.totalPrice) || Number(e.amount) || 0),
      0
    );
  }, [clientMonthExpenses]);

  // Effective budget metrics
  const effectiveBudget = summary.budget > 0 ? summary.budget : (Number(userSettings?.monthlyBudget) || 0);
  const effectiveSpent = Math.max(summary.spent, clientTotalSpent);
  const effectiveRemaining = effectiveBudget > 0 ? effectiveBudget - effectiveSpent : 0;
  const effectivePercentage = effectiveBudget > 0 ? Math.min(100, Math.round((effectiveSpent / effectiveBudget) * 100)) : 0;

  const monthName = MONTH_NAMES[selectedMonth - 1];

  // Helper for category display names
  const cleanCategoryName = (rawName: string) => {
    if (rawName === 'Groceries & Food') return 'Groceries';
    if (rawName === 'Fuel & Transport') return 'Fuel';
    if (rawName === 'Shopping & Lifestyle') return 'Shopping';
    if (rawName === 'Utility Bills & Internet') return 'Bills & Utilities';
    if (rawName === 'EMI & Loan Obligations') return 'Loan EMIs';
    if (rawName === 'Gold & Metal Accumulation') return 'Gold & Metal';
    if (rawName === 'Emergency Liquidity Buffer') return 'Emergency Buffer';
    if (rawName === 'Entertainment & Dining Out') return 'Dining & Entertainment';
    return rawName;
  };

  // Helper for category icons
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('groc') || lower.includes('food')) return <ShoppingBag className="w-5 h-5 text-emerald-400" />;
    if (lower.includes('fuel') || lower.includes('transport')) return <Fuel className="w-5 h-5 text-amber-400" />;
    if (lower.includes('shop')) return <ShoppingBag className="w-5 h-5 text-purple-400" />;
    if (lower.includes('bill') || lower.includes('util')) return <FileText className="w-5 h-5 text-blue-400" />;
    if (lower.includes('emi') || lower.includes('loan')) return <CreditCard className="w-5 h-5 text-rose-400" />;
    if (lower.includes('gold') || lower.includes('metal')) return <Award className="w-5 h-5 text-yellow-400" />;
    if (lower.includes('emer') || lower.includes('buffer')) return <ShieldCheck className="w-5 h-5 text-cyan-400" />;
    if (lower.includes('din') || lower.includes('enter')) return <Utensils className="w-5 h-5 text-pink-400" />;
    return <Tag className="w-5 h-5 text-emerald-400" />;
  };

  // Process envelope data
  const rawEnvelopes: any[] = envelopeData?.envelopes || [];
  const processedCategoryProgress = useMemo(() => {
    if (rawEnvelopes.length > 0) {
      return rawEnvelopes.map((env: any) => {
        const displayName = cleanCategoryName(env.name);

        const clientCatSpent = clientMonthExpenses
          .filter((exp) => {
            const cat = (exp.category || '').toLowerCase();
            const item = (exp.itemName || exp.merchant || '').toLowerCase();
            const displayNameLower = displayName.toLowerCase();
            return cat.includes(displayNameLower) || item.includes(displayNameLower);
          })
          .reduce((sum, e) => sum + (Number(e.totalPrice) || Number(e.amount) || 0), 0);

        const spent = Math.max(Number(env.spent) || 0, clientCatSpent);
        const allocated = Number(env.allocated) || 0;
        const remaining = allocated - spent;
        const progress = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : (spent > 0 ? 100 : 0);

        return {
          id: env.id || env.name,
          rawName: env.name,
          displayName,
          spent,
          allocated,
          remaining,
          progress,
        };
      });
    }

    const defaults = [
      { rawName: 'Groceries & Food', displayName: 'Groceries', allocated: 7000 },
      { rawName: 'Fuel & Transport', displayName: 'Fuel', allocated: 4000 },
      { rawName: 'Shopping & Lifestyle', displayName: 'Shopping', allocated: 3000 },
      { rawName: 'Utility Bills & Internet', displayName: 'Bills & Utilities', allocated: 3500 },
      { rawName: 'Entertainment & Dining Out', displayName: 'Dining & Entertainment', allocated: 2500 },
    ];

    return defaults.map((d) => {
      const clientCatSpent = clientMonthExpenses
        .filter((exp) => {
          const cat = (exp.category || '').toLowerCase();
          const item = (exp.itemName || exp.merchant || '').toLowerCase();
          const dLower = d.displayName.toLowerCase();
          return cat.includes(dLower) || item.includes(dLower);
        })
        .reduce((sum, e) => sum + (Number(e.totalPrice) || Number(e.amount) || 0), 0);

      const spent = clientCatSpent;
      const allocated = d.allocated;
      const remaining = allocated - spent;
      const progress = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

      return {
        id: d.displayName,
        rawName: d.rawName,
        displayName: d.displayName,
        spent,
        allocated,
        remaining,
        progress,
      };
    });
  }, [rawEnvelopes, clientMonthExpenses]);

  return (
    <div className="space-y-6 pb-28 max-w-2xl mx-auto animate-in fade-in duration-200">
      {/* Top Header & Month Filter */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
            <PieChart className="w-3.5 h-3.5" />
            <span>Budget Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Monthly Budget
          </h1>
        </div>

        {/* Month Selector Pills */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-xs">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer font-bold"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer font-bold"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. Primary Summary Card                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-white shadow-xl space-y-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400">
              {monthName} Budget
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Overall monthly allocation & spending status
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setBudgetInput(effectiveBudget > 0 ? String(effectiveBudget) : '');
              setIsEditModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{effectiveBudget > 0 ? 'Edit Target' : 'Set Target'}</span>
          </button>
        </div>

        {/* 3 Core KPI Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-center">
          {/* KPI 1: October Budget */}
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">
              {monthName} Budget
            </span>
            <p className="text-base sm:text-lg font-black text-white tracking-tight truncate mt-1 font-mono">
              {effectiveBudget > 0 ? formatCurrency(effectiveBudget) : '₹0'}
            </p>
          </div>

          {/* KPI 2: Spent */}
          <div className="min-w-0 border-x border-slate-800/90 px-1">
            <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider block truncate">
              Spent
            </span>
            <p className="text-base sm:text-lg font-black text-rose-300 tracking-tight truncate mt-1 font-mono">
              {formatCurrency(effectiveSpent)}
            </p>
          </div>

          {/* KPI 3: Remaining */}
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block truncate">
              Remaining
            </span>
            <p
              className={`text-base sm:text-lg font-black tracking-tight truncate mt-1 font-mono ${
                effectiveRemaining < 0 ? 'text-rose-400' : 'text-emerald-300'
              }`}
            >
              {formatCurrency(effectiveRemaining)}
            </p>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300">Overall Usage</span>
            <span
              className={`font-mono px-2 py-0.5 rounded-full border text-[11px] ${
                effectivePercentage >= 100
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : effectivePercentage >= 80
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {effectivePercentage}% Used
            </span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                effectivePercentage >= 100
                  ? 'bg-gradient-to-r from-rose-500 to-rose-400 shadow-rose-500/50'
                  : effectivePercentage >= 80
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-amber-500/50'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-emerald-500/50'
              }`}
              style={{ width: `${Math.min(100, effectivePercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Category / Envelope Progress List                           */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              Category Allocations & Progress
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live breakdown of spent vs allocated amounts by category
            </p>
          </div>
          {onOpenAddExpense && (
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>
          )}
        </div>

        {/* List of Category Progress Cards */}
        <div className="space-y-2.5">
          {processedCategoryProgress.map((item) => {
            const isOverspent = item.remaining < 0;
            return (
              <div
                key={item.id}
                className="p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item.displayName)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
                        {item.displayName}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                        {item.allocated > 0
                          ? isOverspent
                            ? `Over budget by ${formatCurrency(Math.abs(item.remaining))}`
                            : `${formatCurrency(item.remaining)} remaining`
                          : 'No category limit set'}
                      </p>
                    </div>
                  </div>

                  {/* Spending vs Allocated Ratio (e.g. ₹5,200 / ₹7,000) */}
                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono tracking-tight">
                      {formatCurrency(item.spent)}{' '}
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">
                        / {item.allocated > 0 ? formatCurrency(item.allocated) : '∞'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
                        item.progress >= 100
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : item.progress >= 80
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.progress}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.progress >= 100
                        ? 'bg-rose-500'
                        : item.progress >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, item.progress)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Edit Overall Budget Limit Modal                            */}
      {/* ------------------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsEditModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-[24px] p-5 space-y-4 shadow-2xl z-10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Set {monthName} Budget Target
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Target Amount (₹)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    required
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    placeholder="40000"
                    className="w-full pl-8 pr-3.5 py-2.5 text-base font-black border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBudget}
                  className="px-5 py-2 text-xs font-extrabold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[40px]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSavingBudget ? 'Saving...' : 'Save Target'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
