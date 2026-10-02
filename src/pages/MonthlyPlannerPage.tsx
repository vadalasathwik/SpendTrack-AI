import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  TrendingUp,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  List,
  Target,
  Repeat,
  ShieldCheck,
  ArrowDownLeft,
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
import { formatCurrency } from '../utils/calculations.js';

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

export interface UnifiedPlannerItem {
  id: string;
  day: number;
  title: string;
  amount: number;
  dateStr: string;
  type: 'Salary' | 'EMI' | 'SIP' | 'RD' | 'FD' | 'Goal' | 'Insurance' | 'Recurring Bill' | 'Reminder';
  status: 'Upcoming' | 'Paid' | 'Overdue';
  categoryLabel: string;
  rawDate: Date;
}

// React #31 Safety Helper: Ensure category objects are normalized to string
export const getRecurringCategoryLabel = (bill: RecurringExpense | any): string => {
  if (!bill) return 'Recurring Payment';
  const category = bill.category;

  if (typeof category === 'string' && category.trim()) {
    return category.trim();
  }

  if (category && typeof category === 'object' && 'name' in category) {
    if (typeof category.name === 'string' && category.name.trim()) {
      return category.name.trim();
    }
  }

  return 'Recurring Payment';
};

const safeString = (val: any, fallback: string = ''): string => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (val && typeof val === 'object' && 'name' in val && typeof val.name === 'string') return val.name;
  if (val && typeof val === 'object' && 'title' in val && typeof val.title === 'string') return val.title;
  return fallback;
};

export const MonthlyPlannerPage: React.FC<MonthlyPlannerPageProps> = ({
  incomes = [],
  emis = [],
  investments = [],
  savings = [],
  recurringExpenses = [],
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'timeline' | 'calendar' | 'recurring'>('upcoming');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ day: number; events: UnifiedPlannerItem[] } | null>(null);
  const [upcomingFilter, setUpcomingFilter] = useState<string>('ALL');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDateNum = today.getDate();

  // Process all unified planner items with strict string normalization
  const unifiedItems = useMemo<UnifiedPlannerItem[]>(() => {
    const items: UnifiedPlannerItem[] = [];

    // 1. User Incomes (Salary, Freelance, Passive)
    incomes.forEach((inc) => {
      const payDay = Math.min(Math.max(1, Number(inc.payDay) || Number(String(inc.date || '').split('-')?.[2]) || 1), daysInMonth);
      const amt = Number(inc.amount) || 0;
      const title = safeString(inc.source || inc.title, 'Salary Inflow');
      const itemDate = new Date(year, month, payDay);

      let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
      if (isCurrentMonth && todayDateNum >= payDay) status = 'Paid';

      items.push({
        id: `inc-${inc.id || Math.random()}`,
        day: payDay,
        title,
        amount: amt,
        dateStr: itemDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        type: 'Salary',
        status,
        categoryLabel: 'Verified Income Credit',
        rawDate: itemDate,
      });
    });

    // 2. User EMIs
    emis.forEach((emi) => {
      const due = Math.min(Math.max(1, Number(emi.dueDay) || 1), daysInMonth);
      const amt = Number(emi.amount) || 0;
      const title = safeString(`${emi.title}${emi.bank ? ` (${emi.bank})` : ''}`, 'Loan EMI');
      const itemDate = new Date(year, month, due);

      let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
      if (isCurrentMonth && todayDateNum > due) status = 'Paid';

      items.push({
        id: `emi-${emi.id || Math.random()}`,
        day: due,
        title,
        amount: amt,
        dateStr: itemDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        type: 'EMI',
        status,
        categoryLabel: 'Loan EMI Payment',
        rawDate: itemDate,
      });
    });

    // 3. User Investments - SIP
    investments.forEach((inv) => {
      if (inv.isActive === false) return;
      const dateObj = inv.nextDate ? new Date(inv.nextDate) : new Date();
      const day = Math.min(Math.max(1, !isNaN(dateObj.getDate()) ? dateObj.getDate() : 1), daysInMonth);
      const amt = Number(inv.amount) || 0;
      const title = safeString(`${inv.title}${inv.provider ? ` (${inv.provider})` : ''}`, 'SIP Investment');
      const itemDate = new Date(year, month, day);

      let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
      if (isCurrentMonth && todayDateNum > day) status = 'Paid';

      items.push({
        id: `inv-${inv.id || Math.random()}`,
        day,
        title,
        amount: amt,
        dateStr: itemDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        type: 'SIP',
        status,
        categoryLabel: 'SIP Deposit',
        rawDate: itemDate,
      });
    });

    // 4. User Savings - RD & FD
    savings.forEach((sav) => {
      const isFD = sav.type === 'FD';
      const day = Math.min(Math.max(1, Number((sav as any).depositDay) || 5), daysInMonth);
      const amt = Number(sav.monthlyContribution) || Number((sav as any).targetAmount) || 0;
      const title = safeString(`${sav.title} (${sav.type})`, 'Savings Goal');
      const itemDate = new Date(year, month, day);

      let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
      if (isCurrentMonth && todayDateNum > day) status = 'Paid';

      items.push({
        id: `sav-${sav.id || Math.random()}`,
        day,
        title,
        amount: amt,
        dateStr: itemDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        type: isFD ? 'FD' : 'RD',
        status,
        categoryLabel: isFD ? 'Fixed Deposit' : 'Recurring Deposit',
        rawDate: itemDate,
      });
    });

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

      const amt = Number(bill.amount) || 0;
      const title = safeString(bill.title || (bill as any).name, 'Recurring Bill');
      const categoryLabel = getRecurringCategoryLabel(bill);
      const itemDate = new Date(year, month, day);

      let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
      if (isCurrentMonth && todayDateNum > day) status = 'Paid';

      items.push({
        id: `rec-${bill.id || Math.random()}`,
        day,
        title,
        amount: amt,
        dateStr: itemDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        type: 'Recurring Bill',
        status,
        categoryLabel,
        rawDate: itemDate,
      });
    });

    return items.sort((a, b) => a.day - b.day);
  }, [incomes, emis, investments, savings, recurringExpenses, daysInMonth, year, month, isCurrentMonth, todayDateNum]);

  // Timeline items formatted for WealthTimeline component
  const timelineItems = useMemo<TimelineEventItem[]>(() => {
    return unifiedItems.map((item) => {
      let type: TimelineEventItem['type'] = 'Reminder';
      if (item.type === 'Salary') type = 'Salary';
      else if (item.type === 'EMI') type = 'EMI';
      else if (item.type === 'SIP') type = 'SIP';
      else if (item.type === 'RD') type = 'RD';
      else if (item.type === 'FD') type = 'FD';
      else if (item.type === 'Goal') type = 'Goal';

      return {
        id: item.id,
        dateStr: item.dateStr,
        title: item.title,
        amount: item.amount,
        type,
        categoryLabel: item.categoryLabel,
      };
    });
  }, [unifiedItems]);

  // Filtered items for Upcoming view
  const upcomingFilteredItems = useMemo(() => {
    if (upcomingFilter === 'ALL') return unifiedItems;
    if (upcomingFilter === 'EMI') return unifiedItems.filter((i) => i.type === 'EMI');
    if (upcomingFilter === 'SIP') return unifiedItems.filter((i) => i.type === 'SIP');
    if (upcomingFilter === 'BILLS') return unifiedItems.filter((i) => i.type === 'Recurring Bill');
    if (upcomingFilter === 'SAVINGS') return unifiedItems.filter((i) => i.type === 'RD' || i.type === 'FD');
    if (upcomingFilter === 'INCOME') return unifiedItems.filter((i) => i.type === 'Salary');
    return unifiedItems;
  }, [unifiedItems, upcomingFilter]);

  // Helper function for badge styles
  const getItemBadgeStyle = (type: UnifiedPlannerItem['type']) => {
    switch (type) {
      case 'Salary':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'EMI':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'SIP':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'RD':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'FD':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'Insurance':
        return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
      case 'Recurring Bill':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 'Goal':
        return 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30';
      case 'Reminder':
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
    }
  };

  const getItemIcon = (type: UnifiedPlannerItem['type']) => {
    switch (type) {
      case 'Salary':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
      case 'EMI':
        return <CreditCard className="w-4 h-4 text-rose-500" />;
      case 'SIP':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      case 'RD':
      case 'FD':
        return <PiggyBank className="w-4 h-4 text-amber-500" />;
      case 'Insurance':
        return <ShieldCheck className="w-4 h-4 text-cyan-500" />;
      case 'Recurring Bill':
        return <Clock className="w-4 h-4 text-indigo-500" />;
      case 'Goal':
        return <Target className="w-4 h-4 text-teal-500" />;
      default:
        return <CalendarIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 pb-28 max-w-2xl mx-auto animate-in fade-in duration-200">
      {/* ------------------------------------------------------------- */}
      {/* Product Concept Banner: Past vs Future                       */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-slate-900/40 border border-emerald-500/20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Financial Planner
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Future Commitments
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              Transactions show the past. Planner shows the future.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Tab Switcher: Upcoming | Timeline | Calendar | Recurring Bills*/}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Upcoming</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recurring')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'recurring'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Bills</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: UPCOMING                                              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {/* Upcoming Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {[
              { id: 'ALL', label: 'All Commitments' },
              { id: 'EMI', label: 'EMIs' },
              { id: 'SIP', label: 'SIPs' },
              { id: 'BILLS', label: 'Bills' },
              { id: 'SAVINGS', label: 'Savings' },
              { id: 'INCOME', label: 'Incomes' },
            ].map((f) => {
              const isSelected = upcomingFilter === f.id;
              return (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setUpcomingFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {upcomingFilteredItems.length === 0 ? (
            <GlassCard padding="p-6" className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">No Upcoming Commitments</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  No scheduled financial commitments match the selected filter for {monthName}.
                </p>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-2.5">
              {upcomingFilteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
                          {item.title}
                        </h4>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${getItemBadgeStyle(item.type)}`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                        {item.categoryLabel} • Due {item.dateStr}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono tracking-tight">
                      {formatCurrency(item.amount)}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'Paid'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : item.status === 'Overdue'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: TIMELINE                                              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'timeline' && (
        <GlassCard padding="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Wealth Timeline Stream
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chronological timeline of upcoming inflows and commitments
              </p>
            </div>
          </div>
          <WealthTimeline events={timelineItems} />
        </GlassCard>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 3: CALENDAR                                              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'calendar' && (
        <GlassCard padding="p-4 sm:p-6" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {monthName} Calendar
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {weekDays.map((d) => (
              <div key={d} className="text-[11px] font-black uppercase text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[64px] sm:min-h-[80px] rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 opacity-30" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isToday = isCurrentMonth && dayNum === todayDateNum;
              const dayEvents = unifiedItems.filter((e) => e.day === dayNum);

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDayEvents({ day: dayNum, events: dayEvents })}
                  className={`min-h-[64px] sm:min-h-[80px] p-1.5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                    isToday
                      ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 1).map((evt) => (
                      <div
                        key={evt.id}
                        className={`text-[8px] font-bold px-1 py-0.5 rounded border truncate ${getItemBadgeStyle(evt.type)}`}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 1 && (
                      <div className="text-[8px] font-extrabold text-slate-400 px-0.5">
                        +{dayEvents.length - 1} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 4: RECURRING BILLS                                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'recurring' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Repeat className="w-4 h-4 text-emerald-500" />
                Recurring Subscriptions & Bills
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Active recurring expenses with category string normalization
              </p>
            </div>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('recurring')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manage</span>
              </button>
            )}
          </div>

          {recurringExpenses.length === 0 ? (
            <GlassCard padding="p-6" className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center mx-auto">
                <Repeat className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">No Recurring Bills Configured</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set up subscriptions, broadband, or utilities to automate future bill planning.
                </p>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-2.5">
              {recurringExpenses.map((bill) => {
                const categoryLabel = getRecurringCategoryLabel(bill);
                const title = safeString(bill.title || (bill as any).name, 'Recurring Bill');
                const amt = Number(bill.amount) || 0;

                return (
                  <div
                    key={bill.id}
                    className="p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
                          {title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                          {categoryLabel} • {bill.billingCycle || 'Monthly'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono tracking-tight">
                        {formatCurrency(amt)}
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        Recurring
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Bottom Sheet Day View Modal                                    */}
      {/* ------------------------------------------------------------- */}
      <BottomSheet
        isOpen={Boolean(selectedDayEvents)}
        onClose={() => setSelectedDayEvents(null)}
        title={selectedDayEvents ? `Commitments for ${selectedDayEvents.day} ${monthName}` : ''}
        subtitle="Itemized future commitments & planned events"
      >
        {selectedDayEvents && selectedDayEvents.events.length === 0 ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            No scheduled bills, EMIs, or SIP deposits for this date.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayEvents?.events.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{evt.title}</h4>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${getItemBadgeStyle(evt.type)}`}>
                      {evt.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {evt.categoryLabel} • Status:{' '}
                    <span className={evt.status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                      {evt.status}
                    </span>
                  </p>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  {formatCurrency(evt.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
