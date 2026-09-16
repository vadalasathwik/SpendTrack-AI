import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  X,
  Bell,
  Loader2,
  Edit2,
  CreditCard,
  Play,
  Trash2,
  Repeat,
  Zap,
} from 'lucide-react';
import { RecurringExpense, CategoryItem } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { CATEGORY_COLORS } from '../data/defaults.js';

interface RecurringPageProps {
  recurringExpenses: RecurringExpense[];
  categories: CategoryItem[];
  onAddRecurring: (item: any) => Promise<void>;
  onUpdateRecurring: (id: string, item: Partial<any>) => Promise<void>;
  onDeleteRecurring: (item: RecurringExpense) => Promise<void>;
  onProcessDue?: () => Promise<void>;
  onGenerateDueBills?: () => Promise<void>;
  openAddModalOnMount?: boolean;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getFrequencyLabel(freq?: string): string {
  if (!freq) return 'Monthly';
  const upper = freq.toUpperCase();
  switch (upper) {
    case 'DAILY':
      return 'Daily';
    case 'WEEKLY':
      return 'Weekly';
    case 'MONTHLY':
      return 'Monthly';
    case 'YEARLY':
      return 'Yearly';
    default:
      return freq.charAt(0).toUpperCase() + freq.slice(1).toLowerCase();
  }
}

function isEmiType(title: string, note?: string): boolean {
  const combined = `${title} ${note || ''}`.toLowerCase();
  return combined.includes('emi') || combined.includes('loan') || combined.includes('mortgage') || combined.includes('installment');
}

export const RecurringPage: React.FC<RecurringPageProps> = ({
  recurringExpenses,
  categories,
  onAddRecurring,
  onUpdateRecurring,
  onDeleteRecurring,
  onProcessDue,
  onGenerateDueBills,
  openAddModalOnMount = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(openAddModalOnMount);
  const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [nextRun, setNextRun] = useState('');
  const [note, setNote] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setAmount('');
    setCategoryId(categories.length > 0 ? (categories[0].id || categories[0].name) : '');
    setFrequency('MONTHLY');
    setStartDate(todayStr);
    setNextRun(todayStr);
    setNote('');
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RecurringExpense) => {
    setEditingItem(item);
    setTitle(item.title || item.name || '');
    setAmount(String(item.amount || ''));
    
    // Determine category ID
    const catVal = typeof item.category === 'object' && item.category !== null
      ? (item.category as any).id
      : (item.categoryId || (categories.find(c => c.name === item.category)?.id || item.category || ''));
    setCategoryId(catVal);

    const freqStr = (item.frequency || 'MONTHLY').toUpperCase();
    setFrequency((['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freqStr) ? freqStr : 'MONTHLY') as any);

    const sDate = item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : todayStr;
    const nRun = item.nextRun ? new Date(item.nextRun).toISOString().split('T')[0] : (item.dueDate || todayStr);

    setStartDate(sDate);
    setNextRun(nRun);
    setNote(item.note || item.notes || '');
    setIsActive(item.isActive !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      setFormError('Please enter a title for the recurring expense.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }
    if (!categoryId) {
      setFormError('Please select a category.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        title: title.trim(),
        name: title.trim(),
        amount: numAmount,
        categoryId: categoryId,
        frequency: frequency,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        nextRun: nextRun ? new Date(nextRun).toISOString() : new Date().toISOString(),
        note: note.trim() || undefined,
        notes: note.trim() || undefined,
        isActive: isActive,
      };

      if (editingItem) {
        await onUpdateRecurring(editingItem.id, payload);
      } else {
        await onAddRecurring(payload);
      }
      setIsModalOpen(false);
      showToast(editingItem ? 'Recurring expense updated ✓' : 'Recurring expense created ✓');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save recurring expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessAutomation = async () => {
    const handler = onProcessDue || onGenerateDueBills;
    if (!handler) return;
    try {
      setIsProcessing(true);
      await handler();
      showToast('✓ Due recurring expenses processed & recorded to PostgreSQL');
    } catch (err: any) {
      console.error('Process error:', err);
      showToast(err.message || 'Failed to process due recurring expenses.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAction = async (item: RecurringExpense) => {
    if (confirm(`Are you sure you want to delete "${item.title || item.name}"?`)) {
      try {
        await onDeleteRecurring(item);
        showToast('Recurring expense deleted.');
      } catch (err: any) {
        showToast(err.message || 'Failed to delete item.');
      }
    }
  };

  const handleToggleActive = async (item: RecurringExpense) => {
    try {
      await onUpdateRecurring(item.id, { isActive: !item.isActive });
      showToast(item.isActive ? 'Paused recurring item' : 'Activated recurring item');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status.');
    }
  };

  // Group into Active vs Inactive
  const activeItems = recurringExpenses.filter((r) => r.isActive !== false);
  const inactiveItems = recurringExpenses.filter((r) => r.isActive === false);

  const now = new Date();
  const dueCount = activeItems.filter((r) => {
    if (!r.nextRun) return false;
    return new Date(r.nextRun) <= now;
  }).length;

  return (
    <div className="space-y-6 pb-16 max-w-[1440px] mx-auto" id="recurring-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-[14px] shadow-xl border border-slate-800 flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Repeat className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Recurring Expenses & EMI</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {activeItems.length} active automations • {dueCount} due for processing
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {(onProcessDue || onGenerateDueBills) && (
            <button
              onClick={handleProcessAutomation}
              disabled={isProcessing}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm rounded-[14px] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              )}
              <span>Run Process ({dueCount} Due)</span>
            </button>
          )}

          <button
            id="add-recurring-btn"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-[14px] shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recurring</span>
          </button>
        </div>
      </div>

      {/* ACTIVE RECURRING EXPENSES */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Active Schedules</span>
          <span className="text-xs font-bold text-slate-400">({activeItems.length})</span>
        </h2>

        {activeItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeItems.map((item) => {
              const displayTitle = item.title || item.name || 'Untitled';
              const catObj = typeof item.category === 'object' && item.category !== null ? item.category : null;
              const catName = catObj ? catObj.name : (item.category || 'General');
              const catColor = catObj ? catObj.color : (CATEGORY_COLORS[catName] || '#10B981');

              const isDue = item.nextRun && new Date(item.nextRun) <= now;
              const isEmi = isEmiType(displayTitle, item.note || item.notes);

              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-slate-900 p-5 rounded-[20px] border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                    isDue
                      ? 'border-amber-400/80 dark:border-amber-600/80 shadow-md shadow-amber-500/5'
                      : 'border-slate-200/80 dark:border-slate-800 soft-shadow hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                        style={{ backgroundColor: catColor }}
                      >
                        {displayTitle.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {displayTitle}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                          {catName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">
                        {formatCurrency(item.amount)}
                      </span>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {getFrequencyLabel(item.frequency)}
                        </span>
                        {isEmi ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60">
                            EMI / Loan
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60">
                            Subscription
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* NEXT RUN & STATUS */}
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-[12px] border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Next execution: <strong>{formatDisplayDate(item.nextRun || item.dueDate)}</strong></span>
                    </span>
                    {isDue && (
                      <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full animate-pulse">
                        Due
                      </span>
                    )}
                  </div>

                  {(item.note || item.notes) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-1">
                      "{item.note || item.notes}"
                    </p>
                  )}

                  {/* CARD ACTIONS */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 w-full">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className="px-2 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[12px] transition-colors cursor-pointer text-center"
                    >
                      Pause
                    </button>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="px-2 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[12px] transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteAction(item)}
                      className="px-2 py-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/80 rounded-[12px] transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
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
              No active recurring expenses
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Set up automated EMI payments, subscriptions, or recurring monthly bills to auto-generate expense entries.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[14px] shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recurring</span>
            </button>
          </div>
        )}
      </section>

      {/* PAUSED / INACTIVE RECURRING EXPENSES */}
      {inactiveItems.length > 0 && (
        <section className="space-y-3 pt-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Play className="w-4 h-4 text-slate-400" />
            <span>Paused Schedules ({inactiveItems.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
            {inactiveItems.map((item) => {
              const displayTitle = item.title || item.name || 'Untitled';
              return (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-[20px] border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {displayTitle}
                    </h3>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">Paused</span>
                    <button
                      onClick={() => handleToggleActive(item)}
                      className="px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-[10px] cursor-pointer hover:bg-emerald-100"
                    >
                      Resume
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[20px] max-w-[440px] w-[calc(100vw-24px)] p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-black tracking-tight">
                {editingItem ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
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
              {/* Title */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Title / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Car EMI, Netflix, Broadband"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Amount & Category */}
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
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id || cat.name} value={cat.id || cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Frequency & Next Run Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Frequency *
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Next Run Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={nextRun}
                    onChange={(e) => setNextRun(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Start Date & Active State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col justify-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Active Schedule</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Note / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tenure: 12/24 months, auto-debit on 5th"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
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
                  <span>{editingItem ? 'Save Changes' : 'Add Recurring'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
