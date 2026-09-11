import React, { useState } from 'react';
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
} from 'lucide-react';
import { Expense, CategoryItem, DateRange } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { formatDisplayDate } from '../utils/dateRanges.js';
import { CATEGORY_COLORS } from '../data/defaults.js';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

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

  return (
    <div className="space-y-5 pb-16 max-w-[1440px] mx-auto" id="expenses-page-container">
      {/* 1. Header & Summary Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Expenses
              </h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Finance Ledger
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing <strong className="text-slate-900 dark:text-white">{sorted.length}</strong> purchases totaling{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalFilteredSpending)}</strong>
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

        {/* Filters Bar */}
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
      </div>

      {/* 2. Expenses Cards / List */}
      {sorted.length > 0 ? (
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
        /* Empty State */
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
          <button
            onClick={onOpenAddExpense}
            className="mt-4 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[14px] shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
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
              title="Open Receipt in Google Drive"
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
