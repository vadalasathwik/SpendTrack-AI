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
import { Expense, CategoryItem, DateRange } from '../types';
import { filterExpensesByDateRange, formatCurrency } from '../utils/calculations';
import { formatDisplayDate } from '../utils/dateRanges';
import { CATEGORY_COLORS } from '../data/defaults';

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

  // Apply search, category filter, and date range
  const filtered = expenses.filter((exp) => {
    // Text search
    const matchesSearch =
      exp.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.subcategory && exp.subcategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category filter
    const matchesCategory = selectedCategory === 'ALL' || exp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort
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
    <div className="space-y-6 pb-12" id="expenses-page-container">
      {/* 1. Header & Summary Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Expense Log
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              All Purchases
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing <strong className="text-slate-800">{sorted.length}</strong> items totaling{' '}
              <strong className="text-emerald-700">{formatCurrency(totalFilteredSpending)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="expenses-add-new-btn"
              onClick={onOpenAddExpense}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="expense-search-input"
              placeholder="Search expenses, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              id="filter-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-700"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-700"
            >
              <option value="date">Sort by Date</option>
              <option value="price">Sort by Price</option>
              <option value="name">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
              title="Toggle sort order"
            >
              {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Expenses Cards / List */}
      {sorted.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {sorted.map((exp) => (
              <div
                key={exp.id}
                id={`expense-row-${exp.id}`}
                className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                {/* Left side: Category Avatar + Details */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-2xs flex-shrink-0 mt-0.5 sm:mt-0"
                    style={{ backgroundColor: CATEGORY_COLORS[exp.category] || '#64748B' }}
                  >
                    {exp.itemName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onSelectItemAnalytics(exp.itemName)}
                        className="font-bold text-slate-900 hover:text-emerald-600 text-sm sm:text-base text-left cursor-pointer truncate"
                      >
                        {exp.itemName}
                      </button>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {exp.category}
                      </span>
                      {exp.subcategory && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          • {exp.subcategory}
                        </span>
                      )}
                      {exp.receiptDriveFileId && (
                        <span
                          className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200"
                          title="Receipt saved in Drive"
                        >
                          Receipt ✓
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                      <span>{formatDisplayDate(exp.purchaseDate)}</span>

                      {exp.quantity !== undefined && (
                        <span>
                          • {exp.quantity} {exp.unit || 'unit'}
                        </span>
                      )}

                      {exp.pricePerUnit !== undefined && (
                        <span className="text-slate-600">
                          (₹{exp.pricePerUnit}/{exp.unit || 'unit'})
                        </span>
                      )}

                      {exp.durationDays !== undefined && (
                        <span className="text-emerald-700 font-bold">
                          • Lasted {exp.durationDays} days (~₹{exp.dailyCost}/day)
                        </span>
                      )}

                      {exp.notes && (
                        <span className="text-slate-400 italic truncate max-w-xs">
                          • "{exp.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Price + Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="sm:text-right">
                    <div className="text-base sm:text-lg font-black text-slate-900">
                      {formatCurrency(exp.totalPrice)}
                    </div>
                    {exp.dailyQuantity !== undefined && (
                      <div className="text-[10px] text-slate-400 font-medium">
                        {exp.dailyQuantity} {exp.unit}/day
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {exp.receiptViewLink && (
                      <a
                        href={exp.receiptViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 cursor-pointer"
                        title="Open Receipt in Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => onEditExpense(exp)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                      title="Edit Expense"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpenseToDelete(exp)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-slate-400">
          <Receipt className="w-10 h-10 mx-auto mb-3 stroke-1 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No Expenses Found</h3>
          <p className="text-xs mt-1 text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'ALL'
              ? 'No expenditures match your active search or category filters.'
              : 'You have not recorded any expenses yet.'}
          </p>
          <button
            onClick={onOpenAddExpense}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Expense?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete the expense{' '}
              <strong className="text-slate-900">"{expenseToDelete.itemName}"</strong> ({formatCurrency(expenseToDelete.totalPrice)})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteExpense(expenseToDelete);
                  setExpenseToDelete(null);
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
