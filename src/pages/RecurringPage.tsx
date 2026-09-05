import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Bell,
  Clock,
  ExternalLink,
  X,
  AlertCircle,
  Repeat,
  DollarSign,
  Zap,
  RefreshCw,
  Check,
} from 'lucide-react';
import { RecurringExpense, CategoryItem } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { formatDisplayDate } from '../utils/dateRanges.js';
import { CATEGORY_COLORS } from '../data/defaults.js';

interface RecurringPageProps {
  recurringExpenses: RecurringExpense[];
  categories: CategoryItem[];
  onAddRecurring: (item: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateRecurring: (id: string, item: Partial<RecurringExpense>) => Promise<void>;
  onDeleteRecurring: (item: RecurringExpense) => Promise<void>;
  onRecordAsExpense: (item: RecurringExpense) => void;
  onGenerateDueBills?: () => Promise<void>;
}

export const RecurringPage: React.FC<RecurringPageProps> = ({
  recurringExpenses,
  categories,
  onAddRecurring,
  onUpdateRecurring,
  onDeleteRecurring,
  onRecordAsExpense,
  onGenerateDueBills,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RecurringExpense | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [subcategory, setSubcategory] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [dueDay, setDueDay] = useState('1');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [autopost, setAutopost] = useState(true);
  const [reminderDays, setReminderDays] = useState('3');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [calendarReminderEnabled, setCalendarReminderEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setCategory('Utilities');
    setSubcategory('');
    setAmount('');
    setFrequency('monthly');
    setDueDay('1');
    setDueDate(new Date().toISOString().split('T')[0]);
    setAutopost(true);
    setReminderDays('3');
    setIsActive(true);
    setNotes('');
    setCalendarReminderEnabled(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RecurringExpense) => {
    setEditingItem(item);
    setName(item.name || item.title || '');
    setCategory(item.category);
    setSubcategory(item.subcategory || '');
    setAmount(String(item.amount));
    setFrequency(item.frequency);
    setDueDay(String(item.dueDay || 1));
    setDueDate(item.dueDate || new Date().toISOString().split('T')[0]);
    setAutopost(item.autopost !== false);
    setReminderDays(String(item.reminderDays !== undefined ? item.reminderDays : 3));
    setIsActive(item.isActive !== false);
    setNotes(item.notes || '');
    setCalendarReminderEnabled(!!item.calendarReminderEnabled);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(amount);
    if (!name.trim()) {
      setFormError('Please enter a recurring bill title.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        title: name.trim(),
        category,
        subcategory: subcategory.trim() || undefined,
        amount: numAmount,
        frequency,
        dueDay: parseInt(dueDay, 10) || 1,
        dueDate,
        autopost,
        reminderDays: parseInt(reminderDays, 10) || 3,
        isActive,
        notes: notes.trim() || undefined,
        calendarReminderEnabled,
      };

      if (editingItem) {
        await onUpdateRecurring(editingItem.id, payload);
      } else {
        await onAddRecurring(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save recurring bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerAutoGenerate = async () => {
    if (!onGenerateDueBills) return;
    setIsGenerating(true);
    try {
      await onGenerateDueBills();
    } finally {
      setIsGenerating(false);
    }
  };

  const totalMonthlyCommitted = recurringExpenses.reduce((sum, r) => {
    if (r.isActive === false) return sum;
    let monthlyVal = r.amount;
    if (r.frequency === 'yearly') monthlyVal = r.amount / 12;
    if (r.frequency === 'quarterly') monthlyVal = r.amount / 3;
    if (r.frequency === 'weekly') monthlyVal = r.amount * 4.33;
    if (r.frequency === 'daily') monthlyVal = r.amount * 30.42;
    return sum + monthlyVal;
  }, 0);

  return (
    <div className="space-y-6 pb-12" id="recurring-page-container">
      {/* 1. Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Fixed Commitments & Auto-Posting
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Recurring Bills & Subscriptions
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Auto-posts monthly expenses for Rent, WiFi, Netflix on due dates into Expenses & Dashboard
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onGenerateDueBills && (
              <button
                id="generate-due-bills-btn"
                onClick={handleTriggerAutoGenerate}
                disabled={isGenerating}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border border-slate-200 active:scale-95 disabled:opacity-75"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Process Due Bills</span>
              </button>
            )}
            <button
              id="add-recurring-btn"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Committed Monthly Total Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl border border-slate-700/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Committed Monthly Obligations
          </span>
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
            {formatCurrency(Math.round(totalMonthlyCommitted))}
            <span className="text-sm font-normal text-slate-400 ml-1.5">/ month</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Across {recurringExpenses.filter((r) => r.isActive !== false).length} active auto-posting contracts
          </p>
        </div>

        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-300 space-y-1 self-stretch sm:self-auto">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>Auto Expense Generation Active</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Due bills automatically post to Expenses on their due day each month without duplicates.
          </p>
        </div>
      </div>

      {/* 3. Recurring Bills Grid */}
      {recurringExpenses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurringExpenses.map((item) => {
            const isGeneratedThisMonth = item.lastGeneratedMonth === currentMonthStr;
            const dueDayNum = item.dueDay || 1;
            const isDueToday = currentDay === dueDayNum;
            const isOverdue = currentDay > dueDayNum && !isGeneratedThisMonth;

            return (
              <div
                key={item.id}
                id={`recurring-card-${item.id}`}
                className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                  item.isActive === false ? 'opacity-60 bg-slate-50/50 border-slate-200' : 'border-slate-200/80'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-2xs flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#64748B' }}
                      >
                        {(item.name || item.title || 'B').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                            {item.name || item.title}
                          </h3>
                          {item.autopost !== false && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Auto-posts on due date">
                              Auto-Post
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-medium text-slate-500">
                            {item.category}
                          </span>
                          {item.subcategory && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] text-slate-400">{item.subcategory}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                        title="Edit Bill"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Delete Bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amount & Cadence */}
                  <div className="my-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Amount</span>
                      <span className="font-black text-slate-900 text-base sm:text-lg">
                        {formatCurrency(item.amount)}
                        <span className="text-[11px] font-medium text-slate-500 ml-1">/{item.frequency}</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Due Cycle</span>
                      <span className="font-bold text-slate-800">
                        Day {item.dueDay || 1} of month
                      </span>
                    </div>
                  </div>

                  {/* Auto Generation Status Badge */}
                  <div className="mb-3 text-[11px] flex items-center justify-between">
                    {isGeneratedThisMonth ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Generated for {currentMonthStr}
                      </span>
                    ) : isDueToday ? (
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Due Today!
                      </span>
                    ) : isOverdue ? (
                      <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Overdue for {currentMonthStr}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">
                        Next auto-post on {dueDayNum}th
                      </span>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-500 italic mb-3">"{item.notes}"</p>
                  )}
                </div>

                {/* Action Button: Record as Expense */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 font-medium">
                    {item.calendarReminderEnabled ? '📅 Calendar sync on' : 'Auto-posting'}
                  </div>

                  <button
                    onClick={() => onRecordAsExpense(item)}
                    id={`btn-record-recurring-${item.id}`}
                    className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Force Log Now</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-slate-400">
          <Repeat className="w-10 h-10 mx-auto mb-3 stroke-1 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No Recurring Bills Added</h3>
          <p className="text-xs mt-1 text-slate-400 max-w-sm mx-auto">
            Add recurring commitments like broadband, house rent, or streaming services to auto-generate expenses each month.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Recurring Bill</span>
          </button>
        </div>
      )}

      {/* Add / Edit Recurring Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingItem ? 'Edit Recurring Bill' : 'Add Recurring Bill'}
                </h3>
                <p className="text-xs text-slate-500">Auto-posts expenses to Dashboard & Expenses page</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bill Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fiber WiFi, Netflix, House Rent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. 100Mbps Plan"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="999"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Day of Month (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reminder Days Before</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={reminderDays}
                    onChange={(e) => setReminderDays(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Auto Expense Generation</span>
                    <span className="text-[11px] text-slate-500">Auto-create Expense on due date</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autopost}
                    onChange={(e) => setAutopost(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Active Status</span>
                    <span className="text-[11px] text-slate-500">Enable recurring bill tracking</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Account number, payment link..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Recurring Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Recurring Bill?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <strong className="text-slate-900">{itemToDelete.name || itemToDelete.title}</strong> ({formatCurrency(itemToDelete.amount)})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteRecurring(itemToDelete);
                  setItemToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
