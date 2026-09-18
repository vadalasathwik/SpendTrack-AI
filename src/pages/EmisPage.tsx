import React, { useState, useEffect } from 'react';
import { CreditCard, Calculator, Sparkles, Plus, TrendingDown, ArrowRight, ShieldCheck, Zap, Gauge, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard.js';
import { LoanProgressCard } from '../components/ui/LoanProgressCard.js';
import { SpendTrackApi } from '../services/api.js';

interface EmisPageProps {
  incomes?: any[];
  emis?: any[];
  investments?: any[];
  savings?: any[];
  notes?: any[];
  onAddEmi?: (data: any) => Promise<void>;
  onDeleteEmi?: (id: string) => Promise<void>;
}

export const EmisPage: React.FC<EmisPageProps> = ({ onAddEmi, onDeleteEmi }) => {
  const [data, setData] = useState<any>(null);
  const [creditData, setCreditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Part-payment simulator state
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [partPaymentInput, setPartPaymentInput] = useState('50000');
  const [simResult, setSimResult] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, cred] = await Promise.all([
        SpendTrackApi.getLoanIntelligence(),
        SpendTrackApi.getCredit().catch(() => null),
      ]);
      setData(res);
      setCreditData(cred);
    } catch (e) {
      console.warn('Failed to load loan intelligence or credit data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunSimulation = async (amount: number = Number(partPaymentInput)) => {
    if (!selectedLoan || isNaN(amount)) return;
    try {
      const result = await SpendTrackApi.simulatePrepayment({
        outstanding: selectedLoan.outstanding,
        interestRate: selectedLoan.interestRate,
        currentEmi: selectedLoan.emiAmount,
        partPaymentAmount: amount,
      });
      setSimResult(result);
    } catch (e) {
      console.error('Prepayment simulation failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading Credit & Loan Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 soft-shadow">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-2">
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            <span>TrackPay Credit Intelligence & Prepayment Optimizer Pro v4.7.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-purple-400" /> Credit Score & Loan Prepayment Optimizer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Credit Health (300-900), Card Utilization, Prepayment Amortization, & ROI vs Equity Investment Advice
          </p>
        </div>
      </div>

      {/* PHASE 3: CREDIT SCORE WORKSPACE */}
      {creditData && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-[28px] p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Gauge className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Credit Intelligence</span>
                <h3 className="text-lg font-black text-white">Credit Score & Card Utilization Hub</h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Est. Credit Score</span>
                <span className="text-2xl font-black text-purple-400 font-mono">{creditData.creditHealthScore} / 900</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">EMI Eligibility</span>
                <span className="text-sm font-black text-emerald-400">{creditData.emiEligibility}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400">Total Credit Limit</span>
              <div className="text-xl font-black text-white font-mono">₹{creditData.totalCreditLimit?.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400">Total Used Credit</span>
              <div className="text-xl font-black text-rose-400 font-mono">₹{creditData.totalUsedCredit?.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400">Overall Utilization</span>
              <div className="text-xl font-black text-purple-400 font-mono">{creditData.overallUtilization}%</div>
            </div>
          </div>

          {/* Credit Cards list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creditData.creditCards?.map((card: any) => (
              <div key={card.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-white">{card.name}</span>
                  <span className="text-xs font-black text-purple-400">{card.utilizationPercent}% used</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, card.utilizationPercent)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Balance: ₹{card.currentBalance.toLocaleString('en-IN')}</span>
                  <span>Limit: ₹{card.creditLimit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Improvement Suggestions */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
            <span className="text-xs font-extrabold text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Credit Improvement Strategy</span>
            </span>
            <ul className="space-y-1 text-xs text-slate-300">
              {creditData.improvementSuggestions?.map((sugg: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{sugg}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Debt Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Outstanding</span>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            ₹{data?.totalOutstanding?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-[10px] text-slate-500">Across {data?.loanBreakdown?.length || 0} loans</span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Monthly EMI Load</span>
          <p className="text-xl font-black text-purple-400">
            ₹{data?.totalMonthlyEmi?.toLocaleString('en-IN') || 0}/mo
          </p>
          <span className="text-[10px] text-slate-500">Monthly Commitment</span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Monthly Interest</span>
          <p className="text-xl font-black text-rose-400">
            ₹{data?.totalMonthlyInterest?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-[10px] text-slate-500">Cost of Borrowing</span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Monthly Principal</span>
          <p className="text-xl font-black text-emerald-400">
            ₹{data?.totalMonthlyPrincipal?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-[10px] text-slate-500">Equity Building</span>
        </GlassCard>
      </div>

      {/* Active Loans Amortization Breakdown */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-400" /> Active Loans ({data?.loanBreakdown?.length || 0})
        </h3>
        {data?.loanBreakdown?.length === 0 ? (
          <GlassCard className="p-8 text-center text-slate-400">
            No active loans found. All your debts are fully cleared!
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.loanBreakdown?.map((loan: any) => (
              <LoanProgressCard
                key={loan.id}
                loan={loan}
                onSimulate={(l) => {
                  setSelectedLoan(l);
                  setSimResult(null);
                  handleRunSimulation(50000);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* PHASE 3: LOAN PREPAYMENT OPTIMIZER PRO MODAL */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <GlassCard className="w-full max-w-lg p-6 space-y-4 border-purple-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-400" />
                Loan Prepayment Optimizer Pro
              </h3>
              <button
                onClick={() => setSelectedLoan(null)}
                className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Simulate part-payments for <strong className="text-white">{selectedLoan.title} ({selectedLoan.bank})</strong>
            </p>

            {/* Presets ₹50k, ₹1L, Custom */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPartPaymentInput('50000');
                  handleRunSimulation(50000);
                }}
                className="flex-1 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-extrabold text-xs hover:bg-purple-500/20"
              >
                ₹50,000
              </button>
              <button
                type="button"
                onClick={() => {
                  setPartPaymentInput('100000');
                  handleRunSimulation(100000);
                }}
                className="flex-1 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-extrabold text-xs hover:bg-purple-500/20"
              >
                ₹1,00,000
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={partPaymentInput}
                onChange={(e) => setPartPaymentInput(e.target.value)}
                placeholder="Custom Amount (₹)"
                className="flex-1 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
              <button
                onClick={() => handleRunSimulation(Number(partPaymentInput))}
                className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Simulate
              </button>
            </div>

            {simResult && (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900">
                    <span className="text-slate-400 block text-[10px]">Interest Saved</span>
                    <span className="text-base font-black text-emerald-400 font-mono">₹{simResult.interestSaved?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900">
                    <span className="text-slate-400 block text-[10px]">Tenure Reduced</span>
                    <span className="text-base font-black text-purple-400 font-mono">{simResult.monthsSaved} Months</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Guaranteed Prepayment Yield:</span>
                  <span className="font-black text-emerald-400">{simResult.effectiveRoi}% (Tax-Free)</span>
                </div>

                {simResult.investmentComparisonAdvice && (
                  <p className="text-xs text-purple-200 leading-relaxed italic bg-purple-900/20 p-3 rounded-xl border border-purple-500/20">
                    "{simResult.investmentComparisonAdvice}"
                  </p>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};
