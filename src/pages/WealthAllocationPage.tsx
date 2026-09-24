import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  TrendingUp,
  CreditCard,
  PiggyBank,
  DollarSign,
  Sliders,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Award,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';
import { PlannerSummary } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { SpendTrackApi } from '../services/api.js';

interface WealthAllocationPageProps {
  plannerSummary: PlannerSummary;
}

export const WealthAllocationPage: React.FC<WealthAllocationPageProps> = ({
  plannerSummary,
}) => {
  const [allocationData, setAllocationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const baseIncome = plannerSummary?.income || 0;

  // Manual Sliders State
  const [emiPct, setEmiPct] = useState(plannerSummary?.income > 0 ? Math.round((plannerSummary.emi / plannerSummary.income) * 100) : 0);
  const [invPct, setInvPct] = useState(plannerSummary?.income > 0 ? Math.round((plannerSummary.investments / plannerSummary.income) * 100) : 0);
  const [savPct, setSavPct] = useState(plannerSummary?.income > 0 ? Math.round((plannerSummary.savings / plannerSummary.income) * 100) : 0);
  const [livingPct, setLivingPct] = useState(plannerSummary?.income > 0 ? Math.round((plannerSummary.living / plannerSummary.income) * 100) : 0);

  const allocatedTotalPct = emiPct + invPct + savPct + livingPct;
  const bufferPct = Math.max(0, 100 - allocatedTotalPct);

  // Dynamic Dollar Amounts for User Allocation
  const emiAmount = Math.round((baseIncome * emiPct) / 100);
  const invAmount = Math.round((baseIncome * invPct) / 100);
  const savAmount = Math.round((baseIncome * savPct) / 100);
  const livingAmount = Math.round((baseIncome * livingPct) / 100);
  const bufferAmount = Math.round((baseIncome * bufferPct) / 100);

  useEffect(() => {
    const fetchAllocation = async () => {
      try {
        setLoading(true);
        const data = await SpendTrackApi.getDynamicWealthAllocation();
        setAllocationData(data);
      } catch (err) {
        console.error("Failed to load wealth allocation:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllocation();
  }, []);

  const resetSliders = () => {
    setEmiPct(40);
    setInvPct(15);
    setSavPct(10);
    setLivingPct(25);
  };

  return (
    <div className="space-y-8 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-800 soft-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dynamic Wealth Allocation Engine 2.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <PieIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Wealth Allocation Engine</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Dynamic AI allocation across Living, EMI, Investments, Savings, & Lifestyle based on profile parameters.
          </p>
        </div>

        <button
          onClick={resetSliders}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-[14px] flex items-center gap-1.5 cursor-pointer self-start md:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* AI RECOMMENDATION BANNER */}
      {allocationData?.aiRecommendation && (
        <div className="p-5 rounded-[24px] bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 text-white space-y-2 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-purple-300 font-black text-sm">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>AI Wealth CFO Recommendation</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
            {allocationData.aiRecommendation}
          </p>
        </div>
      )}

      {/* DYNAMIC ALLOCATION CARDS (Living, EMI, Investments, Savings, Lifestyle) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {(allocationData?.allocations || [
          { category: 'Living', recommendedPct: 30, actualPct: 25, recommendedAmount: 60000, actualAmount: 50000, varianceAmount: -10000, status: 'OPTIMAL' },
          { category: 'EMI', recommendedPct: 25, actualPct: 35, recommendedAmount: 50000, actualAmount: 70000, varianceAmount: 20000, status: 'OVER' },
          { category: 'Investments', recommendedPct: 25, actualPct: 15, recommendedAmount: 50000, actualAmount: 30000, varianceAmount: -20000, status: 'UNDER' },
          { category: 'Savings', recommendedPct: 15, actualPct: 10, recommendedAmount: 30000, actualAmount: 20000, varianceAmount: -10000, status: 'UNDER' },
          { category: 'Lifestyle', recommendedPct: 5, actualPct: 15, recommendedAmount: 10000, actualAmount: 30000, varianceAmount: 20000, status: 'OVER' },
        ]).map((item: any) => {
          let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          if (item.status === 'OVER') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
          else if (item.status === 'UNDER') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

          return (
            <div
              key={item.category}
              className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 soft-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-slate-900 dark:text-white">{item.category}</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                  {item.status}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {item.actualPct}% <span className="text-xs font-semibold text-slate-400 font-sans">(₹{item.actualAmount.toLocaleString('en-IN')})</span>
                </div>
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Target: {item.recommendedPct}% (₹{item.recommendedAmount.toLocaleString('en-IN')})
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold">
                <span className="text-slate-400">Variance:</span>
                <span className={item.varianceAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                  {item.varianceAmount > 0 ? `+₹${item.varianceAmount.toLocaleString('en-IN')}` : `-₹${Math.abs(item.varianceAmount).toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPARISON TABLE: YOUR ALLOCATION VS RECOMMENDED */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Detailed Dynamic Allocation Breakdown</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Actual %</th>
                <th className="py-3 px-2">Actual Monthly ₹</th>
                <th className="py-3 px-2 text-emerald-600">AI Target %</th>
                <th className="py-3 px-2 text-emerald-600">AI Target ₹</th>
                <th className="py-3 px-2">Variance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
              {(allocationData?.allocations || []).map((row: any) => (
                <tr key={row.category}>
                  <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">{row.category}</td>
                  <td className="py-3 px-2">{row.actualPct}%</td>
                  <td className="py-3 px-2 font-mono">₹{row.actualAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-2 font-bold text-emerald-600 font-mono">{row.recommendedPct}%</td>
                  <td className="py-3 px-2 font-bold text-emerald-600 font-mono">₹{row.recommendedAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${row.status === 'OVER' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
