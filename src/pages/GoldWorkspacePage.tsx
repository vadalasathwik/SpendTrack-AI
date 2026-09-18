import React, { useState, useEffect } from 'react';
import { Coins, Flame, Plus, Sparkles, Target, Award } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard.js';
import { GoldHoldingCard } from '../components/ui/GoldHoldingCard.js';
import { ProgressRing } from '../components/ui/ProgressRing.js';
import { SpendTrackApi } from '../services/api.js';

export const GoldWorkspacePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [metalType, setMetalType] = useState('GOLD');
  const [form, setForm] = useState('MMTC_PAMP');
  const [grams, setGrams] = useState('');
  const [buyRate, setBuyRate] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await SpendTrackApi.getGoldWorkspace();
      setData(res);
    } catch (e) {
      console.warn('Failed to load gold workspace:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMetal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grams || !buyRate) return;

    try {
      await SpendTrackApi.addGoldHolding({
        metalType,
        form,
        grams: Number(grams),
        buyPricePerGram: Number(buyRate),
        currentPricePerGram: currentRate ? Number(currentRate) : Number(buyRate),
        notes,
      });

      setGrams('');
      setBuyRate('');
      setCurrentRate('');
      setNotes('');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to add metal holding:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await SpendTrackApi.deleteGoldHolding(id);
      loadData();
    } catch (e) {
      console.error('Failed to delete metal holding:', e);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-400" /> Gold & Silver Precious Metals Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track MMTC PAMP, Tanishq, physical coins, bars & 100g gold milestone
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg hover:scale-102 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Add Gold / Silver
        </button>
      </div>

      {/* 100g Goal Ring & Gold KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Progress Ring Card */}
        <GlassCard className="p-5 flex items-center gap-4 border-amber-500/30">
          <ProgressRing
            radius={42}
            stroke={8}
            progress={Math.min(100, Math.round(((data?.totalGoldGrams || 0) / 100) * 100))}
            color="#f59e0b"
          />
          <div>
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
              100g Gold Milestone
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {data?.totalGoldGrams || 0}g / 100g
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {Math.max(0, 100 - (data?.totalGoldGrams || 0))}g remaining
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Precious Valuation</span>
          <p className="text-2xl font-black text-amber-400">
            ₹{((data?.totalGoldCurrentValue || 0) + (data?.totalSilverCurrentValue || 0)).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400">
            Gold: ₹{data?.totalGoldCurrentValue?.toLocaleString('en-IN') || 0} • Silver: ₹{data?.totalSilverCurrentValue?.toLocaleString('en-IN') || 0}
          </span>
        </GlassCard>

        <GlassCard className="p-5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Avg Gold Buy Rate</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{data?.avgGoldPricePerGram?.toFixed(0) || 0} <span className="text-xs font-normal text-slate-400">/ g</span>
          </p>
          <span className="text-[10px] text-emerald-400 font-medium">Accumulated during dips</span>
        </GlassCard>

        <GlassCard className="p-5 space-y-1 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/20">
          <span className="text-[11px] font-bold text-amber-400 uppercase flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Dip Opportunity
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {data?.dipOpportunityScore || 85} <span className="text-xs text-slate-400">/ 100</span>
          </p>
          <span className="text-[10px] text-amber-300 font-semibold">BUY ON DIP ACTIVE</span>
        </GlassCard>
      </div>

      {/* Brand & Form Breakdown Chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          MMTC-PAMP: <span className="font-extrabold text-white">{data?.holdings?.filter((h: any) => h.form === 'MMTC_PAMP').reduce((acc: number, cur: any) => acc + cur.grams, 0) || 0}g</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
          Tanishq / Jewel: <span className="font-extrabold text-white">{data?.holdings?.filter((h: any) => h.form === 'TANISHQ').reduce((acc: number, cur: any) => acc + cur.grams, 0) || 0}g</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
          Coins & Bars: <span className="font-extrabold text-white">{data?.holdings?.filter((h: any) => ['GOLD_COIN', 'GOLD_BAR', 'PHYSICAL_GOLD'].includes(h.form)).reduce((acc: number, cur: any) => acc + cur.grams, 0) || 0}g</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          Silver Holdings: <span className="font-extrabold text-white">{data?.holdings?.filter((h: any) => h.metalType === 'SILVER').reduce((acc: number, cur: any) => acc + cur.grams, 0) || 0}g</span>
        </div>
      </div>

      {/* GOLD PURCHASE CALENDAR */}
      <GlassCard className="p-5 space-y-3 border-amber-500/30">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" /> Gold Purchase & Accumulation Calendar
          </h3>
          <span className="text-[10px] font-bold text-amber-300">Target: 2g / Month</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">Next Dip Buying Date</span>
            <span className="text-xs font-black text-amber-400">Oct 5, 2026</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">Recommended Quantity</span>
            <span className="text-xs font-black text-white">2.5 Grams</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">Estimated Outflow</span>
            <span className="text-xs font-black text-emerald-400">₹18,500</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">Unrealized Metal Gain</span>
            <span className="text-xs font-black text-emerald-400">+₹14,200 (+11.8%)</span>
          </div>
        </div>
      </GlassCard>

      {/* AI Purchase Timing Analysis */}
      {data?.aiBestMonthAnalysis && (
        <GlassCard className="p-5 space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              AI Gold DIP Strategy Advisor
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed italic">
            "{data.aiBestMonthAnalysis}"
          </p>
        </GlassCard>
      )}

      {/* Precious Metals Holdings Grid */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-400" /> Metal Holdings ({data?.holdings?.length || 0})
        </h3>
        {data?.holdings?.length === 0 ? (
          <GlassCard className="p-8 text-center text-slate-400">
            No gold or silver holdings added yet. Click "Add Gold / Silver" to track your coins, bars, or digital gold.
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.holdings?.map((holding: any) => (
              <GoldHoldingCard key={holding.id} holding={holding} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Add Metal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Add Precious Metal</h3>
            <form onSubmit={handleAddMetal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Metal Type</label>
                  <select
                    value={metalType}
                    onChange={(e) => setMetalType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Form / Brand</label>
                  <select
                    value={form}
                    onChange={(e) => setForm(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="MMTC_PAMP">MMTC PAMP</option>
                    <option value="TANISHQ">Tanishq</option>
                    <option value="PHYSICAL_GOLD">Physical Gold</option>
                    <option value="GOLD_COIN">Gold Coin</option>
                    <option value="GOLD_BAR">Gold Bar</option>
                    <option value="SILVER_BAR">Silver Bar / Coin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Weight in Grams</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 10"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Buy Rate /g (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 7200"
                    value={buyRate}
                    onChange={(e) => setBuyRate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Current Rate /g (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 7500"
                  value={currentRate}
                  onChange={(e) => setCurrentRate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
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
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400"
                >
                  Save Metal
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
