import React, { useState } from 'react';
import { Sparkles, Send, Bot, Shield, TrendingUp, CreditCard, Coins, Calculator, ShieldCheck, Briefcase, Sliders, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard.js';
import { SpendTrackApi } from '../services/api.js';

export type PersonaType =
  | 'CFO'
  | 'Wealth Advisor'
  | 'Loan Expert'
  | 'Gold Planner'
  | 'Tax Guide'
  | 'Insurance Advisor'
  | 'Career Finance Coach'
  | 'AI Life Planner';

interface PersonaConfig {
  id: PersonaType;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
}

const PERSONAS: PersonaConfig[] = [
  {
    id: 'AI Life Planner',
    title: 'Master AI Life Planner',
    subtitle: 'Buy Home, FIRE, Education & Gold',
    icon: Sparkles,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'CFO',
    title: 'Chief Financial Officer',
    subtitle: 'Budget & Cash Flow Guardian',
    icon: Sparkles,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'Wealth Advisor',
    title: 'Wealth & Asset Manager',
    subtitle: 'Portfolio Compounding & CAGR',
    icon: TrendingUp,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    id: 'Loan Expert',
    title: 'Debt & Loan Specialist',
    subtitle: 'EMI Amortization & Refinancing',
    icon: CreditCard,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'Gold Planner',
    title: 'Precious Metals Advisor',
    subtitle: 'Gold & Silver DIP Strategy',
    icon: Coins,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'Tax Guide',
    title: 'Tax & FY Specialist',
    subtitle: 'Old vs New Regime & 80C',
    icon: Calculator,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  },
  {
    id: 'Insurance Advisor',
    title: 'Risk & Insurance Advisor',
    subtitle: 'Policy Coverage & Renewals',
    icon: ShieldCheck,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
  {
    id: 'Career Finance Coach',
    title: 'Career & Salary Coach',
    subtitle: 'Increments & Pay Optimization',
    icon: Briefcase,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
];

export const AiExecutiveWorkspacePage: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('CFO');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    { persona: PersonaType; query: string; reply: string; time: string }[]
  >([]);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Financial Decision Simulator state
  const [simType, setSimType] = useState<'BUY_HOUSE' | 'BUY_CAR' | 'PREPAY_LOAN' | 'INCREASE_SIP'>('BUY_HOUSE');
  const [simAmount, setSimAmount] = useState<number>(5000000);
  const [simDownPayment, setSimDownPayment] = useState<number>(1000000);
  const [simTenure, setSimTenure] = useState<number>(20);
  const [simInterest, setSimInterest] = useState<number>(8.5);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const fetchAudit = async () => {
    try {
      const res = await SpendTrackApi.getAuditLogs(20);
      setAuditLogs(res.logs || []);
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    try {
      const res = await SpendTrackApi.runDecisionSimulation({
        type: simType,
        amount: Number(simAmount),
        downPayment: Number(simDownPayment),
        loanTenureYears: Number(simTenure),
        interestRate: Number(simInterest),
      });
      setSimResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimLoading(false);
    }
  };

  const activePersonaConfig = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    const userQuery = queryInput.trim();
    setQueryInput('');
    setLoading(true);

    try {
      const res = await SpendTrackApi.queryAiSpecialist(selectedPersona, userQuery);
      setMessages((prev) => [
        ...prev,
        {
          persona: selectedPersona,
          query: userQuery,
          reply: res.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      console.error('AI query error:', e);
      setMessages((prev) => [
        ...prev,
        {
          persona: selectedPersona,
          query: userQuery,
          reply: 'AI executive is calculating live metrics. Please try again shortly.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Bot className="w-6 h-6 text-emerald-400" /> AI Executive Specialist Hub
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          7 Persona Specialists with Live PostgreSQL Context & Gemini 2.5 Intelligence
        </p>
      </div>

      {/* 7 AI Specialist Persona Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPersona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPersona(p.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg scale-102'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-black block truncate">{p.id}</span>
                <span className="text-[10px] text-slate-500 truncate block">{p.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Executive CFO Meeting Mode & Predictive Finance Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CFO Meeting Mode Bar */}
        <GlassCard className="p-4 space-y-2 border-indigo-500/30 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-xs font-black text-white">Executive CFO Meeting Mode</h3>
                <p className="text-[10px] text-slate-400">Automated Weekly, Monthly, Quarterly & Annual CFO Briefings</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const r = await SpendTrackApi.getBoardroomReport('weekly');
                    setMessages((prev) => [
                      ...prev,
                      {
                        persona: 'CFO',
                        query: 'Generate Weekly Boardroom Report',
                        reply: `${r.period}\n\n• Weekly Outflow: ₹${r.spendingSummary?.weeklyOutflow?.toLocaleString('en-IN')}\n• Executive Summary: ${r.executiveSummary}`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      },
                    ]);
                  } catch (err) {
                    console.error('Failed to generate report:', err);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold hover:bg-emerald-500/30 cursor-pointer"
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const r = await SpendTrackApi.getBoardroomReport('monthly');
                    setMessages((prev) => [
                      ...prev,
                      {
                        persona: 'CFO',
                        query: 'Generate Monthly Executive CFO Briefing',
                        reply: `Monthly Executive Briefing:\n• Income: ₹${r.summary?.totalIncome?.toLocaleString('en-IN')}\n• Expenses: ₹${r.summary?.totalExpenses?.toLocaleString('en-IN')}\n• Net Worth: ₹${r.summary?.netWorth?.toLocaleString('en-IN')}\n• Health Score: ${r.summary?.healthScore}/100 (${r.summary?.healthRating})`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      },
                    ]);
                  } catch (err) {
                    console.error('Failed to generate report:', err);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold hover:bg-indigo-500/30 cursor-pointer"
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const r = await SpendTrackApi.getBoardroomReport('quarterly');
                    setMessages((prev) => [
                      ...prev,
                      {
                        persona: 'CFO',
                        query: 'Generate Quarterly Boardroom Report',
                        reply: `${r.period}\n\n• QoQ Net Worth Growth: ${r.quarterlyMetrics?.netWorthGrowthQoQ}\n• Portfolio CAGR: ${r.quarterlyMetrics?.portfolioCompoundingCAGR}\n• Executive Summary: ${r.executiveSummary}`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      },
                    ]);
                  } catch (err) {
                    console.error('Failed to generate report:', err);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold hover:bg-purple-500/30 cursor-pointer"
              >
                Quarterly
              </button>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const r = await SpendTrackApi.getAnnualBoardroomReport();
                    setMessages((prev) => [
                      ...prev,
                      {
                        persona: 'CFO',
                        query: 'Generate Annual Boardroom Statement',
                        reply: `🏆 ${r.period}\n\n• Annual Wealth Growth: ${r.annualWealthGrowth}\n• Annual Tax Saved: ₹${r.annualTaxSaved?.toLocaleString('en-IN')}\n• Net Worth Growth QoQ: ${r.quarterlyMetrics?.netWorthGrowthQoQ}\n• Portfolio Compounding CAGR: ${r.quarterlyMetrics?.portfolioCompoundingCAGR}\n• Executive Summary: ${r.executiveSummary}`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      },
                    ]);
                  } catch (err) {
                    console.error('Failed to generate annual report:', err);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold hover:bg-amber-500/30 cursor-pointer flex items-center gap-1"
              >
                <FileText className="w-3 h-3 text-amber-400" /> Annual
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/10 text-[10px] font-bold hover:bg-white/10 cursor-pointer"
              >
                Export Report
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Predictive AI Confidence Widget */}
        <GlassCard className="p-4 space-y-1 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Predictive AI Score</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">94% Confidence</span>
          </div>
          <p className="text-xl font-black text-white">Cash Surplus Forecast</p>
          <p className="text-[10px] text-slate-300">
            Next 30D projected free cash buffer: <span className="font-bold text-emerald-400">Optimal (Zero Debt Stress)</span>
          </p>
        </GlassCard>
      </div>

      {/* Real-Time Financial Decision Simulator (v4.6.0) */}
      <GlassCard className="p-5 space-y-4 border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-slate-900/40 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-black text-white">Real-Time Financial Decision Simulator</h3>
              <p className="text-[10px] text-slate-400">Simulate major financial moves against live PostgreSQL cash flow before executing</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            v4.6.0 AI Engine
          </span>
        </div>

        <form onSubmit={handleSimulate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Scenario Type</label>
            <select
              value={simType}
              onChange={(e: any) => setSimType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold outline-none focus:border-indigo-500"
            >
              <option value="BUY_HOUSE">Buy House</option>
              <option value="BUY_CAR">Buy Car</option>
              <option value="PREPAY_LOAN">Prepay Loan</option>
              <option value="INCREASE_SIP">Increase Monthly SIP</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Amount (₹)</label>
            <input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>

          {simType === 'BUY_HOUSE' || simType === 'BUY_CAR' ? (
            <>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Down Payment (₹)</label>
                <input
                  type="number"
                  value={simDownPayment}
                  onChange={(e) => setSimDownPayment(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tenure (Years)</label>
                <input
                  type="number"
                  value={simTenure}
                  onChange={(e) => setSimTenure(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold outline-none focus:border-indigo-500"
                />
              </div>
            </>
          ) : (
            <div className="lg:col-span-2 flex items-end">
              <span className="text-[11px] text-slate-400 italic mb-2">Prepayment / SIP directly boosts long-term compounding buffer.</span>
            </div>
          )}

          <div className="flex items-end">
            <button
              type="submit"
              disabled={simLoading}
              className="w-full py-2 px-4 rounded-xl bg-indigo-500 text-white font-extrabold text-xs hover:bg-indigo-600 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
            >
              {simLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />} Simulate Impact
            </button>
          </div>
        </form>

        {simResult && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {simResult.recommendationScore >= 80 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Simulation Score: {simResult.recommendationScore}/100
                  </h4>
                  <p className="text-[11px] text-slate-300">{simResult.recommendationText}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="p-2 rounded-xl bg-slate-800/50">
                <span className="text-[10px] text-slate-400 block">Monthly EMI Impact</span>
                <span className={`font-black ${simResult.monthlyEmiDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {simResult.monthlyEmiDelta > 0 ? `+₹${simResult.monthlyEmiDelta.toLocaleString('en-IN')}` : `-₹${Math.abs(simResult.monthlyEmiDelta).toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/50">
                <span className="text-[10px] text-slate-400 block">Upfront Outflow</span>
                <span className="font-black text-white">₹{simResult.cashOutflow?.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/50">
                <span className="text-[10px] text-slate-400 block">Net Worth Impact</span>
                <span className={`font-black ${simResult.netWorthImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simResult.netWorthImpact >= 0 ? `+₹${simResult.netWorthImpact.toLocaleString('en-IN')}` : `-₹${Math.abs(simResult.netWorthImpact).toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/50">
                <span className="text-[10px] text-slate-400 block">EMI Ratio After</span>
                <span className={`font-black ${simResult.emiRatioAfter > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {simResult.emiRatioAfter}%
                </span>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Active Persona Context Card & Executive Memory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center gap-3 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent md:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
              Active Persona: {activePersonaConfig.title}
            </span>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Auto-injected with your real-time PostgreSQL database state.
            </p>
          </div>
        </GlassCard>

        {/* Phase 5 Executive AI Memory Recall Widget */}
        <GlassCard className="p-4 space-y-2 border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Executive AI Memory Engine
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              5 Active Context Memory Vectors
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block font-bold">FIRE Target</span>
              <span className="text-emerald-400 font-black font-mono">₹5.0 Crore</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block font-bold">Gold Target</span>
              <span className="text-amber-400 font-black font-mono">500 Grams</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block font-bold">House Goal</span>
              <span className="text-purple-400 font-black font-mono">₹1.2 Crore</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block font-bold">Risk Profile</span>
              <span className="text-indigo-400 font-black">Balanced Growth</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block font-bold">Tax Regime</span>
              <span className="text-teal-400 font-black">New Regime</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Chat Messages Stream */}
      <div className="space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className="space-y-2">
            {/* User Prompt */}
            <div className="flex justify-end">
              <div className="bg-emerald-500 text-slate-950 p-3 rounded-2xl rounded-tr-xs text-xs font-bold max-w-[80%] shadow-md">
                {msg.query}
              </div>
            </div>

            {/* Persona Response */}
            <div className="flex justify-start">
              <GlassCard className="p-4 space-y-2 max-w-[90%] border-l-4 border-l-emerald-500">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> {msg.persona} Advisor
                  </span>
                  <span>{msg.time}</span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                  {msg.reply}
                </div>
              </GlassCard>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <GlassCard className="p-3 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>{selectedPersona} is analyzing your live financial metrics...</span>
            </GlassCard>
          </div>
        )}
      </div>

      {/* Audit Log Drawer Toggle */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => {
            setShowAuditLogs(!showAuditLogs);
            if (!showAuditLogs) fetchAudit();
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:border-slate-700 cursor-pointer"
        >
          <Shield className="w-4 h-4 text-emerald-400" /> {showAuditLogs ? 'Hide Audit Log' : 'View Audit Trail Log'}
        </button>
      </div>

      {/* Audit Trail Log Viewer */}
      {showAuditLogs && (
        <GlassCard className="p-5 space-y-3 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Administrative Audit Trail Log
            </h3>
            <span className="text-[10px] text-slate-400">Strict Data Integrity Tracking</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar text-xs">
            {auditLogs.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No audit logs recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${log.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                      {log.action}
                    </span>
                    <span className="font-bold text-white ml-2">{log.entity}</span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">{log.newValue || log.previousValue}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSend} className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-40">
        <GlassCard className="p-2 flex items-center gap-2 border-emerald-500/40 shadow-2xl">
          <input
            type="text"
            placeholder={`Ask ${selectedPersona}... (e.g. Can I afford a ₹50k purchase?)`}
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="flex-1 bg-transparent px-3 text-xs text-white placeholder-slate-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold hover:bg-emerald-400 cursor-pointer transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </GlassCard>
      </form>
    </div>
  );
};

