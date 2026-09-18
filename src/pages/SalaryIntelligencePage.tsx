import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, TrendingUp, Sparkles, Award, DollarSign } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard.js';
import { SalaryCard } from '../components/ui/SalaryCard.js';
import { SpendTrackApi } from '../services/api.js';

export const SalaryIntelligencePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [basic, setBasic] = useState('60000');
  const [hra, setHra] = useState('30000');
  const [da, setDa] = useState('0');
  const [bonus, setBonus] = useState('0');
  const [pfDeduction, setPfDeduction] = useState('3600');
  const [profTaxDeduction, setProfTaxDeduction] = useState('200');

  const [bizData, setBizData] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await SpendTrackApi.getSalaryIntelligence();
      setData(res);
      const biz = await SpendTrackApi.getBusinessWorkspace();
      setBizData(biz);
    } catch (e) {
      console.warn('Failed to load salary intelligence or business workspace:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!basic || !hra) return;

    try {
      await SpendTrackApi.saveSalaryRecord({
        month: Number(month),
        year: Number(year),
        basic: Number(basic),
        hra: Number(hra),
        da: Number(da),
        bonus: Number(bonus),
        pfDeduction: Number(pfDeduction),
        profTaxDeduction: Number(profTaxDeduction),
      });

      setShowAddModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to save salary record:', err);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-400" /> Salary & Payslip Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Component Breakdown, Annual Income, Taxable Baseline & Increment Coaching
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg hover:scale-102 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Log Payslip
        </button>
      </div>

      {/* Salary Overview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Annual Gross Income</span>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            ₹{data?.annualGross?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-[10px] text-slate-500">Gross Compensation</span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Annual Net Take-Home</span>
          <p className="text-xl font-black text-emerald-400">
            ₹{data?.annualNet?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-[10px] text-slate-500">In-Hand Cash</span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Estimated Taxable Base</span>
          <p className="text-xl font-black text-amber-400">
            ₹{data?.estimatedTaxableIncome?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-[10px] text-slate-500">After Std & 80C PF</span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Monthly Savings Capacity</span>
          <p className="text-xl font-black text-blue-400">
            ₹{data?.monthlySavingsCapacity || data?.monthlySavingsPotential?.toLocaleString('en-IN') || 0}/mo
          </p>
          <span className="text-[10px] text-slate-500">35% Wealth Target</span>
        </GlassCard>
      </div>

      {/* AI Career & Increment Coach */}
      {data?.aiCareerCoachInsight && (
        <GlassCard className="p-5 space-y-2 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              AI Career & Increment Coach
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed italic">
            "{data.aiCareerCoachInsight}"
          </p>
        </GlassCard>
      )}
      {/* BUSINESS & MULTI-STREAM INCOME WORKSPACE */}
      {bizData && (
        <GlassCard className="p-5 space-y-3 border-blue-500/30">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Business Finance & Multi-Income Streams
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {bizData.profitMarginPercent}% Net Profit Margin
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {bizData.incomeStreams?.map((stream: any) => (
              <div key={stream.name} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block truncate">{stream.name}</span>
                <span className="text-sm font-black text-white">₹{stream.monthlyRevenue?.toLocaleString('en-IN')}/mo</span>
                <span className="text-[9px] text-blue-400 font-bold block">{stream.category}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Payslip History */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-400" /> Payslip Records ({data?.records?.length || 0})
        </h3>
        {data?.records?.length === 0 ? (
          <GlassCard className="p-8 text-center text-slate-400">
            No salary records logged yet. Click "Log Payslip" to track your monthly basic, HRA, and PF deductions.
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.records?.map((sal: any) => (
              <SalaryCard key={sal.id} salary={sal} growthPercentage={data.growthPercentage} />
            ))}
          </div>
        )}
      </div>

      {/* Log Payslip Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Log Monthly Payslip</h3>
            <form onSubmit={handleSaveSalary} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        Month {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Basic Pay (₹)</label>
                  <input
                    type="number"
                    value={basic}
                    onChange={(e) => setBasic(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">HRA (₹)</label>
                  <input
                    type="number"
                    value={hra}
                    onChange={(e) => setHra(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">DA / Allowances (₹)</label>
                  <input
                    type="number"
                    value={da}
                    onChange={(e) => setDa(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Bonus / Variable (₹)</label>
                  <input
                    type="number"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">PF Deduction (₹)</label>
                  <input
                    type="number"
                    value={pfDeduction}
                    onChange={(e) => setPfDeduction(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Professional Tax (₹)</label>
                  <input
                    type="number"
                    value={profTaxDeduction}
                    onChange={(e) => setProfTaxDeduction(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 font-bold hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-black hover:bg-blue-400"
                >
                  Save Payslip
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
