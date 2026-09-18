import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Tag,
  Edit2,
  Trash2,
  ExternalLink,
  Plus,
  Receipt,
  FileSpreadsheet,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Expense, CategoryItem, DateRange } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { formatDisplayDate } from '../utils/dateRanges.js';
import { CATEGORY_COLORS } from '../data/defaults.js';
import { SpendTrackApi } from '../services/api.js';

interface ExpensesPageProps {
  expenses: Expense[];
  categories: CategoryItem[];
  dateRange: DateRange;
  onOpenAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onSelectItemAnalytics: (itemName: string) => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses,
  categories,
  dateRange,
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense,
  onSelectItemAnalytics,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'SUBSCRIPTIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState<boolean>(false);

  // Reconciliation state
  const [reconData, setReconData] = useState<any>(null);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        setSubsLoading(true);
        const data = await SpendTrackApi.getSubscriptions();
        setSubscriptions(data || []);
        const recon = await SpendTrackApi.getReconciliationStatus();
        setReconData(recon);
      } catch (err) {
        console.error("Failed to load subscriptions or reconciliation:", err);
      } finally {
        setSubsLoading(false);
      }
    };
    fetchSubs();
  }, []);

  const toggleAutoPay = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, autoPay: !sub.autoPay } : sub))
    );
  };

  const toggleActiveStatus = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, isActive: !sub.isActive } : sub))
    );
  };

  // Filter expenses by search query and category
  const filtered = expenses.filter((exp) => {
    const matchesSearch =
      exp.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || exp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort expenses
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') {
      const diff = (a.purchaseDate || '').localeCompare(b.purchaseDate || '');
      return sortOrder === 'desc' ? -diff : diff;
    }
    if (sortBy === 'price') {
      const diff = (a.totalPrice || 0) - (b.totalPrice || 0);
      return sortOrder === 'desc' ? -diff : diff;
    }
    if (sortBy === 'name') {
      const diff = a.itemName.localeCompare(b.itemName);
      return sortOrder === 'desc' ? -diff : diff;
    }
    return 0;
  });

  const totalFilteredSpending = sorted.reduce((sum, e) => sum + (Number(e.totalPrice) || 0), 0);
  const totalMonthlySubs = subscriptions.filter(s => s.isActive).reduce((sum, s) => sum + s.monthlyAmount, 0);

  return (
    <div className="space-y-5 pb-16 max-w-[1440px] mx-auto" id="expenses-page-container">
      {/* 1. Header & Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Expenses & Subscriptions
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Phase 1 Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage transaction ledger & intelligent recurring subscription detection.
            </p>
          </div>

          <button
            id="expenses-add-new-btn"
            onClick={onOpenAddExpense}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-[14px] shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* BANK RECONCILIATION SUMMARY CARD */}
        {reconData && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-400">Bank Reconciliation Engine</span>
                <h4 className="font-extrabold text-white">
                  {reconData.reconciliationProgress}% Statements Reconciled
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Matched: {reconData.matchedCount} • Pending: {reconData.pendingCount} • AI Duplicates: {reconData.duplicateCount}
                </p>
              </div>
            </div>
            {reconData.duplicateCandidates?.length > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> {reconData.duplicateCandidates.length} AI Duplicate Flagged
              </div>
            )}
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Ledger Transactions ({sorted.length})
          </button>
          <button
            onClick={() => setActiveTab('SUBSCRIPTIONS')}
            className={`px-4 py-2 rounded-[12px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SUBSCRIPTIONS'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 hover:bg-purple-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Subscription Intelligence ({subscriptions.length})</span>
          </button>
        </div>

        {/* Filters Bar for Ledger */}
        {activeTab === 'ALL' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                id="expense-search-input"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                id="filter-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By & Order */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                <option value="date">Sort by Date</option>
                <option value="price">Sort by Price</option>
                <option value="name">Sort by Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 rounded-[12px] cursor-pointer"
                title="Toggle sort order"
              >
                {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. TAB CONTENT: ALL LEDGER */}
      {activeTab === 'ALL' && (
        sorted.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.map((exp) => (
                <TransactionCardRow
                  key={exp.id}
                  exp={exp}
                  onSelectItemAnalytics={onSelectItemAnalytics}
                  onEditExpense={onEditExpense}
                  onDeleteExpense={(item) => setExpenseToDelete(item)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-10 sm:p-14 text-center rounded-[20px] border border-slate-200/80 dark:border-slate-800 text-slate-400 my-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-7 h-7 stroke-[1.8]" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No expenses yet</h3>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'No expenditures match your active search or category filters.'
                : 'You have not recorded any expenses yet.'}
            </p>
          </div>
        )
      )}

      {/* 3. TAB CONTENT: SUBSCRIPTION INTELLIGENCE */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-[20px] bg-gradient-to-r from-purple-900/30 via-slate-900 to-indigo-900/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Total Monthly Recurring Commitment</span>
              <h2 className="text-2xl font-black text-white mt-0.5">₹{totalMonthlySubs.toLocaleString('en-IN')}/mo <span className="text-xs text-slate-400 font-normal">(Annualized: ₹{(totalMonthlySubs * 12).toLocaleString('en-IN')})</span></h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Auto-Detect Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 soft-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {sub.merchant.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">{sub.merchant}</h3>
                      <span className="text-[11px] font-semibold text-slate-400">{sub.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActiveStatus(sub.id)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border cursor-pointer ${
                        sub.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {sub.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-[16px] bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly</span>
                    <div className="text-base font-black text-slate-900 dark:text-white">₹{sub.monthlyAmount.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Annual Cost</span>
                    <div className="text-base font-black text-purple-400">₹{sub.annualAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-medium">Renews in {sub.daysToRenewal} days</span>
                  <button
                    onClick={() => toggleAutoPay(sub.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-purple-400 cursor-pointer"
                  >
                    <span>Auto-pay</span>
                    {sub.autoPay ? (
                      <ToggleRight className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                </div>

                {sub.aiSuggestion && (
                  <div className="p-3 rounded-[14px] bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 font-medium flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{sub.aiSuggestion}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-[calc(100vw-24px)] max-w-[420px] rounded-[20px] shadow-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Expense?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the expense{' '}
              <strong className="text-slate-900 dark:text-white">"{expenseToDelete.itemName}"</strong> ({formatCurrency(expenseToDelete.totalPrice)})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[12px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteExpense(expenseToDelete);
                  setExpenseToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-[12px] shadow-xs cursor-pointer"
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

// Sub-component for individual transaction row with Touch Swipe gestures
const TransactionCardRow: React.FC<{
  exp: Expense;
  onSelectItemAnalytics: (name: string) => void;
  onEditExpense: (exp: Expense) => void;
  onDeleteExpense: (exp: Expense) => void;
}> = ({ exp, onSelectItemAnalytics, onEditExpense, onDeleteExpense }) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStartHandler = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveHandler = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onDeleteExpense(exp);
    } else if (isRightSwipe) {
      onEditExpense(exp);
    }
  };

  return (
    <div
      id={`expense-row-${exp.id}`}
      onTouchStart={onTouchStartHandler}
      onTouchMove={onTouchMoveHandler}
      onTouchEnd={onTouchEndHandler}
      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors select-none"
    >
      {/* Left side: Category Avatar + Details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-10 h-10 rounded-[14px] flex items-center justify-center text-white font-bold text-sm shadow-2xs shrink-0"
          style={{ backgroundColor: CATEGORY_COLORS[exp.category] || '#64748B' }}
        >
          {exp.itemName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSelectItemAnalytics(exp.itemName)}
              className="font-extrabold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 text-xs sm:text-sm text-left cursor-pointer line-clamp-2 max-w-[180px] xs:max-w-[240px] sm:max-w-none"
            >
              {exp.itemName}
            </button>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              {exp.category}
            </span>
            {(exp.source === 'recurring' || exp.recurringId) && (
              <span
                className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full font-bold border border-purple-200 dark:border-purple-800/60 inline-flex items-center gap-1"
                title="Auto-generated from Recurring Bill"
              >
                Recurring Bill
              </span>
            )}
            {exp.receiptDriveFileId && (
              <span
                className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800"
                title="Receipt attached"
              >
                Receipt ✓
              </span>
            )}
            {exp.calendarEventId && (
              <span
                className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full font-bold border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1"
                title="Google Calendar reminder scheduled"
              >
                <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                Calendar Synced ✓
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            {formatDisplayDate(exp.purchaseDate)}
          </div>
        </div>
      </div>

      {/* Right side: Amount + Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
        <div className="text-right">
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {formatCurrency(exp.totalPrice)}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {exp.receiptViewLink && (
            <a
              href={exp.receiptViewLink}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-[10px] hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="View Receipt"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => onEditExpense(exp)}
            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-[10px] hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Edit Expense"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteExpense(exp)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-[10px] hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Delete Expense"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
