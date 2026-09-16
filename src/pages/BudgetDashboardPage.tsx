import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Edit3,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  PieChart,
  ArrowUpRight,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';

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

export const BudgetDashboardPage: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [summary, setSummary] = useState<BudgetSummary>({
    budget: 0,
    spent: 0,
    remaining: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Budget Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [isSavingBudget, setIsSavingBudget] = useState<boolean>(false);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await SpendTrackApi.getBudgetSummary(selectedMonth, selectedYear);
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to fetch budget summary:', err);
      setError(err.message || 'Failed to load budget summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth, selectedYear]);

  const handleOpenEditModal = () => {
    setBudgetInput(summary.budget > 0 ? String(summary.budget) : '');
    setIsEditModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid positive number for the budget.');
      return;
    }

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

  const formattedMonthYear = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  const isOverBudget = summary.remaining < 0;

  return (
    <div className="space-y-6 pb-20 max-w-[1440px] mx-auto text-slate-100" id="budget-dashboard-container">
      {/* Dark Theme Hero Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[20px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <PieChart className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">Monthly Budget Dashboard</h1>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Prisma Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                PostgreSQL budget tracking, aggregate spend calculations, and burn-rate intelligence
              </p>
            </div>
          </div>

          {/* Controls: Month/Year Selector & Sync */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-[14px] px-3 py-1.5 text-xs font-bold text-white">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <select
                id="budget-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-bold"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1} className="bg-slate-900 text-white">
                    {name}
                  </option>
                ))}
              </select>
              <select
                id="budget-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white focus:outline-none cursor-pointer font-bold"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchSummary}
              disabled={loading}
              className="p-2.5 rounded-[14px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Budget Summary"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              id="edit-budget-btn"
              onClick={handleOpenEditModal}
              className="px-4 py-2.5 rounded-[14px] bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Budget</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-[16px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-rose-500/20 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3 Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
          {/* Card 1: Monthly Budget */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-[20px] p-5 space-y-3 backdrop-blur-xs relative overflow-hidden group hover:border-slate-600 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Monthly Budget ({formattedMonthYear})
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              ₹{summary.budget.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400">
              Allocated spend target saved in PostgreSQL
            </p>
          </div>

          {/* Card 2: Total Spent */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-[20px] p-5 space-y-3 backdrop-blur-xs relative overflow-hidden group hover:border-slate-600 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Total Spent
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              ₹{summary.spent.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400">
              Prisma Aggregate SUM(amount) where type = EXPENSE
            </p>
          </div>

          {/* Card 3: Remaining */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-[20px] p-5 space-y-3 backdrop-blur-xs relative overflow-hidden group hover:border-slate-600 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Remaining
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isOverBudget ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-3xl font-black tracking-tight ${
                isOverBudget ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              ₹{summary.remaining.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400">
              {isOverBudget ? 'Budget limit exceeded!' : 'Safe balance available to spend'}
            </p>
          </div>
        </div>

        {/* Progress Bar & Percentage Section */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-[22px] p-6 space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">Budget Consumption Progress</span>
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                  summary.percentage > 100
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : summary.percentage >= 80
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {summary.percentage}% Used
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              ₹{summary.spent.toLocaleString('en-IN')} of ₹{summary.budget.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.percentage > 100
                  ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-lg shadow-rose-500/50'
                  : summary.percentage >= 80
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-lg shadow-amber-500/50'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/50'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, summary.percentage))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100% Target</span>
          </div>
        </div>
      </div>

      {/* Edit Budget Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsEditModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl border border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">Set Monthly Budget</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Budget Amount for {formattedMonthYear} (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  id="edit-budget-amount-input"
                  placeholder="e.g. 50000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-700 bg-slate-800 text-white rounded-[14px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-[12px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBudget}
                  id="save-budget-modal-btn"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-[12px] shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingBudget ? 'Saving to DB...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
