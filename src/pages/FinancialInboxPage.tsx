import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  TrendingUp,
  PiggyBank,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { EmiItem, InvestmentItem, SavingItem, RecurringExpense, ReminderItem, GoalItem } from '../types.js';
import { FinanceInboxCard } from '../components/ui/FinanceInboxCard.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { SpendTrackApi } from '../services/api.js';

interface FinancialInboxPageProps {
  emis?: EmiItem[];
  investments?: InvestmentItem[];
  savings?: SavingItem[];
  recurringExpenses?: RecurringExpense[];
  reminders?: ReminderItem[];
  goals?: GoalItem[];
  onNavigateToTab?: (tab: string) => void;
  onSaveNote?: (content: string, title?: string, tags?: string) => Promise<void>;
}

export const FinancialInboxPage: React.FC<FinancialInboxPageProps> = ({
  emis = [],
  investments = [],
  savings = [],
  recurringExpenses = [],
  reminders = [],
  goals = [],
  onNavigateToTab,
  onSaveNote,
}) => {
  const [apiInboxItems, setApiInboxItems] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const data = await SpendTrackApi.getInbox();
      setApiInboxItems(data || []);
    } catch (err) {
      console.error("Failed to load live inbox items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleComplete = async (id: string, originalId?: string, type?: string) => {
    setCompletedIds((prev) => new Set([...prev, id]));
    if (originalId && type) {
      try {
        await SpendTrackApi.completeInboxItem(originalId, type);
      } catch (e) {
        console.error("Complete error:", e);
      }
    }
  };

  const handleSnooze = async (id: string, originalId?: string, type?: string) => {
    setSnoozedIds((prev) => new Set([...prev, id]));
    if (originalId && type) {
      try {
        await SpendTrackApi.snoozeInboxItem(originalId, type, 3);
      } catch (e) {
        console.error("Snooze error:", e);
      }
    }
  };

  const handleConvertToNote = async (title: string, subtitle: string) => {
    if (onSaveNote) {
      await onSaveNote(`Task: ${title}\nDetails: ${subtitle}\nSource: Financial Inbox`, title, 'inbox, auto');
      alert(`Converted "${title}" to a Financial Note!`);
    }
  };

  // Process and group items
  const criticalItems: any[] = [];
  const highItems: any[] = [];
  const mediumItems: any[] = [];
  const lowItems: any[] = [];

  // Map API items
  apiInboxItems.forEach((item) => {
    if (completedIds.has(item.id) || snoozedIds.has(item.id)) return;

    let icon = Clock;
    if (item.type === 'EMI') icon = CreditCard;
    else if (item.type === 'SIP') icon = TrendingUp;
    else if (item.type === 'RD' || item.type === 'FD') icon = PiggyBank;
    else if (item.type === 'REMINDER') icon = Bell;

    const formatted = {
      id: item.id,
      originalId: item.originalId,
      type: item.type,
      title: item.title,
      subtitle: `${item.category || item.type} • Due ${item.daysRemaining === 0 ? 'Today' : (item.daysRemaining < 0 ? Math.abs(item.daysRemaining) + ' days overdue' : 'in ' + item.daysRemaining + ' days')}`,
      amount: item.amount,
      priority: item.priority === 'CRITICAL' ? 'HIGH' : item.priority,
      rawPriority: item.priority,
      aiExplanation: item.aiExplanation,
      categoryTag: item.category || item.type,
      icon,
    };

    if (item.priority === 'CRITICAL') criticalItems.push(formatted);
    else if (item.priority === 'HIGH') highItems.push(formatted);
    else if (item.priority === 'MEDIUM') mediumItems.push(formatted);
    else lowItems.push(formatted);
  });

  const totalInboxCount = criticalItems.length + highItems.length + mediumItems.length + lowItems.length;

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      {/* Inbox Header */}
      <GlassCard padding="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Inbox className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">Smart Financial Inbox</h1>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                  {totalInboxCount} Pending
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Auto-aggregated EMIs, SIPs, RDs/FDs, recurring bills, and smart reminders with priority rules.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {totalInboxCount === 0 && !loading ? (
        <GlassCard padding="p-12" className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-white">Inbox Zero Achieved!</h3>
          <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">
            All current EMIs, bills, SIP deposits, and reminders have been reviewed or marked complete.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: CRITICAL / OVERDUE */}
          {criticalItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-500">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                  <span>Critical / Overdue ({criticalItems.length})</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">High Action Needed</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criticalItems.map((item) => (
                  <FinanceInboxCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    amount={item.amount}
                    priority="HIGH"
                    aiExplanation={item.aiExplanation}
                    categoryTag={item.categoryTag}
                    icon={item.icon}
                    onComplete={() => handleComplete(item.id, item.originalId, item.type)}
                    onSnooze={() => handleSnooze(item.id, item.originalId, item.type)}
                    onConvertToNote={() => handleConvertToNote(item.title, item.subtitle)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: TODAY */}
          {highItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400">
                  <Calendar className="w-4 h-4" />
                  <span>Today ({highItems.length})</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Due Today</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highItems.map((item) => (
                  <FinanceInboxCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    amount={item.amount}
                    priority="HIGH"
                    aiExplanation={item.aiExplanation}
                    categoryTag={item.categoryTag}
                    icon={item.icon}
                    onComplete={() => handleComplete(item.id, item.originalId, item.type)}
                    onSnooze={() => handleSnooze(item.id, item.originalId, item.type)}
                    onConvertToNote={() => handleConvertToNote(item.title, item.subtitle)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: TOMORROW & THIS WEEK */}
          {mediumItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
                  <Clock className="w-4 h-4" />
                  <span>Tomorrow & This Week ({mediumItems.length})</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Upcoming 1–3 Days</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mediumItems.map((item) => (
                  <FinanceInboxCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    amount={item.amount}
                    priority="MEDIUM"
                    aiExplanation={item.aiExplanation}
                    categoryTag={item.categoryTag}
                    icon={item.icon}
                    onComplete={() => handleComplete(item.id, item.originalId, item.type)}
                    onSnooze={() => handleSnooze(item.id, item.originalId, item.type)}
                    onConvertToNote={() => handleConvertToNote(item.title, item.subtitle)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: UPCOMING */}
          {lowItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Upcoming Schedule ({lowItems.length})</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Later This Month</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lowItems.map((item) => (
                  <FinanceInboxCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    amount={item.amount}
                    priority="LOW"
                    aiExplanation={item.aiExplanation}
                    categoryTag={item.categoryTag}
                    icon={item.icon}
                    onComplete={() => handleComplete(item.id, item.originalId, item.type)}
                    onSnooze={() => handleSnooze(item.id, item.originalId, item.type)}
                    onConvertToNote={() => handleConvertToNote(item.title, item.subtitle)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
