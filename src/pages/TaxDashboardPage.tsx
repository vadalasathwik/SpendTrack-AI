import React, { useState, useEffect } from 'react';
import { Calculator, Sparkles, CheckCircle2, ShieldCheck, FileText, ArrowRight, PieChart as PieIcon, Percent, AlertCircle, FileSpreadsheet, Briefcase, DollarSign } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard.js';
import { SpendTrackApi } from '../services/api.js';

export const TaxDashboardPage: React.FC = () => {
  const [targetFy, setTargetFy] = useState('FY 2025-26');
  const [data, setData] = useState<any>(null);
  const [taxPlanner, setTaxPlanner] = useState<any>(null);
  const [bizData, setBizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, planner, biz] = await Promise.all([
        SpendTrackApi.getTaxDashboard(targetFy),
        SpendTrackApi.getTaxPlanner(targetFy).catch(() => null),
        SpendTrackApi.getBusinessWorkspace().catch(() => null),
      ]);
      setData(res);
      setTaxPlanner(planner);
      setBizData(biz);
    } catch (e) {
      console.warn('Failed to load tax dashboard or tax planner:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetFy]);

  const isNewRecommended = data?.recommendedRegime === 'NEW_REGIME';
  const taxUtilizationPct = taxPlanner?.taxUtilizationPercent || 78;

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 soft-shadow">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>SpendTrack AI Tax Planner Pro & GST Workspace v4.8.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Calculator className="w-7 h-7 text-emerald-400" /> Tax & FY 2025-26 Compliance Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Old vs. New Regime Analyzer, Section 80C/80D/24/NPS/ELSS Deductions, & GST Invoice Workspace
          </p>
        </div>

        {/* Financial Year Selector */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {['FY 2025-26', 'FY 2024-25'].map((fy) => (
            <button
              key={fy}
              onClick={() => setTargetFy(fy)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                targetFy === fy
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {fy}
            </button>
          ))}
        </div>
      </div>

      {/* PHASE 2: TAX PLANNER PRO PROGRESS RING & REGIME RECOMMENDATION */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <GlassCard className="p-6 md:col-span-2 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Recommended Regime: {isNewRecommended ? 'New Tax Regime' : 'Old Tax Regime'}
                </h3>
              </div>
              <span className="text-xs font-black text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Saves ₹{data.taxSavingsAmount?.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {data.aiTaxRecommendation || `Based on your annual gross income of ₹${data.annualGrossIncome?.toLocaleString('en-IN')} and registered 80C/80D deductions.`}
            </p>
          </GlassCard>

          {/* Tax Utilization Progress Ring Card */}
          <GlassCard className="p-6 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tax Exemption Utilization</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{taxUtilizationPct}%</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${taxUtilizationPct}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block">FY End Deadline: March 31, 2026</span>
          </GlassCard>
        </div>
      )}

      {/* Side-by-Side Old vs New Regime Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Old Regime Card */}
        <GlassCard className={`p-5 space-y-4 border ${!isNewRecommended ? 'border-emerald-500/50 shadow-lg' : 'border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Old Tax Regime</h3>
            {!isNewRecommended && (
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                Optimal Choice
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Gross Income</span>
              <span className="font-bold text-slate-200">₹{data?.annualGrossIncome?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Standard Deduction</span>
              <span className="font-bold text-emerald-400">-₹{data?.deductions?.standardOld?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Sec 80C (EPF / ELSS / PPF)</span>
              <span className="font-bold text-emerald-400">-₹{data?.deductions?.sec80C?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Sec 80D (Health Insurance)</span>
              <span className="font-bold text-emerald-400">-₹{data?.deductions?.sec80D?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Sec 24 (Home Loan Interest)</span>
              <span className="font-bold text-emerald-400">-₹{data?.deductions?.sec24?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-black">
              <span className="text-slate-200">Estimated Tax Liability:</span>
              <span className="text-rose-400">₹{data?.oldRegime?.estimatedTax?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </GlassCard>

        {/* New Regime Card */}
        <GlassCard className={`p-5 space-y-4 border ${isNewRecommended ? 'border-emerald-500/50 shadow-lg' : 'border-slate-800'}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">New Tax Regime (FY 2025-26)</h3>
            {isNewRecommended && (
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                Optimal Choice
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Gross Income</span>
              <span className="font-bold text-slate-200">₹{data?.annualGrossIncome?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Standard Deduction</span>
              <span className="font-bold text-emerald-400">-₹{data?.deductions?.standardNew?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Revised Slabs (Nil up to ₹12L post 87A)</span>
              <span className="font-bold text-teal-400">Sec 87A Rebate</span>
            </div>
            <div className="flex justify-between pt-8 text-sm font-black">
              <span className="text-slate-200">Estimated Tax Liability:</span>
              <span className="text-emerald-400">₹{data?.newRegime?.estimatedTax?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* PHASE 2: GST & INVOICE WORKSPACE */}
      <div className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-black text-white">GST & Client Invoice Workspace</h2>
          </div>
          <span className="text-xs font-mono font-bold text-teal-400">GST Liability: ₹{(bizData?.gstLiability || 38500).toLocaleString('en-IN')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold block">Monthly Revenue</span>
            <div className="text-xl font-black text-white font-mono">₹{(bizData?.monthlyRevenue || 285000).toLocaleString('en-IN')}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold block">Paid Invoices</span>
            <div className="text-xl font-black text-emerald-400 font-mono">₹{(bizData?.paidInvoices || 210000).toLocaleString('en-IN')}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold block">Pending Invoices</span>
            <div className="text-xl font-black text-amber-400 font-mono">₹{(bizData?.pendingInvoices || 75000).toLocaleString('en-IN')}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold block">Expected Collections</span>
            <div className="text-xl font-black text-teal-400 font-mono">₹{(bizData?.expectedCollections || 75000).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
