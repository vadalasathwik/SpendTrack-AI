import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Clock, Sparkles, AlertCircle, HeartPulse, Stethoscope, Activity, ShieldAlert } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard.js';
import { InsuranceCard } from '../components/ui/InsuranceCard.js';
import { SpendTrackApi } from '../services/api.js';

export const InsuranceVaultPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [healthcareData, setHealthcareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState('HEALTH');
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, health] = await Promise.all([
        SpendTrackApi.getInsuranceVault(),
        SpendTrackApi.getHealthcare().catch(() => null),
      ]);
      setData(res);
      setHealthcareData(health);
    } catch (e) {
      console.warn('Failed to load insurance vault or healthcare data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !provider || !premiumAmount || !renewalDate) return;

    try {
      await SpendTrackApi.addInsurancePolicy({
        title,
        type,
        provider,
        policyNumber,
        premiumAmount: Number(premiumAmount),
        renewalDate,
        coverageAmount: Number(coverageAmount) || 0,
      });

      setTitle('');
      setProvider('');
      setPolicyNumber('');
      setPremiumAmount('');
      setRenewalDate('');
      setCoverageAmount('');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to add policy:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await SpendTrackApi.deleteInsurancePolicy(id);
      loadData();
    } catch (e) {
      console.error('Failed to delete policy:', e);
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 soft-shadow">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold mb-2">
            <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
            <span>SpendTrack AI Healthcare & Insurance Vault v4.7.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-teal-400" /> Healthcare Finance & Policy Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Health Insurance Coverage Adequacy, Medical Expenses, Emergency Fund & Electronics Warranties
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg hover:scale-102 cursor-pointer transition-all self-start md:self-center"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Add Policy / Warranty
        </button>
      </div>

      {/* PHASE 2: HEALTHCARE DASHBOARD KPIs */}
      {healthcareData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Annual Healthcare Spend</span>
            <p className="text-2xl font-black text-rose-400 font-mono">
              ₹{healthcareData.annualHealthcareSpend?.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-slate-400">Past 12 months live medical expenses</span>
          </GlassCard>

          <GlassCard className="p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Coverage Adequacy</span>
            <p className="text-2xl font-black text-teal-400 font-mono">
              {healthcareData.coverageAdequacy}% <span className="text-xs text-slate-400">Adequate</span>
            </p>
            <span className="text-[10px] text-slate-400">Target benchmark: ₹15,00,000 family float</span>
          </GlassCard>

          <GlassCard className="p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Insured Sum</span>
            <p className="text-2xl font-black text-emerald-400 font-mono">
              ₹{healthcareData.remainingInsuredAmount?.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-slate-400">Out of ₹{healthcareData.totalCoverageAmount?.toLocaleString('en-IN')} total</span>
          </GlassCard>

          <GlassCard className="p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Medical Emergency Fund</span>
            <p className="text-2xl font-black text-purple-400 font-mono">
              ₹{healthcareData.medicalEmergencyFund?.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-slate-400">Liquid reserves available for hospital visits</span>
          </GlassCard>
        </div>
      )}

      {/* GENERAL INSURANCE KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Policy Sum</span>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            ₹{data?.totalCoverage?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-[10px] text-slate-500">Across {data?.policies?.length || 0} policies</span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Annual Premium Load</span>
          <p className="text-xl font-black text-amber-400">
            ₹{data?.totalAnnualPremium?.toLocaleString('en-IN') || 0}/yr
          </p>
          <span className="text-[10px] text-slate-500">Total Premium Commitment</span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Upcoming Renewals</span>
          <p className="text-xl font-black text-teal-400">
            {data?.upcomingRenewalsCount || 0} Policies
          </p>
          <span className="text-[10px] text-slate-500">Due in next 30 days</span>
        </GlassCard>
      </div>

      {/* AI Coverage Analysis */}
      {data?.aiCoverageAnalysis && (
        <GlassCard className="p-5 space-y-2 border-l-4 border-l-teal-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              AI Risk & Coverage Adequacy Advisor
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed italic">
            "{data.aiCoverageAnalysis}"
          </p>
        </GlassCard>
      )}

      {/* Policies Grid */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-400" /> Policy Catalog ({data?.policies?.length || 0})
        </h3>
        {data?.policies?.length === 0 ? (
          <GlassCard className="p-8 text-center text-slate-400">
            No policies or warranties stored yet. Click "Add Policy / Warranty" to protect your health, vehicle, or gadgets.
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.policies?.map((policy: any) => (
              <InsuranceCard key={policy.id} policy={policy} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Add Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[28px] p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-4">Add Insurance / Warranty</h3>
            <form onSubmit={handleAddPolicy} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Policy Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Star Health Family Floater"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="HEALTH">Health</option>
                    <option value="LIFE">Life</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="HOME">Home</option>
                    <option value="ELECTRONICS_WARRANTY">Electronics Warranty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Provider</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC ERGO"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Coverage Sum (₹)</label>
                  <input
                    type="number"
                    placeholder="1500000"
                    value={coverageAmount}
                    onChange={(e) => setCoverageAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Annual Premium (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="22000"
                    value={premiumAmount}
                    onChange={(e) => setPremiumAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Renewal Date</label>
                <input
                  type="date"
                  required
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-extrabold cursor-pointer">Save Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
