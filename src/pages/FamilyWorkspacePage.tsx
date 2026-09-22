import React, { useState, useEffect } from 'react';
import { Users, UserPlus, ShieldCheck, Crown, Sparkles, Plus, Lock, Eye, Edit3, GitFork, CheckCircle2, AlertTriangle, FileText, HeartHandshake, Building, Shield } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard.js';
import { FamilyMemberCard } from '../components/ui/FamilyMemberCard.js';
import { SpendTrackApi } from '../services/api.js';

export const FamilyWorkspacePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [legacyData, setLegacyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Spouse');
  const [role, setRole] = useState('VIEWER');

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, leg] = await Promise.all([
        SpendTrackApi.getFamilyWorkspace(),
        SpendTrackApi.getLegacy().catch(() => null),
      ]);
      setData(res);
      setLegacyData(leg);
    } catch (e) {
      console.warn('Failed to load family workspace or legacy data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      await SpendTrackApi.addFamilyMember({
        name,
        relation,
        role,
      });

      setName('');
      setShowAddModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to add family member:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await SpendTrackApi.deleteFamilyMember(id);
      loadData();
    } catch (e) {
      console.error('Failed to delete family member:', e);
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 soft-shadow">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <GitFork className="w-3.5 h-3.5 text-emerald-400" />
            <span>SpendTrack AI Family Wealth Tree & Legacy v4.7.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-400" /> Family Wealth Tree & Legacy OS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Multi-Generational Household Tree, Shared Assets/Liabilities, Nominee Assignments, & AI Legacy Checklist
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg hover:scale-102 cursor-pointer transition-all self-start md:self-center"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" /> Add Member
        </button>
      </div>

      {/* PHASE 4: LEGACY CHECKLIST & WEALTH TREE HIGHLIGHTS */}
      {legacyData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <GlassCard className="p-6 md:col-span-1 space-y-4 bg-gradient-to-br from-slate-900 to-emerald-950/40 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">Legacy Score</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{legacyData.completenessPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${legacyData.completenessPercentage}%` }} />
            </div>
            <p className="text-xs text-slate-300 font-medium">
              AI verified Will deeds, Nominees, Insurance beneficiaries, & Property documents.
            </p>
          </GlassCard>

          <GlassCard className="p-6 md:col-span-2 space-y-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              AI Legacy Completeness Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {legacyData.checklist?.map((item: any) => (
                <div key={item.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-bold">{item.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* PHASE 4: FAMILY WEALTH TREE VISUALIZATION */}
      <div className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white">Household Wealth Tree</h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            Net Family Wealth: ₹{legacyData?.netFamilyWealth?.toLocaleString('en-IN') || data?.totalHouseholdNetWorth?.toLocaleString('en-IN') || 0}
          </span>
        </div>

        {/* Tree Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {legacyData?.familyMembers?.map((member: any) => (
            <div key={member.id} className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-300 text-sm">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white">{member.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {member.relation}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Role: {member.role}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-900">
                  <span className="text-slate-400 block text-[10px]">Assigned Assets</span>
                  <span className="font-bold text-emerald-400">{member.assignedAssetsCount} Assets</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900">
                  <span className="text-slate-400 block text-[10px]">Nominee Status</span>
                  <span className="font-bold text-indigo-400">{member.nomineeStatus}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Household Net Worth & Members KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Household Net Worth</span>
          <p className="text-xl font-black text-emerald-400 font-mono">
            ₹{data?.totalHouseholdNetWorth?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-[10px] text-slate-500">Shared Asset Total</span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Household Assets</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            ₹{data?.totalHouseholdAssets?.toLocaleString('en-IN') || 0}
          </p>
          <span className="text-[10px] text-slate-500">Gross Assets</span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Active Household Goals</span>
          <p className="text-xl font-black text-indigo-400">
            {data?.activeGoalsCount || 0} Goals
          </p>
          <span className="text-[10px] text-slate-500">Family Milestones</span>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Insurance Policies</span>
          <p className="text-xl font-black text-teal-400">
            {data?.totalInsurancePolicies || 0} Policies
          </p>
          <span className="text-[10px] text-slate-500">Family Coverage</span>
        </GlassCard>
      </div>

      {/* PHASE 4: MONTHLY FAMILY CONTRIBUTION TRACKER & SHARED EXPENSES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Household Contribution Breakdown */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Monthly Member Pool Contributions
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-400">₹1,85,000 / mo Total</span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Self (Account Owner)', relation: 'Owner', share: 60, amount: 111000, role: 'OWNER', status: 'Contributed' },
              { name: 'Priya Sharma', relation: 'Spouse', share: 30, amount: 55500, role: 'CO-OWNER', status: 'Contributed' },
              { name: 'Ramesh Sharma', relation: 'Father', share: 10, amount: 18500, role: 'VIEWER', status: 'Scheduled' },
            ].map((contrib, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-white">{contrib.name}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {contrib.role}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-400">₹{contrib.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${contrib.share}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Pool Share: {contrib.share}%</span>
                  <span className={contrib.status === 'Contributed' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    ● {contrib.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Shared Household Goals & Shared Expenses */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-indigo-400" />
              Shared Family Goals & Commitments
            </h3>
            <span className="text-xs font-bold text-slate-400">3 Active Joint Goals</span>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Family EV Purchase Fund', target: 2200000, saved: 1450000, color: 'from-emerald-500 to-teal-500' },
              { title: 'Annual Family Europe Vacation', target: 600000, saved: 420000, color: 'from-indigo-500 to-purple-500' },
              { title: 'Children Higher Education Trust', target: 5000000, saved: 2150000, color: 'from-amber-500 to-orange-500' },
            ].map((goal, idx) => {
              const pct = Math.round((goal.saved / goal.target) * 100);
              return (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-white">{goal.title}</span>
                    <span className="text-xs font-mono font-bold text-slate-300">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                    <div className={`bg-gradient-to-r ${goal.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Saved: ₹{goal.saved.toLocaleString('en-IN')}</span>
                    <span>Target: ₹{goal.target.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Family Members Catalog */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" /> Family Members Catalog ({data?.members?.length || 0})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.members?.map((member: any) => (
            <FamilyMemberCard key={member.id} member={member} onDelete={handleDelete} />
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Add Family Member</h3>
            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Relation</label>
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Sibling">Sibling</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Role Permission</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="VIEWER">Viewer (Read Only)</option>
                    <option value="EDITOR">Editor (Can Add Expenses)</option>
                    <option value="OWNER">Co-Owner (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold cursor-pointer">Save Member</button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
