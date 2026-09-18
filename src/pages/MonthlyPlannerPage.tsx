import React, { useState } from 'react';
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

interface MonthlyPlannerPageProps {
  emis?: EmiItem[];
  investments?: InvestmentItem[];
  savings?: SavingItem[];
  recurringExpenses?: RecurringExpense[];
  expenses?: Expense[];
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
  emis = [],
  investments = [],
  savings = [],
  recurringExpenses = [],
  expenses = [],
}) => {
  const [activeView, setActiveView] = useState<'calendar' | 'timeline'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ day: number; events: PlannerEvent[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDateNum = today.getDate();

  // Synthesize events for Financial Calendar 2.0
  const events: PlannerEvent[] = [];
  const timelineItems: TimelineEventItem[] = [];

  // 1. Salary (1st of month)
  events.push({
    id: 'evt-salary',
    day: 1,
    title: 'Primary Salary Credit',
    amount: 120000,
    type: 'Salary',
    status: isCurrentMonth && todayDateNum >= 1 ? 'Paid' : 'Upcoming',
    categoryLabel: 'Verified Income Credit',
  });
  timelineItems.push({
    id: 'tl-salary',
    dateStr: `${monthName.substring(0, 3)} 01`,
    title: 'Primary Salary Credit',
    amount: 120000,
    type: 'Salary',
    categoryLabel: 'Monthly Inflow',
  });

  // 2. EMIs
  emis.forEach((emi) => {
    const due = Math.min(emi.dueDay || 1, daysInMonth);
    let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
    if (isCurrentMonth && todayDateNum > due) status = 'Paid';

    events.push({
      id: `emi-${emi.id}`,
      day: due,
      title: `${emi.title} (${emi.bank})`,
      amount: emi.amount,
      type: 'EMI',
      status,
      categoryLabel: 'Loan EMI Payment',
    });

    timelineItems.push({
      id: `tl-emi-${emi.id}`,
      dateStr: `${monthName.substring(0, 3)} ${due < 10 ? '0' + due : due}`,
      title: `${emi.title} (${emi.bank})`,
      amount: emi.amount,
      type: 'EMI',
      categoryLabel: 'Loan EMI Payment',
    });
  });

  // 3. Investments - SIP
  investments.forEach((inv) => {
    if (inv.isActive === false) return;
    const dateObj = new Date(inv.nextDate);
    const day = Math.min(!isNaN(dateObj.getDate()) ? dateObj.getDate() : 10, daysInMonth);
    let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
    if (isCurrentMonth && todayDateNum > day) status = 'Paid';

    events.push({
      id: `inv-${inv.id}`,
      day,
      title: `${inv.title} (${inv.provider})`,
      amount: inv.amount,
      type: 'SIP',
      status,
      categoryLabel: 'SIP Deposit',
    });

    timelineItems.push({
      id: `tl-inv-${inv.id}`,
      dateStr: `${monthName.substring(0, 3)} ${day < 10 ? '0' + day : day}`,
      title: `${inv.title} (${inv.provider})`,
      amount: inv.amount,
      type: 'SIP',
      categoryLabel: 'Wealth SIP',
    });
  });

  // 4. Savings - RD & FD
  savings.forEach((sav) => {
    const isFD = sav.type === 'FD';
    events.push({
      id: `sav-${sav.id}`,
      day: 5,
      title: `${sav.title} (${sav.type})`,
      amount: sav.monthlyContribution,
      type: isFD ? 'FD' : 'RD',
      status: isCurrentMonth && todayDateNum > 5 ? 'Paid' : 'Upcoming',
      categoryLabel: isFD ? 'Fixed Deposit' : 'Recurring Deposit',
    });

    timelineItems.push({
      id: `tl-sav-${sav.id}`,
      dateStr: `${monthName.substring(0, 3)} 05`,
      title: `${sav.title} (${sav.type})`,
      amount: sav.monthlyContribution,
      type: isFD ? 'FD' : 'RD',
      categoryLabel: isFD ? 'FD Deposit' : 'RD Deposit',
    });
  });

  // 5. Insurance Renewal (Cyan/Teal) - 15th of Month
  events.push({
    id: 'evt-ins-health',
    day: 15,
    title: 'Health Insurance Annual Premium',
    amount: 28500,
    type: 'Insurance',
    status: isCurrentMonth && todayDateNum > 15 ? 'Paid' : 'Upcoming',
    categoryLabel: 'Star Health Optima Secure',
  });

  // 6. GST / Tax Filing Due Date (Indigo) - 20th of Month
  events.push({
    id: 'evt-gst-quarterly',
    day: 20,
    title: 'GSTR-3B Tax Filing Deadline',
    amount: 14200,
    type: 'GST',
    status: isCurrentMonth && todayDateNum > 20 ? 'Paid' : 'Upcoming',
    categoryLabel: 'GST Tax Compliance',
  });

  // 7. Property Tax / Maintenance (Amber) - 25th of Month
  events.push({
    id: 'evt-prop-maint',
    day: 25,
    title: 'Society Maintenance & Property Tax Fund',
    amount: 8500,
    type: 'Property Tax',
    status: isCurrentMonth && todayDateNum > 25 ? 'Paid' : 'Upcoming',
    categoryLabel: 'Prestige Heights Owner Corp',
  });

  // 8. Vehicle Service & Insurance (Pink) - 28th of Month
  events.push({
    id: 'evt-veh-service',
    day: 28,
    title: 'EV Periodic Inspection & Tyre Maintenance',
    amount: 4500,
    type: 'Vehicle Service',
    status: isCurrentMonth && todayDateNum > 28 ? 'Paid' : 'Upcoming',
    categoryLabel: 'Tata Nexon EV Max Care',
  });

  // 9. Family Birthday / Anniversary (Yellow/Gold) - 18th of Month
  events.push({
    id: 'evt-bday-fam',
    day: 18,
    title: 'Spouse Birthday & Mutual Wealth Gift Fund',
    amount: 15000,
    type: 'Birthday',
    status: isCurrentMonth && todayDateNum > 18 ? 'Paid' : 'Upcoming',
    categoryLabel: 'Family Milestone Event',
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
