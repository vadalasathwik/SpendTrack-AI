import React, { useEffect, useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Home,
  Coins,
  Car,
  Plane,
  Heart,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  GraduationCap,
  BookOpen,
  Award,
  Zap,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';

const GOAL_TEMPLATES = [
  { category: 'House', icon: Home, color: 'text-amber-400 bg-amber-500/10' },
  { category: 'Gold', icon: Coins, color: 'text-yellow-400 bg-yellow-500/10' },
  { category: 'Car', icon: Car, color: 'text-blue-400 bg-blue-500/10' },
  { category: 'Wedding', icon: Heart, color: 'text-rose-400 bg-rose-500/10' },
  { category: 'Emergency Fund', icon: ShieldAlert, color: 'text-purple-400 bg-purple-500/10' },
  { category: 'Vacation', icon: Plane, color: 'text-teal-400 bg-teal-500/10' },
  { category: 'Education', icon: GraduationCap, color: 'text-indigo-400 bg-indigo-500/10' },
];

export const GoalForecastPage: React.FC = () => {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Education state
  const [educationData, setEducationData] = useState<any>(null);

  // New Goal Modal state
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Education');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [inflationRate, setInflationRate] = useState('7.5');

  const [retirementData, setRetirementData] = useState<any>(null);

  const loadGoals = async () => {
    try {
      const [data, edu, ret] = await Promise.all([
        SpendTrackApi.getGoals(),
        SpendTrackApi.getEducation().catch(() => null),
        SpendTrackApi.getRetirementPlan().catch(() => null),
      ]);
      setGoals(data || []);
      setEducationData(edu);
      setRetirementData(ret);
    } catch (err) {
      console.error('Failed to load goals or education:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleSelectTemplate = (templateCategory: string) => {
    setCategory(templateCategory);
    if (!title) setTitle(`${templateCategory} Goal`);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount || !targetDate) return;

    try {
      await SpendTrackApi.createGoal({
        title,
        category,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount || 0),
        monthlyContribution: Number(monthlyContribution || 0),
        targetDate,
      });

      setTitle('');
      setTargetAmount('');
      setCurrentAmount('');
      setMonthlyContribution('');
      setTargetDate('');
      setIsAddGoalOpen(false);
      loadGoals();
    } catch (err: any) {
      alert(err.message || 'Failed to create goal');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await SpendTrackApi.deleteGoal(id);
      loadGoals();
    } catch (err: any) {
      alert(err.message || 'Failed to delete goal');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Loading Goal Forecasts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-[28px] border border-indigo-800/40 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>SpendTrack AI Education & Goal Intelligence v4.7.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Goal Forecast Engine</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Inflation-adjusted predictive milestone timelines for Child Education, Higher Studies, Certifications, & FIRE.
          </p>
        </div>

        <button
          onClick={() => setIsAddGoalOpen(true)}
          className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* PHASE 2: EDUCATION GOAL PLANNER WORKSPACE */}
      {educationData && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-[28px] p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Education Goal Planner Pro</span>
              </div>
              <h3 className="text-lg font-black text-white">Education & Certification Inflation Planner</h3>
              <p className="text-xs text-slate-400">Child Education, Overseas MBA, Certifications & Skill Learning</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Overall Completion</span>
                <span className="text-base font-black text-emerald-400 font-mono">{educationData.overallCompletionRate}%</span>
              </div>
            </div>
          </div>

          {/* Education Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
              <span className="text-xs font-bold text-indigo-300">Current Saved Target</span>
              <div className="text-xl font-black text-white font-mono">₹{educationData.totalSavedValue?.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
              <span className="text-xs font-bold text-purple-300">Base Target Amount</span>
              <div className="text-xl font-black text-white font-mono">₹{educationData.totalTargetValue?.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-xs font-bold text-amber-300">Inflation-Adjusted Future Cost (8% Inflation)</span>
              <div className="text-xl font-black text-amber-400 font-mono">₹{educationData.totalFutureCost?.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Education Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {educationData.goals?.map((eduGoal: any) => (
              <div key={eduGoal.id} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {eduGoal.category}
                    </span>
                    <h4 className="text-sm font-extrabold text-white mt-1">{eduGoal.title}</h4>
                  </div>
                  <span className="text-xs font-black text-emerald-400 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    {eduGoal.completionProbability}% Probable
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Today's Cost</span>
                    <span className="font-bold text-white">₹{eduGoal.targetAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Future Cost ({eduGoal.inflationRate}%)</span>
                    <span className="font-bold text-amber-400">₹{eduGoal.futureCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Req. Monthly</span>
                    <span className="font-bold text-indigo-400">₹{eduGoal.requiredMonthly.toLocaleString('en-IN')}/mo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RETIREMENT PLANNING WORKSPACE */}
      {retirementData && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-[28px] p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">FIRE Engine</span>
              <h3 className="text-lg font-black text-white">Retirement Readiness & FIRE Targets</h3>
              <p className="text-xs text-slate-400">Target Age: {retirementData.retirementAge} ({retirementData.yearsToRetire} years remaining)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                FIRE Readiness: {retirementData.fireReadinessScore || 78}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Goal Cards Grid */}
      {goals.length === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-[28px] p-12 text-center max-w-lg mx-auto">
          <Target className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Goals Configured Yet</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Start tracking Education, House, Gold, Car, Wedding, Vacation, or Emergency Fund goals with AI completion predictions.
          </p>
          <button
            onClick={() => setIsAddGoalOpen(true)}
            className="px-5 py-2.5 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer"
          >
            Add Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const template = GOAL_TEMPLATES.find((t) => t.category === goal.category) || GOAL_TEMPLATES[0];
            const Icon = template.icon;
            const probBadge = goal.completionProbability === 'VERY_HIGH' || goal.completionProbability === 'HIGH'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

            return (
              <div
                key={goal.id}
                className="bg-slate-900/90 border border-slate-800 rounded-[24px] p-6 space-y-4 backdrop-blur-md relative overflow-hidden shadow-xl"
              >
                {/* Card Top */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${template.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-white">{goal.title}</h3>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${probBadge}`}>
                          {goal.completionProbability || 'HIGH'} Prob
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Category: {goal.category || 'General'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-400">Progress ({goal.progressPercent || 0}%)</span>
                    <span className="text-emerald-400 font-mono">₹{(goal.currentAmount || 0).toLocaleString('en-IN')} / ₹{(goal.targetAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                      style={{ width: `${goal.progressPercent || 0}%` }}
                    />
                  </div>
                </div>

                {/* Forecast Metrics 4-Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-800/50 p-3 rounded-[16px] border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Date</span>
                    <span className="text-xs font-extrabold text-white mt-0.5 block font-mono">
                      {goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-slate-800/50 p-3 rounded-[16px] border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Req. Monthly Contribution</span>
                    <span className="text-xs font-extrabold text-emerald-400 mt-0.5 block font-mono">
                      ₹{(goal.monthlyContribution || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[28px] p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-4">Create Financial Milestone</h3>

            {/* Template Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 mb-2">Select Template</label>
              <div className="grid grid-cols-3 gap-2">
                {GOAL_TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isSelected = category === tmpl.category;
                  return (
                    <button
                      key={tmpl.category}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl.category)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tmpl.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford Higher Education Fund"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 2500000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Current Saved (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500000"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Monthly Contribution (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25000"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-extrabold text-xs cursor-pointer"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
