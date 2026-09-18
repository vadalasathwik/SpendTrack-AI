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
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';

interface FinanceHealthPageProps {
  onNavigateToTab?: (tab: string) => void;
}

export const FinanceHealthPage: React.FC<FinanceHealthPageProps> = ({ onNavigateToTab }) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHealthData() {
      try {
        const health = await SpendTrackApi.getCfoHealth().catch(() => null);
        if (health) setHealthData(health);
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
        <p className="text-sm font-semibold text-slate-400">Evaluating Financial Health 2.0 Weighted Metrics...</p>
      </div>
    );
  }

  const score = healthData?.healthScore ?? 78;
  const prevScore = healthData?.previousMonthScore ?? 75;
  const trend = healthData?.trend ?? 'UP';
  const freeCash = healthData?.freeCash ?? 0;
  const savingRate = healthData?.savingRate ?? 0;
  const emiRatio = healthData?.emiRatio ?? 0;
  const emergencyMonths = healthData?.emergencyFundMonths ?? 0;
  const risk = healthData?.risk ?? 'LOW';
  const breakdown = healthData?.weightedBreakdown || {
    savingsRateScore: 16,
    emiRatioScore: 18,
    emergencyCoverageScore: 15,
    budgetDisciplineScore: 12,
    netWorthGrowthScore: 10,
    investmentConsistencyScore: 7,
  };

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-[28px] border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Financial Health 2.0 Weighted Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Financial Health 2.0 Diagnostic
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Multi-factor weighted evaluation across Savings (20%), EMI (20%), Emergency Buffer (20%), Budget Discipline (15%), Net Worth Growth (15%), & Investment Consistency (10%).
          </p>
        </div>

        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('aicfo')}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI CFO</span>
          </button>
        )}
      </div>

      {/* Hero Score Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-[24px] p-6 backdrop-blur-md flex flex-col justify-between relative overflow-hidden shadow-lg space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weighted Health Index</span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {trend === 'UP' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {trend} vs Prev ({prevScore})
              </span>
            </div>

            <div className="mt-6 flex items-baseline justify-center">
              <span className="text-6xl font-black text-white tracking-tight font-mono">{score}</span>
              <span className="text-2xl font-bold text-slate-500 ml-1">/100</span>
            </div>

            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mt-4 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center gap-3">
            <Award className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-slate-300">
              {score >= 75
                ? 'Weighted health score is in optimal shape across all 6 core pillars!'
                : 'Work on boosting emergency buffer and reducing EMI commitment ratios.'}
            </p>
          </div>
        </div>

        {/* 6-Factor Weighted Factors Breakdown */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-[24px] p-6 space-y-4 shadow-lg">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Weighted 6-Factor Diagnostic Radar
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">1. Savings Rate (20% Weight)</span>
                <span className="text-emerald-400 font-mono">{breakdown.savingsRateScore} / 20</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${(breakdown.savingsRateScore / 20) * 100}%` }} />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">2. EMI Ratio (20% Weight)</span>
                <span className="text-emerald-400 font-mono">{breakdown.emiRatioScore} / 20</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-400 h-full" style={{ width: `${(breakdown.emiRatioScore / 20) * 100}%` }} />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">3. Emergency Buffer (20% Weight)</span>
                <span className="text-emerald-400 font-mono">{breakdown.emergencyCoverageScore} / 20</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full" style={{ width: `${(breakdown.emergencyCoverageScore / 20) * 100}%` }} />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">4. Budget Discipline (15% Weight)</span>
                <span className="text-emerald-400 font-mono">{breakdown.budgetDisciplineScore} / 15</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-400 h-full" style={{ width: `${(breakdown.budgetDisciplineScore / 15) * 100}%` }} />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">5. Net Worth Growth (15% Weight)</span>
                <span className="text-emerald-400 font-mono">{breakdown.netWorthGrowthScore} / 15</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full" style={{ width: `${(breakdown.netWorthGrowthScore / 15) * 100}%` }} />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">6. Investment Consistency (10% Weight)</span>
                <span className="text-emerald-400 font-mono">{breakdown.investmentConsistencyScore} / 10</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-400 h-full" style={{ width: `${(breakdown.investmentConsistencyScore / 10) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI CFO Advice List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-[24px] p-6 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h3 className="font-extrabold text-lg text-white">AI CFO Monthly Recommendations</h3>
        </div>

        {healthData?.insights?.map((insight: string, idx: number) => (
          <div key={idx} className="p-4 rounded-[16px] bg-slate-800/50 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
