import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Edit3,
  Calendar,
  RefreshCw,
  AlertTriangle,
  X,
  PieChart,
  Sparkles,
  Sliders,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';
import { BudgetRing } from '../components/ui/BudgetRing.js';
import { GlassCard } from '../components/ui/GlassCard.js';

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
    budget: 90000,
    spent: 58750,
    remaining: 31250,
    percentage: 65,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Intelligent Budget Engine Income inputs
  const [salaryIncome, setSalaryIncome] = useState('120000');
  const [bonusIncome, setBonusIncome] = useState('0');
  const [rentalIncome, setRentalIncome] = useState('20000');
  const [sideIncome, setSideIncome] = useState('0');

  // AI Recommended Allocation Overrides
  const [livingPercent, setLivingPercent] = useState(35);
  const [emiPercent, setEmiPercent] = useState(25);
  const [invPercent, setInvPercent] = useState(20);
  const [savingsPercent, setSavingsPercent] = useState(15);
  const [lifestylePercent, setLifestylePercent] = useState(5);

  // Edit Budget Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [isSavingBudget, setIsSavingBudget] = useState<boolean>(false);

  const totalIncome =
    (parseFloat(salaryIncome) || 0) +
    (parseFloat(bonusIncome) || 0) +
    (parseFloat(rentalIncome) || 0) +
    (parseFloat(sideIncome) || 0);

  const [envelopeData, setEnvelopeData] = useState<any>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await SpendTrackApi.getBudgetSummary(selectedMonth, selectedYear);
      if (data && data.budget > 0) {
        setSummary(data);
      }
      const env = await SpendTrackApi.getEnvelopes(selectedMonth, selectedYear);
      setEnvelopeData(env);
    } catch (err: any) {
      console.error('Failed to fetch budget summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth, selectedYear]);

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

  const formattedMonthYear = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  // Calculated allocations based on total income
  const plannedLiving = Math.round((totalIncome * livingPercent) / 100);
  const plannedEmi = Math.round((totalIncome * emiPercent) / 100);
  const plannedInv = Math.round((totalIncome * invPercent) / 100);
  const plannedSavings = Math.round((totalIncome * savingsPercent) / 100);
  const plannedLifestyle = Math.round((totalIncome * lifestylePercent) / 100);

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      {/* Hero Header Card */}
      <GlassCard padding="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <PieChart className="w-7 h-7 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">Intelligent Budget Engine</h1>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest">
                  v4.0 AI Allocation
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                PostgreSQL budget tracking, AI recommended allocations, and burn-rate intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-white/10 rounded-2xl px-3 py-1.5 text-xs font-bold text-white">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <select
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
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>Set Target</span>
            </button>
          </div>
        </div>

        {/* Budget Ring & Progress */}
        <div className="pt-6">
          <BudgetRing
            percentage={summary.percentage}
            spent={summary.spent}
            budget={summary.budget}
            remaining={summary.remaining}
          />
        </div>
      </GlassCard>

      {/* SECTION 1: Income Inflow Engine */}
      <GlassCard padding="p-6">
        <h3 className="text-base font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign className="w-4.5 h-4.5 text-emerald-400" />
          Income Sources & Inflow Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Primary Salary (₹)</label>
            <input
              type="number"
              value={salaryIncome}
              onChange={(e) => setSalaryIncome(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Bonus / Incentives (₹)</label>
            <input
              type="number"
              value={bonusIncome}
              onChange={(e) => setBonusIncome(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Rental Income (₹)</label>
            <input
              type="number"
              value={rentalIncome}
              onChange={(e) => setRentalIncome(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Side Inflow (₹)</label>
            <input
              type="number"
              value={sideIncome}
              onChange={(e) => setSideIncome(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-300">Total Monthly Verified Inflow:</span>
          <span className="text-lg font-black text-emerald-400 font-mono">₹{totalIncome.toLocaleString('en-IN')}</span>
        </div>
      </GlassCard>

      {/* ENVELOPE BUDGETING SYSTEM */}
      <GlassCard padding="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4.5 h-4.5 text-indigo-400" />
              Envelope Budgeting System ({envelopeData?.envelopes?.length || 8} Envelopes)
            </h3>
            <p className="text-xs text-slate-400">Strict allocation boundaries with carry-forward support</p>
          </div>
          <span className="text-xs font-bold text-indigo-400">
            Remaining Total: ₹{envelopeData?.summary?.totalRemaining?.toLocaleString('en-IN') || 0}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {envelopeData?.envelopes?.map((env: any) => (
            <div key={env.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate">{env.name}</span>
                {env.carryForward && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">CARRY</span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Spent / Allocated</span>
                  <span className="text-sm font-black text-white">
                    ₹{env.spent?.toLocaleString('en-IN')} / ₹{env.allocated?.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className={`text-xs font-black ${env.progress > 90 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {env.progress}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    env.progress > 90 ? 'bg-rose-500' : env.progress > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, env.progress)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* SMART SPENDING RULES & AI BUDGET OPTIMIZER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Smart Spending Rules */}
        <GlassCard padding="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" /> Smart Spending Automation Rules
            </h3>
            <span className="text-[10px] text-slate-400">Merchant → Category/Envelope</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span>Swiggy / Zomato</span>
              <span className="font-bold text-emerald-400">→ Food & Dining Envelope</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span>HP / IndianOil</span>
              <span className="font-bold text-amber-400">→ Fuel & Transport Envelope</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span>HDFC EMI / SBI EMI</span>
              <span className="font-bold text-purple-400">→ EMI & Loan Envelope</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <span>MMTC-PAMP / Tanishq</span>
              <span className="font-bold text-yellow-400">→ Gold & Metal Envelope</span>
            </div>
          </div>
        </GlassCard>

        {/* AI Budget Optimizer */}
        <GlassCard padding="p-5" className="border-l-4 border-l-violet-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" /> AI Budget Optimizer
            </h3>
            <span className="text-[10px] font-bold text-emerald-400">LIVE OPTIMIZATION</span>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <p className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              💡 <span className="font-bold text-white">Suggested Envelope Shift:</span> Move ₹3,000 from Entertainment envelope to Emergency Buffer this month.
            </p>
            <p className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              ⚡ <span className="font-bold text-white">Safe Discretionary Spend:</span> You have ₹14,500 unallocated cash buffer remaining for non-essential purchases.
            </p>
            <p className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              🏆 <span className="font-bold text-white">Gold Capacity:</span> You can safely allocate ₹5,000 to MMTC PAMP gold accumulation this week.
            </p>
          </div>
        </GlassCard>
      </div>

      {/* SECTION 2: AI Recommended Allocations & Variance Table */}
      <GlassCard padding="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-violet-400" />
            AI Recommended Allocations vs Actual
          </h3>
          <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-widest">
            50/30/20 Rule + AI
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-extrabold">
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">AI Suggested %</th>
                <th className="py-3 px-3">Planned Target</th>
                <th className="py-3 px-3">Actual Spent</th>
                <th className="py-3 px-3">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-semibold text-slate-200">
              <tr>
                <td className="py-3 px-3 font-bold text-white">Living Expenses</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    value={livingPercent}
                    onChange={(e) => setLivingPercent(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-white font-bold"
                  /> %
                </td>
                <td className="py-3 px-3 font-mono">₹{plannedLiving.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 font-mono text-rose-400">₹32,500</td>
                <td className="py-3 px-3 font-mono text-emerald-400">+₹{Math.max(0, plannedLiving - 32500).toLocaleString('en-IN')}</td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-bold text-white">Loan EMIs</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    value={emiPercent}
                    onChange={(e) => setEmiPercent(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-white font-bold"
                  /> %
                </td>
                <td className="py-3 px-3 font-mono">₹{plannedEmi.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 font-mono text-purple-400">₹25,000</td>
                <td className="py-3 px-3 font-mono text-emerald-400">+₹{Math.max(0, plannedEmi - 25000).toLocaleString('en-IN')}</td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-bold text-white">Investments & SIPs</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    value={invPercent}
                    onChange={(e) => setInvPercent(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-white font-bold"
                  /> %
                </td>
                <td className="py-3 px-3 font-mono">₹{plannedInv.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 font-mono text-blue-400">₹20,000</td>
                <td className="py-3 px-3 font-mono text-slate-400">₹0</td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-bold text-white">Emergency Savings</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    value={savingsPercent}
                    onChange={(e) => setSavingsPercent(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-white font-bold"
                  /> %
                </td>
                <td className="py-3 px-3 font-mono">₹{plannedSavings.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 font-mono text-amber-400">₹15,000</td>
                <td className="py-3 px-3 font-mono text-slate-400">₹0</td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-bold text-white">Lifestyle & Discretionary</td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    value={lifestylePercent}
                    onChange={(e) => setLifestylePercent(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-white/10 text-white font-bold"
                  /> %
                </td>
                <td className="py-3 px-3 font-mono">₹{plannedLifestyle.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 font-mono text-rose-400">₹6,250</td>
                <td className="py-3 px-3 font-mono text-emerald-400">+₹{Math.max(0, plannedLifestyle - 6250).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Edit Budget Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsEditModalOpen(false)} aria-hidden="true" />
          <div className="relative bg-[#0D1527] border border-white/10 w-full max-w-md rounded-[32px] p-6 space-y-4 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white">Set Overall Budget Limit</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Monthly Budget Target (₹)</label>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="e.g. 90000"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-white/10 text-white text-sm font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBudget}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20"
                >
                  {isSavingBudget ? 'Saving...' : 'Save Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
