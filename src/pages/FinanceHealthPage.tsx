import React, { useEffect, useState } from 'react';
import {
  Activity,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Percent,
  Calendar,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';
import { CfoFinancialHealth, NetWorthSummary } from '../types.js';

interface FinanceHealthPageProps {
  onNavigateToTab?: (tab: string) => void;
}

export const FinanceHealthPage: React.FC<FinanceHealthPageProps> = ({ onNavigateToTab }) => {
  const [healthData, setHealthData] = useState<CfoFinancialHealth | null>(null);
  const [netWorthData, setNetWorthData] = useState<NetWorthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHealthData() {
      try {
        const [health, networth] = await Promise.all([
          SpendTrackApi.getCfoHealth().catch(() => null),
          SpendTrackApi.getNetWorth().catch(() => null),
        ]);
        if (health) setHealthData(health);
        if (networth) setNetWorthData(networth);
      } catch (err) {
        console.error('Failed to load financial health:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHealthData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Evaluating Financial Health Metrics...</p>
      </div>
    );
  }

  const score = healthData?.healthScore ?? 75;
  const freeCash = healthData?.freeCash ?? 0;
  const savingRate = healthData?.savingRate ?? 0;
  const emiRatio = healthData?.emiRatio ?? 0;
  const investmentRatio = healthData?.investmentRatio ?? 0;
  const emergencyMonths = healthData?.emergencyFundMonths ?? 0;
  const risk = healthData?.risk ?? 'LOW';
  const netWorth = netWorthData?.netWorth ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-[28px] border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>AI CFO Financial Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Financial Health Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time diagnostics analyzing cash flow, emergency buffers, debt exposure, and savings velocity.
          </p>
        </div>

        {/* Quick Action Button */}
        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('aicfo')}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open AI CFO Assistant</span>
          </button>
        )}
      </div>

      {/* Hero Widget: Financial Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-[24px] p-6 backdrop-blur-md flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health Index</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                  risk === 'LOW'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : risk === 'MEDIUM'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {risk} RISK
              </span>
            </div>

            <div className="mt-6 flex items-baseline justify-center">
              <span className="text-6xl font-black text-white tracking-tight">{score}</span>
              <span className="text-2xl font-bold text-slate-500 ml-1">/100</span>
            </div>

            {/* Health Meter Progress Bar */}
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mt-4 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  score >= 75
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : score >= 50
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-rose-500 to-red-400'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
            <Award className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-slate-300">
              {score >= 75
                ? 'Excellent health! Your savings rate and emergency buffers are in optimal shape.'
                : score >= 50
                ? 'Moderate financial health. Work on expanding your emergency fund & free cash buffer.'
                : 'Attention needed. Reduce high EMI commitments to stabilize cash flow.'}
            </p>
          </div>
        </div>

        {/* AI CFO Advice & Key Metrics Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-[20px] p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Monthly Free Cash</p>
                <p className="text-xl font-black text-white">₹{freeCash.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Surplus remaining after all expenses, EMIs, SIPs, and savings targets.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-[20px] p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Savings Rate</p>
                <p className="text-xl font-black text-white">{savingRate}%</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Percentage of monthly income directed into investments and savings plans.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-[20px] p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">EMI Ratio</p>
                <p className="text-xl font-black text-white">{emiRatio}%</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {emiRatio > 40 ? 'High loan exposure. Keep below 40% of income.' : 'Healthy loan commitment ratio.'}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-[20px] p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Emergency Cushion</p>
                <p className="text-xl font-black text-white">{emergencyMonths} Months</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Estimated living expenses covered by dedicated emergency savings.
            </p>
          </div>
        </div>
      </div>

      {/* AI CFO Tailored Insights List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-[24px] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h3 className="font-extrabold text-lg text-white">AI CFO Monthly Recommendations</h3>
        </div>

        <div className="space-y-3">
          {healthData?.insights?.map((insight, idx) => (
            <div
              key={idx}
              className="p-4 rounded-[16px] bg-slate-800/50 border border-slate-800 flex items-start gap-3"
            >
              <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
