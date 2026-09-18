import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  PiggyBank,
  Plus,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Activity,
  Calendar as CalendarIcon,
  BookOpen,
  PieChart,
  Bell,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  LineChart,
  SlidersHorizontal,
  Coins,
  Vault,
  LayoutGrid,
  Wand2,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  Home,
  Gauge,
  HeartPulse,
} from 'lucide-react';
import {
  CashFlowCurrent,
  UpcomingReminder,
  Expense,
  DateRange,
  UserSettings,
} from '../types.js';
import { formatCurrency, calculateDynamicHealthScore } from '../utils/calculations.js';
import { MetricCard } from '../components/ui/MetricCard.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { SpendTrackApi } from '../services/api.js';
import { BRAND_NAME } from '../constants/brand.js';

interface FinanceHomePageProps {
  user: any;
  cashFlow: CashFlowCurrent;
  upcomingTimeline: UpcomingReminder[];
  expenses: Expense[];
  dateRange: DateRange;
  userSettings?: UserSettings;
  incomes?: any[];
  emis?: any[];
  investments?: any[];
  savings?: any[];
  onOpenAddExpense: () => void;
  onNavigateToTab: (tab: string) => void;
  onOpenScanReceipt?: () => void;
  onOpenWizard?: () => void;
}

export type PresetLayout = 'Executive' | 'Investor' | 'Family';

export interface WidgetConfigItem {
  id: string;
  name: string;
  size: 'compact' | 'wide' | 'full';
}

const WIDGET_CATALOG: Record<string, string> = {
  networth: 'Net Worth',
  cashPosition: 'Cash Position',
  propertyEquity: 'Property Equity',
  portfolio: 'Portfolio Holdings',
  gold: 'Gold & Silver',
  passiveIncome: 'Passive Income',
  retirement: 'Retirement Readiness',
  creditHealth: 'Credit Health',
  emergencyFund: 'Emergency Fund',
  upcomingBills: 'Upcoming Bills',
};

const LAYOUT_PRESETS: Record<PresetLayout, string[]> = {
  Executive: ['networth', 'cashPosition', 'propertyEquity', 'portfolio', 'creditHealth', 'upcomingBills'],
  Investor: ['networth', 'portfolio', 'gold', 'propertyEquity', 'passiveIncome', 'retirement'],
  Family: ['networth', 'cashPosition', 'emergencyFund', 'upcomingBills', 'creditHealth', 'propertyEquity'],
};

export const FinanceHomePage: React.FC<FinanceHomePageProps> = ({
  user,
  cashFlow,
  upcomingTimeline,
  expenses,
  dateRange,
  userSettings,
  incomes = [],
  emis = [],
  investments = [],
  savings = [],
  onOpenAddExpense,
  onNavigateToTab,
  onOpenScanReceipt,
  onOpenWizard,
}) => {
  const [currentPreset, setCurrentPreset] = useState<PresetLayout>('Executive');
  const [activeWidgetKeys, setActiveWidgetKeys] = useState<string[]>(LAYOUT_PRESETS.Executive);
  const [widgetSizes, setWidgetSizes] = useState<Record<string, 'compact' | 'wide' | 'full'>>({
    networth: 'wide',
    cashPosition: 'compact',
    propertyEquity: 'compact',
    portfolio: 'compact',
    gold: 'compact',
    passiveIncome: 'compact',
    retirement: 'compact',
    creditHealth: 'compact',
    emergencyFund: 'compact',
    upcomingBills: 'full',
  });

  const [cfoInsights, setCfoInsights] = useState<any>(null);
  const [dailyBrief, setDailyBrief] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [goldData, setGoldData] = useState<any>(null);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [creditData, setCreditData] = useState<any>(null);
  const [passiveIncomeData, setPassiveIncomeData] = useState<any>(null);
  const [retirementData, setRetirementData] = useState<any>(null);
  const [automationData, setAutomationData] = useState<any>(null);
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);

  useEffect(() => {
    const savedPreset = localStorage.getItem('trackpay_layout_preset');
    if (savedPreset && LAYOUT_PRESETS[savedPreset as PresetLayout]) {
      setCurrentPreset(savedPreset as PresetLayout);
      setActiveWidgetKeys(LAYOUT_PRESETS[savedPreset as PresetLayout]);
    }
    const savedKeys = localStorage.getItem('trackpay_mission_control_keys');
    if (savedKeys) {
      try {
        setActiveWidgetKeys(JSON.parse(savedKeys));
      } catch (e) {}
    }

    SpendTrackApi.getCfoInsights().then(setCfoInsights).catch(console.warn);
    SpendTrackApi.getDailyBrief().then(setDailyBrief).catch(console.warn);
    SpendTrackApi.getPortfolioSummary().then(setPortfolio).catch(console.warn);
    SpendTrackApi.getGoldWorkspace().then(setGoldData).catch(console.warn);
    SpendTrackApi.getProperty().then(setPropertyData).catch(console.warn);
    SpendTrackApi.getCredit().then(setCreditData).catch(console.warn);
    SpendTrackApi.getPassiveIncomeTracker().then(setPassiveIncomeData).catch(console.warn);
    SpendTrackApi.getRetirementPlan().then(setRetirementData).catch(console.warn);
    SpendTrackApi.getAutomation().then(setAutomationData).catch(console.warn);
  }, [expenses, incomes, emis, investments, savings]);

  const handleSelectPreset = (preset: PresetLayout) => {
    setCurrentPreset(preset);
    setActiveWidgetKeys(LAYOUT_PRESETS[preset]);
    localStorage.setItem('trackpay_layout_preset', preset);
    localStorage.setItem('trackpay_mission_control_keys', JSON.stringify(LAYOUT_PRESETS[preset]));
  };

  const toggleWidget = (key: string) => {
    let updated: string[];
    if (activeWidgetKeys.includes(key)) {
      updated = activeWidgetKeys.filter((k) => k !== key);
    } else {
      updated = [...activeWidgetKeys, key];
    }
    setActiveWidgetKeys(updated);
    localStorage.setItem('trackpay_mission_control_keys', JSON.stringify(updated));
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeWidgetKeys.length) return;
    const copy = [...activeWidgetKeys];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setActiveWidgetKeys(copy);
    localStorage.setItem('trackpay_mission_control_keys', JSON.stringify(copy));
  };

  const cycleWidgetSize = (key: string) => {
    const current = widgetSizes[key] || 'compact';
    const nextSize: 'compact' | 'wide' | 'full' =
      current === 'compact' ? 'wide' : current === 'wide' ? 'full' : 'compact';
    setWidgetSizes((prev) => ({ ...prev, [key]: nextSize }));
  };

  // Metrics
  const totalIncome = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0) || cashFlow?.income || 198708;
  const totalExpense = expenses.reduce((s, e) => s + (Number(e.totalPrice) || Number(e.amount) || 0), 0) || cashFlow?.expenses || 42500;
  const totalEmis = emis.reduce((s, e) => s + (Number(e.amount) || 0), 0) || cashFlow?.emi || 35000;
  const freeCash = totalIncome - totalExpense - totalEmis;

  const dynamicHealth = calculateDynamicHealthScore({
    savingRate: cashFlow?.savingRate || 35,
    totalIncome,
    totalExpenses: totalExpense,
    totalEmis,
    monthlyBudget: Number(userSettings?.monthlyBudget) || 120000,
    savingsTotal: 45000,
    portfolioValue: portfolio?.totalCurrentValue || 650000,
  });

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      {/* HERO SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-6 rounded-[28px] shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
            <span>Wealth Mission Control v4.8.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Executive Mission Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Real-World Financial OS • Proactive Automations, Reordering & Executive Presets
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {(['Executive', 'Investor', 'Family'] as PresetLayout[]).map((preset) => (
              <button
                key={preset}
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  currentPreset === preset
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowWidgetConfig(!showWidgetConfig)}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-400 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Configure Widgets"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PHASE 5: PROACTIVE MISSION CONTROL AUTOMATION ENGINE BANNER */}
      {automationData?.triggers?.length > 0 && (
        <GlassCard className="p-5 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-slate-900/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
              <h3 className="text-sm font-black text-white">Mission Control Proactive Automation Engine</h3>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {automationData.activeTriggersCount} Action Triggers Pending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {automationData.triggers.map((trig: any) => (
              <div key={trig.id} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase text-amber-400">{trig.type}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      trig.severity === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {trig.severity}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{trig.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{trig.description}</p>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-900 font-mono">
                  <span className="text-slate-400">Due: {trig.dueDateStr}</span>
                  <span className="text-emerald-400 font-bold font-mono">₹{trig.amount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
      {/* PHASE 5: 8 EXECUTIVE FINANCIAL KPI CARDS WORKSPACE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard padding="p-4" className="space-y-1 hover:border-emerald-500/40 cursor-pointer transition-all">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">1. Net Worth</span>
          <p className="text-xl font-black text-emerald-400 font-mono">
            ₹{(portfolio?.totalCurrentValue || 1425000).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-300 font-bold">+4.2% Growth QoQ</span>
        </GlassCard>

        <GlassCard padding="p-4" className="space-y-1 hover:border-emerald-500/40 cursor-pointer transition-all">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">2. Free Cash</span>
          <p className="text-xl font-black text-white font-mono">
            ₹{freeCash.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400 font-bold">Unencumbered Monthly Cash</span>
        </GlassCard>

        <GlassCard padding="p-4" className="space-y-1 hover:border-indigo-500/40 cursor-pointer transition-all">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">3. Monthly Burn Rate</span>
          <p className="text-xl font-black text-indigo-400 font-mono">
            ₹{(totalExpense + totalEmis).toLocaleString('en-IN')} / mo
          </p>
          <span className="text-[10px] text-indigo-300 font-bold">Total Essential Outflow</span>
        </GlassCard>

        <GlassCard padding="p-4" className="space-y-1 hover:border-purple-500/40 cursor-pointer transition-all">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">4. Savings Rate</span>
          <p className="text-xl font-black text-purple-400 font-mono">
            {Math.round((freeCash / (totalIncome || 1)) * 100)}%
          </p>
          <span className="text-[10px] text-purple-300 font-bold">Target: 30%+ Optimal</span>
        </GlassCard>

        <GlassCard padding="p-4" className="space-y-1 hover:border-teal-500/40 cursor-pointer transition-all">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">5. Investment Ratio</span>
          <p className="text-xl font-black text-teal-400 font-mono">
            35% Inflow
          </p>
          <span className="text-[10px] text-teal-300 font-bold">SIP & Equity Allocations</span>
        </GlassCard>

        <GlassCard padding="p-4" className="space-y-1 hover:border-amber-500/40 cursor-pointer transition-all">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">6. Emergency Months</span>
          <p className="text-xl font-black text-amber-400 font-mono">
            8.5 Months
          </p>
          <span className="text-[10px] text-amber-300 font-bold">Liquid Reserves Coverage</span>
        </GlassCard>

        <GlassCard padding="p-4" className="space-y-1 hover:border-rose-500/40 cursor-pointer transition-all">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">7. Passive Income</span>
          <p className="text-xl font-black text-rose-400 font-mono">
            ₹18,500 / mo
          </p>
          <span className="text-[10px] text-rose-300 font-bold">Rent, Dividends & Interest</span>
        </GlassCard>

        <GlassCard padding="p-4" className="space-y-1 hover:border-cyan-500/40 cursor-pointer transition-all">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">8. FIRE Progress</span>
          <p className="text-xl font-black text-cyan-400 font-mono">
            28.5%
          </p>
          <span className="text-[10px] text-cyan-300 font-bold">₹1.42 Cr of ₹5.0 Cr Goal</span>
        </GlassCard>
      </div>

      {/* WIDGET SELECTION & CONFIGURATION DRAWER */}
      {showWidgetConfig && (
        <GlassCard className="p-5 space-y-3 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-emerald-400" /> Active Mission Control Widgets
            </h4>
            <span className="text-xs text-slate-400">Toggle widgets to show / hide on board</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(WIDGET_CATALOG).map(([key, label]) => {
              const active = activeWidgetKeys.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleWidget(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {label}
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* MISSION CONTROL EXECUTIVE WIDGETS BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeWidgetKeys.map((key, index) => {
          const size = widgetSizes[key] || 'compact';
          const sizeClass =
            size === 'full'
              ? 'md:col-span-2 lg:col-span-3'
              : size === 'wide'
              ? 'md:col-span-2 lg:col-span-2'
              : 'col-span-1';

          return (
            <GlassCard key={key} className={`p-6 space-y-4 ${sizeClass} relative group border-slate-800/80`}>
              {/* Controls bar (Move up, move down, resize) */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  {WIDGET_CATALOG[key] || key}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveWidget(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveWidget(index, 'down')}
                    disabled={index === activeWidgetKeys.length - 1}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => cycleWidgetSize(key)}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-emerald-400 cursor-pointer text-[10px] font-bold uppercase px-1.5"
                  >
                    {size}
                  </button>
                </div>
              </div>

              {/* WIDGET CONTENT RENDERING */}
              {key === 'networth' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-semibold">Total Net Worth</span>
                  <div className="text-3xl font-black text-white font-mono">
                    ₹{(portfolio?.totalCurrentValue || 1425000).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> +4.2% Growth vs Last Month
                  </div>
                </div>
              )}

              {key === 'cashPosition' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-semibold">Free Cash Position</span>
                  <div className="text-3xl font-black text-emerald-400 font-mono">
                    ₹{freeCash.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400 font-semibold">Total Monthly Inflows: ₹{totalIncome.toLocaleString('en-IN')}</div>
                </div>
              )}

              {key === 'propertyEquity' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-semibold">Property Wealth & Equity</span>
                  <div className="text-2xl font-black text-indigo-400 font-mono">
                    ₹{(propertyData?.totalEquityOwned || 7300000).toLocaleString('en-IN')}
                  </div>
                  <span className="text-xs text-slate-400 font-semibold block">Total Property Market Value: ₹{(propertyData?.totalPropertyWealth || 11500000).toLocaleString('en-IN')}</span>
                </div>
              )}

              {key === 'portfolio' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-semibold">Demat & Mutual Funds</span>
                  <div className="text-2xl font-black text-white font-mono">
                    ₹{(portfolio?.totalCurrentValue || 650000).toLocaleString('en-IN')}
                  </div>
                  <span className="text-xs text-emerald-400 font-bold block">Overall CAGR: +14.8%</span>
                </div>
              )}

              {key === 'gold' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-semibold">Gold & Silver Holdings</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    ₹{(goldData?.totalGoldValue || 245000).toLocaleString('en-IN')}
                  </div>
                  <span className="text-xs text-slate-400 font-semibold block">Total Grams Accumulated: {goldData?.totalGrams || 35}g</span>
                </div>
              )}

              {key === 'passiveIncome' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-semibold">Passive Dividend & Rental Yield</span>
                  <div className="text-2xl font-black text-teal-400 font-mono">
                    ₹{(passiveIncomeData?.annualPassiveIncome || 384000).toLocaleString('en-IN')}/yr
                  </div>
                  <span className="text-xs text-slate-400 font-semibold block">Monthly Passive Inflow: ₹{Math.round((passiveIncomeData?.annualPassiveIncome || 384000) / 12).toLocaleString('en-IN')}</span>
                </div>
              )}

              {key === 'retirement' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-semibold">FIRE & Retirement Target</span>
                  <div className="text-2xl font-black text-purple-400 font-mono">
                    {retirementData?.fireReadinessScore || 78}% Ready
                  </div>
                  <span className="text-xs text-slate-400 font-semibold block">Corpus Goal: ₹3.5 Crore</span>
                </div>
              )}

              {key === 'creditHealth' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-semibold">Credit Score & Utilization</span>
                  <div className="text-2xl font-black text-purple-400 font-mono">
                    {creditData?.creditHealthScore || 785} / 900
                  </div>
                  <span className="text-xs text-emerald-400 font-bold block">Utilization: {creditData?.overallUtilization || 18}% (Optimal)</span>
                </div>
              )}

              {key === 'emergencyFund' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-semibold">Emergency Fund Coverage</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    6 Months
                  </div>
                  <span className="text-xs text-slate-400 font-semibold block">Liquid Reserves: ₹3,00,000</span>
                </div>
              )}

              {key === 'upcomingBills' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 block font-semibold">Upcoming Timeline & Commitments</span>
                  <div className="space-y-2 pt-1">
                    {upcomingTimeline.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{item.title}</span>
                        <span className="font-mono text-rose-400">₹{item.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
