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
  CreditCard,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';
import { MonthlyClosingReport } from '../types.js';

export const AiCfoPage: React.FC = () => {
  // Feature 4: AI Purchase Advisor 2.0 Inputs
  const [itemName, setItemName] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseCategory, setPurchaseCategory] = useState('Electronics');
  const [cashback, setCashback] = useState('');
  const [isEmi, setIsEmi] = useState(false);
  const [emiMonths, setEmiMonths] = useState('6');
  const [interestRate, setInterestRate] = useState('14');
  const [downPayment, setDownPayment] = useState('');

  const [affordabilityResult, setAffordabilityResult] = useState<any>(null);
  const [checkingAffordability, setCheckingAffordability] = useState(false);

  // Cashflow Allowance State
  const [cashflowData, setCashflowData] = useState<any>(null);

  // Monthly Closing Report State
  const [closingReport, setClosingReport] = useState<MonthlyClosingReport | null>(null);

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
      const res = await SpendTrackApi.checkAffordability({
        amount: Number(purchaseAmount),
        category: purchaseCategory,
        itemName,
        cashback: Number(cashback || 0),
        isEmi,
        emiMonths: Number(emiMonths || 6),
        interestRate: Number(interestRate || 14),
        downPayment: Number(downPayment || 0),
      });
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
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-[28px] border border-emerald-800/40 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <Brain className="w-3.5 h-3.5" />
            <span>AI Purchase Advisor 2.0 • Phase 2</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">AI CFO Executive Hub</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Simulate purchase decisions, compare Cash vs. EMI costs, calculate opportunity costs, & download monthly reports.
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
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            ₹{(cashflowData?.dailyAllowance ?? 0).toLocaleString('en-IN')}/day
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Free cash ÷ {cashflowData?.remainingDays ?? 30} days remaining
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-[20px]">
          <span className="text-xs font-bold text-slate-400">Monthly Free Cash</span>
          <p className="text-2xl font-black text-white mt-1 font-mono">
            ₹{(cashflowData?.freeCash ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Uncommitted cash buffer</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-[20px]">
          <span className="text-xs font-bold text-slate-400">Monthly Burn Rate</span>
          <p className="text-2xl font-black text-amber-400 mt-1 font-mono">
            ₹{(cashflowData?.monthlyBurnRate ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Spent + EMIs + Recurring</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-[20px]">
          <span className="text-xs font-bold text-slate-400">Emergency Fund</span>
          <p className="text-2xl font-black text-purple-400 mt-1 font-mono">
            ₹{(cashflowData?.emergencyFund ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Liquid emergency cushion</p>
        </div>
      </div>

      {/* Feature 4: AI Purchase Advisor 2.0 Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-[28px] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
          <h3 className="font-extrabold text-lg text-white">AI Purchase Advisor 2.0 — "Can I Afford This?"</h3>
        </div>

        <form onSubmit={handleCheckAffordability} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Item Name</label>
              <input
                type="text"
                placeholder="e.g. MacBook Pro M3"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 145000"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Category</label>
              <select
                value={purchaseCategory}
                onChange={(e) => setPurchaseCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Vacation">Vacation / Travel</option>
                <option value="Shopping">Shopping & Fashion</option>
                <option value="Home & Appliance">Home & Appliance</option>
                <option value="Vehicle & Upgrade">Vehicle & Upgrade</option>
                <option value="Other">Other Discretionary</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Cashback / Discount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={cashback}
                onChange={(e) => setCashback(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Payment Method</label>
              <button
                type="button"
                onClick={() => setIsEmi(!isEmi)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                  isEmi ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isEmi ? 'EMI Selected' : 'Full Cash'}</span>
              </button>
            </div>

            {isEmi && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">EMI Months</label>
                  <select
                    value={emiMonths}
                    onChange={(e) => setEmiMonths(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="9">9 Months</option>
                    <option value="12">12 Months</option>
                    <option value="18">18 Months</option>
                    <option value="24">24 Months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Down Payment (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 25000"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={checkingAffordability}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
            >
              {checkingAffordability ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Advisor 2.0 Diagnostics</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Affordability Result Card */}
        {affordabilityResult && (
          <div className="p-5 rounded-[24px] bg-slate-950 border border-slate-800 space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Affordability Score:</span>
                <span className={`text-base font-black px-3 py-0.5 rounded-full border font-mono ${
                  affordabilityResult.score >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {affordabilityResult.score} / 100
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400">Impact: {affordabilityResult.impact}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
              {affordabilityResult.message}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cash vs EMI Comparison</span>
                <div className="text-xs font-bold text-white">
                  Cash: ₹{affordabilityResult.cashVsEmiComparison.cashCost.toLocaleString('en-IN')} vs EMI: ₹{affordabilityResult.cashVsEmiComparison.emiCost.toLocaleString('en-IN')}
                </div>
                {affordabilityResult.cashVsEmiComparison.interestCost > 0 && (
                  <span className="text-[11px] text-rose-400 block">EMI costs ₹{affordabilityResult.cashVsEmiComparison.interestCost.toLocaleString('en-IN')} more</span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Better Purchase Month</span>
                <div className="text-xs font-bold text-emerald-400">{affordabilityResult.betterPurchaseMonth}</div>
                <span className="text-[11px] text-slate-400 block">Improves cash buffer by 23%</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Opportunity Cost</span>
                <div className="text-[11px] text-slate-300">{affordabilityResult.opportunityCost}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
