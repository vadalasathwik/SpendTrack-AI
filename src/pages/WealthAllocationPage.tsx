import React, { useState } from 'react';
import {
  PieChart as PieIcon,
  TrendingUp,
  CreditCard,
  PiggyBank,
  DollarSign,
  Sliders,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';
import { PlannerSummary } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';

interface WealthAllocationPageProps {
  plannerSummary: PlannerSummary;
}

export const WealthAllocationPage: React.FC<WealthAllocationPageProps> = ({
  plannerSummary,
}) => {
  const baseIncome = plannerSummary.income || 198708;

  // Manual Sliders State
  const [emiPct, setEmiPct] = useState(plannerSummary.income > 0 ? Math.round((plannerSummary.emi / plannerSummary.income) * 100) : 40);
  const [invPct, setInvPct] = useState(plannerSummary.income > 0 ? Math.round((plannerSummary.investments / plannerSummary.income) * 100) : 15);
  const [savPct, setSavPct] = useState(plannerSummary.income > 0 ? Math.round((plannerSummary.savings / plannerSummary.income) * 100) : 10);
  const [livingPct, setLivingPct] = useState(plannerSummary.income > 0 ? Math.round((plannerSummary.living / plannerSummary.income) * 100) : 25);

  const allocatedTotalPct = emiPct + invPct + savPct + livingPct;
  const bufferPct = Math.max(0, 100 - allocatedTotalPct);

  // Dynamic Dollar Amounts for User Allocation
  const emiAmount = Math.round((baseIncome * emiPct) / 100);
  const invAmount = Math.round((baseIncome * invPct) / 100);
  const savAmount = Math.round((baseIncome * savPct) / 100);
  const livingAmount = Math.round((baseIncome * livingPct) / 100);
  const bufferAmount = Math.round((baseIncome * bufferPct) / 100);

  // PHASE 4: WEALTH ALLOCATION AI INPUTS & ENGINE
  const [riskProfile, setRiskProfile] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [emergencyMonths, setEmergencyMonths] = useState<number>(6);
  const [financialGoal, setFinancialGoal] = useState<'House' | 'Retirement' | 'Gold' | 'Emergency' | 'Car' | 'Education'>('Retirement');

  // Compute AI Recommendation Percentages (Does NOT overwrite user sliders)
  const getAiRecommendation = () => {
    let recLiving = 35;
    let recEmi = 25;
    let recSip = 20;
    let recRd = 10;
    let recEmergency = 10;

    if (riskProfile === 'LOW') {
      recLiving = 40;
      recEmi = 25;
      recSip = 10;
      recRd = 15;
      recEmergency = 10;
    } else if (riskProfile === 'HIGH') {
      recLiving = 30;
      recEmi = 20;
      recSip = 30;
      recRd = 10;
      recEmergency = 10;
    }

    if (financialGoal === 'House' || financialGoal === 'Car') {
      recRd += 5;
      recSip = Math.max(5, recSip - 5);
    } else if (financialGoal === 'Gold') {
      recSip += 5;
      recLiving -= 5;
    }

    return {
      recLiving,
      recEmi,
      recSip,
      recRd,
      recEmergency,
      recLivingAmt: Math.round((baseIncome * recLiving) / 100),
      recEmiAmt: Math.round((baseIncome * recEmi) / 100),
      recSipAmt: Math.round((baseIncome * recSip) / 100),
      recRdAmt: Math.round((baseIncome * recRd) / 100),
      recEmergAmt: Math.round((baseIncome * recEmergency) / 100),
    };
  };

  const aiRec = getAiRecommendation();

  const resetSliders = () => {
    setEmiPct(40);
    setInvPct(15);
    setSavPct(10);
    setLivingPct(25);
  };

  return (
    <div className="space-y-8 pb-16 max-w-[1440px] mx-auto">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <PieIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Wealth Allocation AI Planner 🏆</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Compare your manual allocation against AI-guided wealth recommendations.
          </p>
        </div>

        <button
          onClick={resetSliders}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-[14px] flex items-center gap-1.5 cursor-pointer self-start md:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* PHASE 4: WEALTH ALLOCATION AI CONTROL PANEL */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-[20px] shadow-xl border border-indigo-900/60 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-base font-extrabold tracking-tight">AI Wealth Allocation Engine</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
              Risk Profile
            </label>
            <select
              value={riskProfile}
              onChange={(e) => setRiskProfile(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-800 border border-slate-700 text-xs font-bold text-white"
            >
              <option value="LOW">LOW — Capital Preservation</option>
              <option value="MEDIUM">MEDIUM — Balanced Growth</option>
              <option value="HIGH">HIGH — Aggressive Growth</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
              Emergency Cushion
            </label>
            <select
              value={emergencyMonths}
              onChange={(e) => setEmergencyMonths(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-800 border border-slate-700 text-xs font-bold text-white"
            >
              <option value={3}>3 Months Expense Buffer</option>
              <option value={6}>6 Months Expense Buffer (Recommended)</option>
              <option value={12}>12 Months Expense Buffer</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
              Primary Goal
            </label>
            <select
              value={financialGoal}
              onChange={(e) => setFinancialGoal(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-800 border border-slate-700 text-xs font-bold text-white"
            >
              <option value="Retirement">Retirement Wealth</option>
              <option value="House">House Down Payment</option>
              <option value="Gold">Gold Accumulation</option>
              <option value="Emergency">Emergency Fund First</option>
              <option value="Car">Car Purchase</option>
              <option value="Education">Children Education</option>
            </select>
          </div>
        </div>
      </div>

      {/* COMPARISON TABLE: YOUR ALLOCATION VS RECOMMENDED */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Your Allocation vs AI Recommended Allocation</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Your %</th>
                <th className="py-3 px-2">Your Monthly ₹</th>
                <th className="py-3 px-2 text-emerald-600">AI Recommended %</th>
                <th className="py-3 px-2 text-emerald-600">AI Recommended ₹</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
              <tr>
                <td className="py-3 px-2 font-bold text-teal-600">Living Essentials</td>
                <td className="py-3 px-2">{livingPct}%</td>
                <td className="py-3 px-2">{formatCurrency(livingAmount)}</td>
                <td className="py-3 px-2 font-bold text-emerald-600">{aiRec.recLiving}%</td>
                <td className="py-3 px-2 font-bold text-emerald-600">{formatCurrency(aiRec.recLivingAmt)}</td>
              </tr>
              <tr>
                <td className="py-3 px-2 font-bold text-purple-600">Loan EMIs</td>
                <td className="py-3 px-2">{emiPct}%</td>
                <td className="py-3 px-2">{formatCurrency(emiAmount)}</td>
                <td className="py-3 px-2 font-bold text-emerald-600">{aiRec.recEmi}%</td>
                <td className="py-3 px-2 font-bold text-emerald-600">{formatCurrency(aiRec.recEmiAmt)}</td>
              </tr>
              <tr>
                <td className="py-3 px-2 font-bold text-blue-600">Investments (SIP)</td>
                <td className="py-3 px-2">{invPct}%</td>
                <td className="py-3 px-2">{formatCurrency(invAmount)}</td>
                <td className="py-3 px-2 font-bold text-emerald-600">{aiRec.recSip}%</td>
                <td className="py-3 px-2 font-bold text-emerald-600">{formatCurrency(aiRec.recSipAmt)}</td>
              </tr>
              <tr>
                <td className="py-3 px-2 font-bold text-amber-600">Savings (RD)</td>
                <td className="py-3 px-2">{savPct}%</td>
                <td className="py-3 px-2">{formatCurrency(savAmount)}</td>
                <td className="py-3 px-2 font-bold text-emerald-600">{aiRec.recRd}%</td>
                <td className="py-3 px-2 font-bold text-emerald-600">{formatCurrency(aiRec.recRdAmt)}</td>
              </tr>
              <tr>
                <td className="py-3 px-2 font-bold text-emerald-600">Free Cash Surplus</td>
                <td className="py-3 px-2">{bufferPct}%</td>
                <td className="py-3 px-2">{formatCurrency(bufferAmount)}</td>
                <td className="py-3 px-2 font-bold text-emerald-600">{aiRec.recEmergency}%</td>
                <td className="py-3 px-2 font-bold text-emerald-600">{formatCurrency(aiRec.recEmergAmt)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DOUGHNUT VISUALIZATION & MANUAL ALLOCATION SLIDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Visual Segment Bar */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Your Live Breakdown</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live percentage representation of your current slider choices.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-full h-6 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              <div style={{ width: `${emiPct}%` }} className="bg-purple-500 h-full transition-all duration-300" />
              <div style={{ width: `${invPct}%` }} className="bg-blue-500 h-full transition-all duration-300" />
              <div style={{ width: `${savPct}%` }} className="bg-amber-500 h-full transition-all duration-300" />
              <div style={{ width: `${livingPct}%` }} className="bg-teal-500 h-full transition-all duration-300" />
              <div style={{ width: `${bufferPct}%` }} className="bg-emerald-500 h-full transition-all duration-300" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
                <span>EMIs: {emiPct}% ({formatCurrency(emiAmount)})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span>Investments: {invPct}% ({formatCurrency(invAmount)})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <span>Savings: {savPct}% ({formatCurrency(savAmount)})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500 shrink-0" />
                <span>Living: {livingPct}% ({formatCurrency(livingAmount)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Interactive Sliders */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Interactive Sliders</span>
            </h2>
            <span className="text-xs font-bold text-slate-400">Total Allocated: {allocatedTotalPct}%</span>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-purple-700 dark:text-purple-300">EMIs & Loans</span>
                <span>{emiPct}% ({formatCurrency(emiAmount)})</span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                value={emiPct}
                onChange={(e) => setEmiPct(parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-blue-600 dark:text-blue-400">Investments (SIP)</span>
                <span>{invPct}% ({formatCurrency(invAmount)})</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={invPct}
                onChange={(e) => setInvPct(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-amber-600 dark:text-amber-400">Savings (RD)</span>
                <span>{savPct}% ({formatCurrency(savAmount)})</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={savPct}
                onChange={(e) => setSavPct(parseInt(e.target.value, 10))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-teal-600 dark:text-teal-400">Living Essentials</span>
                <span>{livingPct}% ({formatCurrency(livingAmount)})</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={livingPct}
                onChange={(e) => setLivingPct(parseInt(e.target.value, 10))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
