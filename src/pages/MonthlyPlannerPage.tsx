import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  TrendingUp,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  List,
  Target,
  Plus,
} from 'lucide-react';
import {
  EmiItem,
  InvestmentItem,
  SavingItem,
  RecurringExpense,
  Expense,
} from '../types.js';
import { BottomSheet } from '../components/ui/BottomSheet.js';
import { WealthTimeline, TimelineEventItem } from '../components/ui/WealthTimeline.js';
import { GlassCard } from '../components/ui/GlassCard.js';

import { SpendTrackApi } from '../services/api.js';

interface MonthlyPlannerPageProps {
  incomes?: any[];
  emis?: EmiItem[];
  investments?: InvestmentItem[];
  savings?: SavingItem[];
  recurringExpenses?: RecurringExpense[];
  expenses?: Expense[];
  onOpenBudgets?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenAddExpense?: () => void;
}

export interface PlannerEvent {
  id: string;
  day: number;
  title: string;
  amount: number;
  type: 'Salary' | 'EMI' | 'SIP' | 'RD' | 'FD' | 'Goal' | 'Insurance' | 'GST' | 'Property Tax' | 'Vehicle Service' | 'Birthday' | 'Reminder';
  status: 'Upcoming' | 'Paid' | 'Overdue';
  categoryLabel: string;
}

export const MonthlyPlannerPage: React.FC<MonthlyPlannerPageProps> = ({
  incomes = [],
  emis = [],
  investments = [],
  savings = [],
  recurringExpenses = [],
  expenses = [],
  onOpenBudgets,
  onNavigateToTab,
  onOpenAddExpense,
}) => {
  const [activeView, setActiveView] = useState<'calendar' | 'timeline'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ day: number; events: PlannerEvent[] } | null>(null);
  const [budgetData, setBudgetData] = useState<any>(null);

  useEffect(() => {
    SpendTrackApi.getBudgetInsights().then(setBudgetData).catch(() => {});
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDateNum = today.getDate();

  const totalBudget = Number(budgetData?.totalBudget) || 0;
  const totalSpent = Number(budgetData?.totalSpent) || 0;
  const remainingBudget = Number(budgetData?.remaining) || 0;
  const remainingDays = Math.max(1, daysInMonth - todayDateNum + 1);
  const dailySafeSpend = remainingBudget > 0 ? Math.round(remainingBudget / remainingDays) : 0;

  // Synthesize events strictly from authenticated user real records
  const events: PlannerEvent[] = [];
  const timelineItems: TimelineEventItem[] = [];

  // 1. User Income Credits
  incomes.forEach((inc) => {
    const payDay = Math.min(Math.max(1, Number(inc.payDay) || Number(String(inc.date || '').split('-')?.[2]) || 1), daysInMonth);
    const amt = Number(inc.amount) || 0;
    const title = inc.source || inc.title || 'Income Credit';
    events.push({
      id: `inc-${inc.id || Math.random()}`,
      day: payDay,
      title,
      amount: amt,
      type: 'Salary',
      status: isCurrentMonth && todayDateNum >= payDay ? 'Paid' : 'Upcoming',
      categoryLabel: 'Verified Income Credit',
    });
    timelineItems.push({
      id: `tl-inc-${inc.id || Math.random()}`,
      dateStr: `${monthName.substring(0, 3)} ${payDay < 10 ? '0' + payDay : payDay}`,
      title,
      amount: amt,
      type: 'Salary',
      categoryLabel: 'Monthly Inflow',
    });
  });

  // 2. User EMIs
  emis.forEach((emi) => {
    const due = Math.min(Math.max(1, Number(emi.dueDay) || 1), daysInMonth);
    let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
    if (isCurrentMonth && todayDateNum > due) status = 'Paid';

    const title = `${emi.title}${emi.bank ? ` (${emi.bank})` : ''}`;
    const amt = Number(emi.amount) || 0;

    events.push({
      id: `emi-${emi.id}`,
      day: due,
      title,
      amount: amt,
      type: 'EMI',
      status,
      categoryLabel: 'Loan EMI Payment',
    });

    timelineItems.push({
      id: `tl-emi-${emi.id}`,
      dateStr: `${monthName.substring(0, 3)} ${due < 10 ? '0' + due : due}`,
      title,
      amount: amt,
      type: 'EMI',
      categoryLabel: 'Loan EMI Payment',
    });
  });

  // 3. User Investments - SIP
  investments.forEach((inv) => {
    if (inv.isActive === false) return;
    const dateObj = inv.nextDate ? new Date(inv.nextDate) : new Date();
    const day = Math.min(Math.max(1, !isNaN(dateObj.getDate()) ? dateObj.getDate() : 1), daysInMonth);
    let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
    if (isCurrentMonth && todayDateNum > day) status = 'Paid';

    const title = `${inv.title}${inv.provider ? ` (${inv.provider})` : ''}`;
    const amt = Number(inv.amount) || 0;

    events.push({
      id: `inv-${inv.id}`,
      day,
      title,
      amount: amt,
      type: 'SIP',
      status,
      categoryLabel: 'SIP Deposit',
    });

    timelineItems.push({
      id: `tl-inv-${inv.id}`,
      dateStr: `${monthName.substring(0, 3)} ${day < 10 ? '0' + day : day}`,
      title,
      amount: amt,
      type: 'SIP',
      categoryLabel: 'Wealth SIP',
    });
  });

  // 4. User Savings - RD & FD
  savings.forEach((sav) => {
    const isFD = sav.type === 'FD';
    const day = Math.min(Math.max(1, Number((sav as any).depositDay) || 5), daysInMonth);
    const amount = Number(sav.monthlyContribution) || Number((sav as any).targetAmount) || 0;

    events.push({
      id: `sav-${sav.id}`,
      day,
      title: `${sav.title} (${sav.type})`,
      amount,
      type: isFD ? 'FD' : 'RD',
      status: isCurrentMonth && todayDateNum > day ? 'Paid' : 'Upcoming',
      categoryLabel: isFD ? 'Fixed Deposit' : 'Recurring Deposit',
    });

    timelineItems.push({
      id: `tl-sav-${sav.id}`,
      dateStr: `${monthName.substring(0, 3)} ${day < 10 ? '0' + day : day}`,
      title: `${sav.title} (${sav.type})`,
      amount,
      type: isFD ? 'FD' : 'RD',
      categoryLabel: isFD ? 'FD Deposit' : 'RD Deposit',
    });
  });

  const getRecurringCategoryLabel = (bill: RecurringExpense): string => {
    const category = bill.category;

    if (typeof category === 'string' && category.trim()) {
      return category;
    }

    if (category && typeof category === 'object' && 'name' in category) {
      return typeof category.name === 'string' && category.name.trim()
        ? category.name
        : 'Recurring Payment';
    }

    return 'Recurring Payment';
  };

  // 5. User Recurring Expenses & Bills
  recurringExpenses.forEach((bill) => {
    let day = 1;
    if (bill.dueDate) {
      const d = new Date(bill.dueDate);
      if (!isNaN(d.getDate())) day = d.getDate();
    } else if ((bill as any).billingCycle) {
      const match = String((bill as any).billingCycle).match(/\d+/);
      if (match) day = parseInt(match[0], 10);
    }
    day = Math.min(Math.max(1, day), daysInMonth);

    let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
    if (isCurrentMonth && todayDateNum > day) status = 'Paid';

    const title = bill.title || (bill as any).name || 'Recurring Bill';
    const amount = Number(bill.amount) || 0;
    const categoryLabel = getRecurringCategoryLabel(bill);

    events.push({
      id: `rec-${bill.id}`,
      day,
      title,
      amount,
      type: 'Reminder',
      status,
      categoryLabel,
    });

    timelineItems.push({
      id: `tl-rec-${bill.id}`,
      dateStr: `${monthName.substring(0, 3)} ${day < 10 ? '0' + day : day}`,
      title,
      amount,
      type: 'Reminder',
      categoryLabel,
    });
  });

  // Helper function for event colors
  const getEventBadgeStyle = (type: PlannerEvent['type']) => {
    switch (type) {
      case 'Salary':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'EMI':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'SIP':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'RD':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'FD':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Insurance':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'GST':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'Property Tax':
        return 'bg-amber-600/20 text-amber-300 border-amber-600/30';
      case 'Vehicle Service':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'Birthday':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Goal':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case 'Reminder':
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      {/* Planner Header */}
      <GlassCard padding="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">{monthName}</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Financial Calendar 2.0 • Salary, EMIs, SIPs, Insurance, GST, Vehicle, & Family Milestones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher Pills */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === 'calendar'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Calendar Grid</span>
              </button>
              <button
                onClick={() => setActiveView('timeline')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === 'timeline'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Wealth Timeline</span>
              </button>
            </div>

            {/* Date Nav */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-white/10">
              <button onClick={prevMonth} className="p-2 rounded-xl text-slate-400 hover:text-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 rounded-xl text-xs font-bold text-slate-200">
                Today
              </button>
              <button onClick={nextMonth} className="p-2 rounded-xl text-slate-400 hover:text-white">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Daily Safe Spend & Budget vs Actual Banner */}
      <GlassCard padding="p-5" className="relative overflow-hidden border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                Safe Spend Allowance
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {remainingDays} days remaining
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              Safe to spend today: <span className="text-emerald-400 font-mono">₹{dailySafeSpend.toLocaleString('en-IN')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Budget: ₹{totalBudget.toLocaleString('en-IN')} • Spent: ₹{totalSpent.toLocaleString('en-IN')} • Left: ₹{remainingBudget.toLocaleString('en-IN')}
            </p>
          </div>

          {onOpenBudgets && (
            <button
              onClick={onOpenBudgets}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Manage Budgets
            </button>
          )}
        </div>
      </GlassCard>

      {/* Color Code Legend */}
      <GlassCard padding="p-4" className="flex items-center gap-2.5 overflow-x-auto scrollbar-none text-xs font-extrabold">
        <span className="text-slate-400 uppercase tracking-widest text-[10px] shrink-0">Life Categories:</span>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">● Salary</span>
        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">● EMI</span>
        <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">● SIP</span>
        <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">● Insurance</span>
        <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">● GST/Tax</span>
        <span className="px-2.5 py-1 rounded-full bg-amber-600/20 text-amber-300 border border-amber-600/30 shrink-0">● Property Tax</span>
        <span className="px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0">● Vehicle Care</span>
        <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 shrink-0">● Birthday/Milestone</span>
      </GlassCard>

      {/* Empty State Banner when user has no planner records */}
      {events.length === 0 && (
        <GlassCard padding="p-6 sm:p-8" className="text-center space-y-4 border border-emerald-500/20 bg-slate-900/60">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-black text-white">Your Planner is empty</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add bills, subscriptions, goals, or reminders to organize your upcoming financial activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {onOpenAddExpense && (
              <button
                onClick={onOpenAddExpense}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense / Bill</span>
              </button>
            )}
            {onNavigateToTab && (
              <>
                <button
                  onClick={() => onNavigateToTab('recurring')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Add Recurring Bill</span>
                </button>
                <button
                  onClick={() => onNavigateToTab('emis')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4 text-rose-400" />
                  <span>Add EMI / Income</span>
                </button>
                <button
                  onClick={() => onNavigateToTab('investments')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>Add Investment / SIP</span>
                </button>
              </>
            )}
          </div>
        </GlassCard>
      )}

      {/* VIEW 1: CALENDAR GRID */}
      {activeView === 'calendar' && (
        <GlassCard padding="p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
            {weekDays.map((d) => (
              <div key={d} className="text-xs font-black uppercase tracking-wider text-slate-400 py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[80px] sm:min-h-[110px] rounded-2xl bg-slate-900/30 border border-white/5 opacity-30" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isToday = isCurrentMonth && dayNum === todayDateNum;
              const dayEvents = events.filter((e) => e.day === dayNum);

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDayEvents({ day: dayNum, events: dayEvents })}
                  className={`min-h-[80px] sm:min-h-[110px] p-2 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isToday
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center'
                          : 'text-white'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">{dayEvents.length}</span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg border truncate ${getEventBadgeStyle(
                          evt.type
                        )}`}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] font-extrabold text-slate-400 px-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* VIEW 2: WEALTH TIMELINE */}
      {activeView === 'timeline' && (
        <GlassCard padding="p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Chronological Wealth Timeline
          </h3>
          <WealthTimeline events={timelineItems} />
        </GlassCard>
      )}

      {/* Bottom Sheet Day View */}
      <BottomSheet
        isOpen={Boolean(selectedDayEvents)}
        onClose={() => setSelectedDayEvents(null)}
        title={selectedDayEvents ? `Commitments for ${selectedDayEvents.day} ${monthName}` : ''}
        subtitle="Itemized commitments, bills, & life milestone events"
      >
        {selectedDayEvents && selectedDayEvents.events.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No scheduled bills, EMIs, or SIP deposits for this date.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayEvents?.events.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-white">{evt.title}</h4>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${getEventBadgeStyle(evt.type)}`}>
                      {evt.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{evt.categoryLabel} • Status: <span className={evt.status === 'Paid' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{evt.status}</span></p>
                </div>
                <span className="text-sm font-black text-white font-mono">
                  ₹{evt.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
