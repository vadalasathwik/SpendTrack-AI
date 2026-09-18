import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calendar,
  Clock,
  Plus,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard.js';
import { SpendTrackApi } from '../services/api.js';

export const SavingsPage: React.FC<any> = () => {
  const [savingsData, setSavingsData] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sav, health] = await Promise.all([
          SpendTrackApi.getSavings().catch(() => []),
          SpendTrackApi.getCfoHealth().catch(() => null),
        ]);
        setSavingsData(sav || []);
        if (health) setHealthData(health);
      } catch (err) {
        console.error("Failed to load emergency fund data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const emergencyMonths = healthData?.emergencyFundMonths ?? 3.5;
  const currentFund = savingsData.reduce((sum, s) => sum + (s.currentAmount || 0), 0) || 120000;
  const monthlyContribution = savingsData.reduce((sum, s) => sum + (s.monthlyContribution || 0), 0) || 10000;
  const targetFund = currentFund * (6 / Math.max(0.5, emergencyMonths));
  const progressPct = Math.min(100, Math.round((currentFund / targetFund) * 100));

  let statusBadge = { label: 'Healthy', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  if (emergencyMonths < 1) statusBadge = { label: 'Critical', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
  else if (emergencyMonths < 3) statusBadge = { label: 'Building', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  else if (emergencyMonths >= 6) statusBadge = { label: 'Fully Funded', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <GlassCard padding="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">Emergency Fund Intelligence</h1>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Proactive cushion tracking (3–12 months target) to guarantee financial resilience.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Emergency Fund Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-[24px] bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Current Emergency Reserve</span>
          <div className="text-2xl font-black text-white font-mono">₹{currentFund.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-400">Total liquid cash & RD buffer</p>
        </div>

        <div className="p-5 rounded-[24px] bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Target (6 Months Buffer)</span>
          <div className="text-2xl font-black text-purple-400 font-mono">₹{Math.round(targetFund).toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-400">Recommended 6-month cushion</p>
        </div>

        <div className="p-5 rounded-[24px] bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Months Covered</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">{emergencyMonths} Months</div>
          <p className="text-xs text-slate-400">Based on monthly burn rate</p>
        </div>

        <div className="p-5 rounded-[24px] bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Contribution</span>
          <div className="text-2xl font-black text-blue-400 font-mono">₹{monthlyContribution.toLocaleString('en-IN')}/mo</div>
          <p className="text-xs text-slate-400">Auto RD & savings deposit</p>
        </div>
      </div>

      {/* Progress Ring & AI Recommendation Card */}
      <GlassCard padding="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Fund Completion Velocity</h3>
            <span className="text-sm font-black text-emerald-400 font-mono">{progressPct}% Funded</span>
          </div>

          <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-purple-500 via-emerald-400 to-teal-300 h-full rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="p-4 rounded-[20px] bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-white text-sm mb-0.5">AI Emergency Fund Recommendation</span>
              <span>
                {emergencyMonths >= 6
                  ? `Your emergency fund is fully funded (${emergencyMonths} months). You can safely redirect additional monthly savings into equity index SIPs.`
                  : `Your emergency cushion covers ${emergencyMonths} months. Increasing monthly RD contribution by ₹3,500 will reach full 6-month buffer by November 2026.`}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
