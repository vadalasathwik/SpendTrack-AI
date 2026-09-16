import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  TrendingUp,
  PiggyBank,
  Repeat,
} from 'lucide-react';
import {
  EmiItem,
  InvestmentItem,
  SavingItem,
  RecurringExpense,
  Expense,
} from '../types.js';
import { formatCurrency } from '../utils/calculations.js';

interface MonthlyPlannerPageProps {
  emis: EmiItem[];
  investments: InvestmentItem[];
  savings: SavingItem[];
  recurringExpenses: RecurringExpense[];
  expenses: Expense[];
}

interface PlannerEvent {
  id: string;
  day: number;
  title: string;
  amount: number;
  type: 'EMI' | 'SIP' | 'SAVINGS' | 'RECURRING';
  status: 'Upcoming' | 'Paid' | 'Overdue';
  categoryLabel: string;
}

export const MonthlyPlannerPage: React.FC<MonthlyPlannerPageProps> = ({
  emis,
  investments,
  savings,
  recurringExpenses,
  expenses,
}) => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthName = today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Synthesize events for current month
  const events: PlannerEvent[] = [];

  // EMIs
  for (const emi of emis) {
    const due = emi.dueDay || 1;
    let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
    if (currentDay > due) status = 'Overdue';
    else if (currentDay === due) status = 'Upcoming';

    events.push({
      id: `emi-${emi.id}`,
      day: due,
      title: `${emi.title} (${emi.bank})`,
      amount: emi.amount,
      type: 'EMI',
      status,
      categoryLabel: 'Loan EMI',
    });
  }

  // Investments (SIPs)
  for (const inv of investments) {
    if (inv.isActive === false) continue;
    const dateObj = new Date(inv.nextDate);
    const day = !isNaN(dateObj.getDate()) ? dateObj.getDate() : 1;
    let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
    if (currentDay > day) status = 'Paid';

    events.push({
      id: `inv-${inv.id}`,
      day,
      title: `${inv.title} (${inv.provider})`,
      amount: inv.amount,
      type: 'SIP',
      status,
      categoryLabel: inv.type.replace('_', ' '),
    });
  }

  // Savings (RDs)
  for (const sav of savings) {
    events.push({
      id: `sav-${sav.id}`,
      day: 5,
      title: `${sav.title} (${sav.type})`,
      amount: sav.monthlyContribution,
      type: 'SAVINGS',
      status: currentDay > 5 ? 'Paid' : 'Upcoming',
      categoryLabel: 'Savings Deposit',
    });
  }

  // Recurring Expenses
  for (const rec of recurringExpenses) {
    if (rec.isActive === false) continue;
    const day = rec.dueDay || (rec.nextRun ? new Date(rec.nextRun).getDate() : 10);
    let status: 'Upcoming' | 'Paid' | 'Overdue' = 'Upcoming';
    if (currentDay > day) status = 'Paid';
    else if (currentDay === day) status = 'Upcoming';

    events.push({
      id: `rec-${rec.id}`,
      day,
      title: rec.title || rec.name || 'Recurring Bill',
      amount: rec.amount,
      type: 'RECURRING',
      status,
      categoryLabel: 'Bill / Utility',
    });
  }

  // Sort events chronologically by day of month
  events.sort((a, b) => a.day - b.day);

  const totalMonthlyCommitment = events.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 pb-16 max-w-[1440px] mx-auto">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Monthly Planner</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Answers: <strong>"What will happen this month?"</strong> ({currentMonthName})
          </p>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/60 p-3 rounded-[16px] border border-indigo-200 dark:border-indigo-800/60 text-right min-w-[170px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
            Scheduled Commitments
          </span>
          <span className="text-xl font-black text-indigo-900 dark:text-indigo-200">
            {formatCurrency(totalMonthlyCommitment)}
          </span>
        </div>
      </div>

      {/* CALENDAR GRID VIEW */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Monthly Financial Calendar Grid</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Salary</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> EMI</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> SIP</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> RD</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> FD</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Reminder</span>
          </div>
        </div>

        {/* 7-column Calendar Matrix */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
            const dayEvents = events.filter((e) => e.day === dayNum);
            const isToday = currentDay === dayNum;

            return (
              <div
                key={dayNum}
                className={`min-h-[85px] p-1.5 rounded-[14px] border flex flex-col justify-between transition-all ${
                  isToday
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 shadow-xs'
                    : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <span className={`text-xs font-black self-end px-1.5 py-0.5 rounded-md ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                  {dayNum}
                </span>

                <div className="space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((evt) => {
                    let chipColor = 'bg-slate-500/20 text-slate-300 border-slate-500/30';
                    if (evt.type === 'EMI') chipColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                    else if (evt.type === 'SIP') chipColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                    else if (evt.type === 'SAVINGS') chipColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                    return (
                      <div key={evt.id} className={`text-[10px] font-bold truncate px-1.5 py-0.5 rounded border ${chipColor}`}>
                        {evt.title.split(' ')[0]} ₹{(evt.amount / 1000).toFixed(0)}k
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <span className="text-[9px] font-extrabold text-indigo-400 block text-right">+ {dayEvents.length - 2} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TIMELINE LIST */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Timeline Schedule ({events.length} items)</span>
        </h2>

        {events.length > 0 ? (
          <div className="space-y-3">
            {events.map((evt) => {
              let statusBadge = null;
              if (evt.status === 'Paid') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Paid
                  </span>
                );
              } else if (evt.status === 'Overdue') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                    <AlertCircle className="w-3 h-3 text-rose-500" />
                    Overdue
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                    <Clock className="w-3 h-3 text-blue-500" />
                    Upcoming
                  </span>
                );
              }

              let Icon = Calendar;
              if (evt.type === 'EMI') Icon = CreditCard;
              else if (evt.type === 'SIP') Icon = TrendingUp;
              else if (evt.type === 'SAVINGS') Icon = PiggyBank;
              else if (evt.type === 'RECURRING') Icon = Repeat;

              return (
                <div
                  key={evt.id}
                  className="p-4 rounded-[16px] bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4 transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-[14px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-sm flex flex-col items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Day</span>
                      <span>{evt.day}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {evt.title}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400 font-semibold mt-0.5 block">
                        {evt.categoryLabel}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {formatCurrency(evt.amount)}
                    </span>
                    {statusBadge}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs font-semibold text-slate-400">
            No scheduled events found for this month. Add EMIs, SIPs, or Recurring bills in the Financial Notebook to populate your planner.
          </div>
        )}
      </div>
    </div>
  );
};
