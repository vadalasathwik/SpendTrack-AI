import React, { useEffect, useState } from 'react';
import {
  Brain,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Calendar,
  Download,
  FileText,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';
import { AffordabilityResult, MonthlyClosingReport } from '../types.js';

export const AiCfoPage: React.FC = () => {
  // Affordability Simulator State
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseCategory, setPurchaseCategory] = useState('Electronics');
  const [affordabilityResult, setAffordabilityResult] = useState<AffordabilityResult | null>(null);
  const [checkingAffordability, setCheckingAffordability] = useState(false);

  // Cashflow Allowance State
  const [cashflowData, setCashflowData] = useState<any>(null);

  // Monthly Closing Report State
  const [closingReport, setClosingReport] = useState<MonthlyClosingReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    async function loadCfoData() {
      try {
        const [cf, report] = await Promise.all([
          SpendTrackApi.getCfoCashflow().catch(() => null),
          SpendTrackApi.getMonthlyClosingReport().catch(() => null),
        ]);
        if (cf) setCashflowData(cf);
        if (report) setClosingReport(report);
      } catch (err) {
        console.error('Failed to load CFO data:', err);
      }
    }
    loadCfoData();
  }, []);

  const handleCheckAffordability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseAmount || isNaN(Number(purchaseAmount))) return;
    setCheckingAffordability(true);
    try {
      const res = await SpendTrackApi.checkAffordability(Number(purchaseAmount), purchaseCategory);
      setAffordabilityResult(res);
    } catch (err: any) {
      alert(err.message || 'Failed to check affordability');
    } finally {
      setCheckingAffordability(false);
    }
  };

  const handleExportCsv = () => {
    if (!closingReport) return;
    const csvRows = [
      ['Metric', 'Value'],
      ['Month', `${closingReport.monthName} ${closingReport.year}`],
      ['Total Income', closingReport.income],
      ['Total Spent', closingReport.spent],
      ['Total EMIs', closingReport.emi],
      ['Total Investments', closingReport.investments],
      ['Total Savings', closingReport.savings],
      ['Free Cash Buffer', closingReport.freeCash],
      ['Saving Rate %', closingReport.savingRate],
      ['Health Score', closingReport.healthScore],
      ['AI Summary', `"${closingReport.aiSummary.replace(/"/g, '""')}"`],
    ];

    const csvContent = csvRows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TrackPay_Closing_Report_${closingReport.monthName}_${closingReport.year}.csv`;
    link.click();
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-[28px] border border-emerald-800/40 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Brain className="w-3.5 h-3.5" />
            <span>AI CFO & Financial Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">AI CFO Executive Hub</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Simulate purchases, check daily spend allowances, and download monthly closing reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Daily Allowance & Smart Cash Flow Hero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-[20px]">
          <span className="text-xs font-bold text-slate-400">Daily Spend Allowance</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            ₹{(cashflowData?.dailyAllowance ?? 0).toLocaleString('en-IN')}/day
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Free cash ÷ {cashflowData?.remainingDays ?? 30} days remaining
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-[20px]">
          <span className="text-xs font-bold text-slate-400">Monthly Free Cash</span>
          <p className="text-2xl font-black text-white mt-1">
            ₹{(cashflowData?.freeCash ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Uncommitted cash buffer</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-[20px]">
          <span className="text-xs font-bold text-slate-400">Monthly Burn Rate</span>
          <p className="text-2xl font-black text-amber-400 mt-1">
            ₹{(cashflowData?.monthlyBurnRate ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Spent + EMIs + Recurring</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-[20px]">
          <span className="text-xs font-bold text-slate-400">Emergency Fund</span>
          <p className="text-2xl font-black text-purple-400 mt-1">
            ₹{(cashflowData?.emergencyFund ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Liquid emergency cushion</p>
        </div>
      </div>

      {/* Affordability Checker Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-[28px] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
          <h3 className="font-extrabold text-lg text-white">Can I Afford This Purchase?</h3>
        </div>

        <form onSubmit={handleCheckAffordability} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Purchase Amount (₹)</label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 45000"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Category</label>
            <select
              value={purchaseCategory}
              onChange={(e) => setPurchaseCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Electronics">Electronics (Laptop/Phone)</option>
              <option value="Vacation">Vacation / Travel</option>
              <option value="Shopping">Shopping & Fashion</option>
              <option value="Home & Appliance">Home & Appliance</option>
              <option value="Vehicle & Upgrade">Vehicle & Upgrade</option>
              <option value="Other">Other Discretionary</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={checkingAffordability}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
            >
              {checkingAffordability ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Affordability</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Affordability Result Card */}
        {affordabilityResult && (
          <div
            className={`p-5 rounded-[20px] border mt-4 flex items-start gap-4 ${
              affordabilityResult.affordable
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}
          >
            {affordabilityResult.affordable ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-extrabold text-base text-white">
                  {affordabilityResult.affordable ? 'Affordable Purchase' : 'Purchase Exceeds Free Cash'}
                </h4>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700">
                  Impact: {affordabilityResult.impact}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                {affordabilityResult.message}
              </p>
              <div className="mt-2 text-xs font-bold text-slate-400">
                Remaining Cash Buffer after Purchase: ₹{affordabilityResult.remainingCash.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Closing Report Section */}
      {closingReport && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-[28px] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-lg text-white">
                Monthly Closing Report — {closingReport.monthName} {closingReport.year}
              </h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Health Score: {closingReport.healthScore}/100
            </span>
          </div>

          <div className="p-4 rounded-[16px] bg-slate-800/40 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Executive AI Summary</h4>
            <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">{closingReport.aiSummary}</p>
          </div>

          {/* Top Spending Categories */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Top Spending Categories
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {closingReport.topCategories.map((cat, idx) => (
                <div key={idx} className="p-3.5 rounded-[16px] bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{cat.category}</span>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-400 block">
                      ₹{cat.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400">{cat.percent}% of total spent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Biggest Purchase */}
          {closingReport.biggestPurchase && (
            <div className="p-4 rounded-[16px] bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Biggest Single Purchase</span>
                <span className="text-sm font-extrabold text-white mt-0.5 block">
                  {closingReport.biggestPurchase.title}
                </span>
                <span className="text-[11px] text-slate-400">{closingReport.biggestPurchase.date}</span>
              </div>
              <span className="text-base font-black text-rose-400">
                ₹{closingReport.biggestPurchase.amount.toLocaleString('en-IN')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
