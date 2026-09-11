import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  X,
  Bell,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Edit2,
  CreditCard,
} from 'lucide-react';
import { RecurringExpense, CategoryItem } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { CATEGORY_COLORS } from '../data/defaults.js';
import { getCalendarUrl } from '../utils/calendar.js';

function renderSyncBadge(status?: 'synced' | 'syncing' | 'error') {
  if (status === 'synced') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Synced
      </span>
    );
  }
  if (status === 'syncing') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Syncing
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Sync Failed
      </span>
    );
  }
  return null;
}

interface RecurringPageProps {
  recurringExpenses: RecurringExpense[];
  categories: CategoryItem[];
  onAddRecurring: (item: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateRecurring: (id: string, item: Partial<RecurringExpense>) => Promise<void>;
  onDeleteRecurring: (item: RecurringExpense) => Promise<void>;
  onRecordAsExpense?: (item: RecurringExpense) => void;
  onMarkAsPaid?: (item: RecurringExpense) => Promise<void>;
  onNavigateToExpenses?: () => void;
  onGenerateDueBills?: () => Promise<void>;
  openAddModalOnMount?: boolean;
}

// Date & Time Utility Helpers
function calculateReminderDateFromOffset(dueStr: string, notifyOffset: string): string {
  if (!dueStr) return new Date().toISOString().split('T')[0];
  const d = new Date(dueStr + 'T00:00:00');
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];

  let daysBefore = 0;
  if (notifyOffset === '1 day') daysBefore = 1;
  else if (notifyOffset === '3 days') daysBefore = 3;

  d.setDate(d.getDate() - daysBefore);
  return d.toISOString().split('T')[0];
}

function formatTime12h(time24: string = '20:00'): string {
  if (!time24) return '8:00 PM';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return '8:00 PM';
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

function formatHumanReminder(reminderDateStr?: string, reminderTime24?: string): string {
  if (!reminderDateStr) return 'Reminder set';

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowObj = new Date(today);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const timeStr = formatTime12h(reminderTime24 || '20:00');

  if (reminderDateStr === todayStr) {
    return `Today • ${timeStr}`;
  }

  if (reminderDateStr === tomorrowStr) {
    return `Tomorrow • ${timeStr}`;
  }

  const remDate = new Date(reminderDateStr + 'T00:00:00');
  const todayZero = new Date(todayStr + 'T00:00:00');
  const diffTime = remDate.getTime() - todayZero.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays > 1 && diffDays <= 7) {
    return `In ${diffDays} days`;
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!isNaN(remDate.getTime())) {
    const day = remDate.getDate();
    const month = monthNames[remDate.getMonth()];
    return `${day} ${month} • ${timeStr}`;
  }

  return `${reminderDateStr} • ${timeStr}`;
}

function formatConsumerDate(dateStr?: string, dueDayFallback?: number, includeYear = true): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let d: Date;
  if (dateStr && !isNaN(new Date(dateStr + 'T00:00:00').getTime())) {
    d = new Date(dateStr + 'T00:00:00');
  } else {
    const today = new Date();
    const day = Math.min(dueDayFallback || 1, 28);
    d = new Date(today.getFullYear(), today.getMonth(), day);
  }
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
}

export const RecurringPage: React.FC<RecurringPageProps> = ({
  recurringExpenses,
  categories,
  onAddRecurring,
  onUpdateRecurring,
  onMarkAsPaid,
  onRecordAsExpense,
  openAddModalOnMount = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(openAddModalOnMount);
  const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);
  const [payingItemId, setPayingItemId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Paid Section Collapsed state by default
  const [isPaidSectionOpen, setIsPaidSectionOpen] = useState(false);

  // Form State (Max 6 inputs total)
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // Dedicated Reminder Card State
  const [calendarReminderEnabled, setCalendarReminderEnabled] = useState(true);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('20:00');
  const [notifyBefore, setNotifyBefore] = useState('1 day');
  const [isUserReminderModified, setIsUserReminderModified] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);
  const currentDay = new Date().getDate();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setCategory('Utilities');
    setAmount('');
    setNotes('');

    // Default due date: 28th of current month or next month
    const today = new Date();
    const defaultDueObj = new Date(today.getFullYear(), today.getMonth() + (today.getDate() > 20 ? 1 : 0), 28);
    const defaultDueStr = defaultDueObj.toISOString().split('T')[0];
    setDueDate(defaultDueStr);

    setNotifyBefore('1 day');
    setReminderDate(calculateReminderDateFromOffset(defaultDueStr, '1 day'));
    setReminderTime('20:00');
    setCalendarReminderEnabled(true);
    setIsUserReminderModified(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RecurringExpense) => {
    setEditingItem(item);
    setName(item.name || item.title || '');
    setCategory(item.category || 'Utilities');
    setAmount(String(item.amount || ''));
    setNotes(item.notes || '');

    // Set Due Date
    const calculatedDue = item.dueDate || `${currentMonthStr}-${String(item.dueDay || 1).padStart(2, '0')}`;
    setDueDate(calculatedDue);

    const chosenNotify = item.notifyBefore || '1 day';
    setNotifyBefore(chosenNotify);

    // Set Reminder Date & Time
    const calculatedReminder = item.reminderDate || calculateReminderDateFromOffset(calculatedDue, chosenNotify);
    setReminderDate(calculatedReminder);
    setReminderTime(item.reminderTime || '20:00');
    setCalendarReminderEnabled(item.calendarReminderEnabled !== false);
    setIsUserReminderModified(Boolean(item.reminderDate));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDueDateChange = (newDueDate: string) => {
    setDueDate(newDueDate);
    if (!isUserReminderModified) {
      setReminderDate(calculateReminderDateFromOffset(newDueDate, notifyBefore));
    }
  };

  const handleNotifyBeforeChange = (newNotify: string) => {
    setNotifyBefore(newNotify);
    setReminderDate(calculateReminderDateFromOffset(dueDate, newNotify));
    setIsUserReminderModified(false);
  };

  const handleReminderDateChange = (newReminderDate: string) => {
    setReminderDate(newReminderDate);
    setIsUserReminderModified(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(amount);
    if (!name.trim()) {
      setFormError('Please enter a payment name.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      const parsedDueDate = new Date(dueDate + 'T00:00:00');
      const calculatedDueDay = !isNaN(parsedDueDate.getTime()) ? parsedDueDate.getDate() : 1;

      const payload: Partial<RecurringExpense> = {
        name: name.trim(),
        title: name.trim(),
        category,
        amount: numAmount,
        frequency: 'monthly',
        dueDay: calculatedDueDay,
        dueDate,
        reminderDate,
        reminderTime,
        notifyBefore,
        calendarReminderEnabled,
        notes: notes.trim() || undefined,
        isActive: true,
      };

      if (editingItem) {
        await onUpdateRecurring(editingItem.id, payload);
      } else {
        await onAddRecurring(payload as Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setIsModalOpen(false);
      showToast(editingItem ? 'Payment updated ✓' : 'Payment added ✓');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaidAction = async (item: RecurringExpense) => {
    if (item.lastGeneratedMonth === currentMonthStr) return;
    setPayingItemId(item.id);
    try {
      if (onMarkAsPaid) {
        await onMarkAsPaid(item);
      } else if (onRecordAsExpense) {
        onRecordAsExpense(item);
      }
      showToast('✓ Payment completed & next month scheduled');
    } catch (err: any) {
      console.error('Error marking as paid:', err);
      showToast('Unable to update payment.');
    } finally {
      setPayingItemId(null);
    }
  };

  // Active persistent payment items
  const activePayments = recurringExpenses.filter((r) => r.isActive !== false);

  // Upcoming vs Paid arrays
  const upcomingPayments = activePayments
    .filter((r) => r.lastGeneratedMonth !== currentMonthStr)
    .sort((a, b) => {
      const dayA = a.dueDay || 1;
      const dayB = b.dueDay || 1;
      const diffA = dayA >= currentDay ? dayA - currentDay : dayA + 31 - currentDay;
      const diffB = dayB >= currentDay ? dayB - currentDay : dayB + 31 - currentDay;
      return diffA - diffB;
    });

  const paidPayments = activePayments
    .filter((r) => r.lastGeneratedMonth === currentMonthStr)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const upcomingCount = upcomingPayments.length;
  const paidCount = paidPayments.length;

  return (
    <div className="space-y-6 pb-16 max-w-[1440px] mx-auto" id="payments-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-[14px] shadow-xl border border-slate-800 flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* TOP CONSUMER HEADER: PAYMENTS */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Payments
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {upcomingCount} upcoming • {paidCount} paid this month
          </p>
        </div>

        <button
          id="add-payment-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-[14px] shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment</span>
        </button>
      </div>

      {/* SECTION 3: DUE SOON (UPCOMING PAYMENTS) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Due Soon</span>
            <span className="text-xs font-bold text-slate-400">({upcomingCount})</span>
          </h2>
        </div>

        {upcomingPayments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingPayments.map((item) => {
              const dueDayNum = item.dueDay || 1;
              const isDueToday = currentDay === dueDayNum;
              const isOverdue = currentDay > dueDayNum;

              let statusText = 'Upcoming';
              let statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60';

              if (isDueToday) {
                statusText = 'Due Today';
                statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60';
              } else if (isOverdue) {
                statusText = 'Overdue';
                statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60';
              }

              const isPaying = payingItemId === item.id;
              const formattedDueDateStr = formatConsumerDate(item.dueDate, item.dueDay, false);
              const reminderLabel = formatHumanReminder(item.reminderDate || calculateReminderDateFromOffset(item.dueDate || '', item.notifyBefore || '1 day'), item.reminderTime);

              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[20px] border transition-all duration-200 group flex flex-col justify-between space-y-3 sm:space-y-4 ${
                    isPaying
                      ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20 scale-[1.01]'
                      : 'border-slate-200/80 dark:border-slate-800 soft-shadow hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#10B981' }}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {item.name || item.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          Due <strong>{formattedDueDateStr}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">
                        {formatCurrency(item.amount)}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {renderSyncBadge(item.calendarSyncStatus || (item.calendarEventId ? 'synced' : undefined))}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${statusBadgeClass}`}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* HUMAN-FRIENDLY REMINDER LINE */}
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-[12px] border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">
                      Reminder <strong>{reminderLabel}</strong>
                    </span>
                  </div>

                  {/* FOOTER BUTTONS: EQUAL WIDTH, 44px MIN HEIGHT */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 w-full">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[14px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleMarkAsPaidAction(item)}
                      disabled={isPaying}
                      className="w-full min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-[14px] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {isPaying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Pay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[20px] border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CreditCard className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              No upcoming payments
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All upcoming payments for this cycle have been completed or none are scheduled.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[14px] shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Payment</span>
            </button>
          </div>
        )}
      </section>

      {/* SECTION 4: PAID THIS MONTH (COLLAPSED BY DEFAULT) */}
      <section className="space-y-3 pt-2">
        <button
          onClick={() => setIsPaidSectionOpen(!isPaidSectionOpen)}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              ✓ Paid This Month ({paidCount})
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{isPaidSectionOpen ? 'Hide' : 'Show'}</span>
            {isPaidSectionOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        </button>

        {isPaidSectionOpen && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {paidPayments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paidPayments.map((item) => {
                  const reminderLabel = formatHumanReminder(item.reminderDate || calculateReminderDateFromOffset(item.dueDate || '', item.notifyBefore || '1 day'), item.reminderTime);
                  const formattedPaidDateStr = formatConsumerDate(item.paidDate || todayStr, undefined, false);

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-50/60 dark:bg-slate-900/60 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 opacity-80"
                            style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#10B981' }}
                          >
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                              {item.name || item.title}
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                              Paid on <strong>{formattedPaidDateStr}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className="text-lg font-black text-slate-900 dark:text-white block">
                            {formatCurrency(item.amount)}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {renderSyncBadge(item.calendarSyncStatus || (item.calendarEventId ? 'synced' : undefined))}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 inline-block">
                              ✓ Paid
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* NEXT REMINDER LINE */}
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/60 p-2.5 rounded-[12px] border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">
                          Next reminder <strong>{reminderLabel}</strong>
                        </span>
                      </div>

                      {/* FOOTER BUTTONS: OPEN CALENDAR LINK + ✓ PAID STATUS BADGE */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <a
                          href={getCalendarUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[12px] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Open Calendar</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <span className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 rounded-[14px] border border-emerald-300/60 dark:border-emerald-800 inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>✓ Paid</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 text-center text-xs font-semibold text-slate-400">
                No payments completed yet this month.
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 5: ADD / EDIT PAYMENT MODAL (MAX 6 VISIBLE INPUTS) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[20px] max-w-[420px] w-[calc(100vw-24px)] p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[88vh] flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-black tracking-tight">
                {editingItem ? 'Edit Payment' : 'Add Payment'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-[12px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-[12px] border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* INPUT ROW 1: Payment Name */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Payment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WiFi, Rent, Electricity"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* INPUT ROW 2: Amount & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* INPUT ROW 3: Due Date */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* INPUT ROW 4: Notes (Optional) */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Account number, provider link"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* INPUT ROW 5: REMINDER & GOOGLE CALENDAR CARD */}
              <div className="p-4 rounded-[20px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Reminder & Calendar
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      id="sync-calendar-checkbox"
                      checked={calendarReminderEnabled}
                      onChange={(e) => setCalendarReminderEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Sync with Google Calendar</span>
                  </label>
                </div>

                {calendarReminderEnabled && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Notify Before
                      </label>
                      <select
                        value={notifyBefore}
                        onChange={(e) => handleNotifyBeforeChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      >
                        <option value="At time">At time</option>
                        <option value="10 min">10 min</option>
                        <option value="30 min">30 min</option>
                        <option value="1 hour">1 hour</option>
                        <option value="1 day">1 day before</option>
                        <option value="3 days">3 days before</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Reminder Date
                        </label>
                        <input
                          type="date"
                          value={reminderDate}
                          onChange={(e) => handleReminderDateChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Reminder Time
                        </label>
                        <input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    {/* LIVE PREVIEW BOX */}
                    <div className="p-3 rounded-[12px] bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      You'll be reminded <strong>{formatHumanReminder(reminderDate, reminderTime)}</strong>.
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT ROW 6: ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[14px] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-[14px] shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Add Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

