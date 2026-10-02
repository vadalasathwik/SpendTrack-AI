import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Tag,
  Edit2,
  Trash2,
  ExternalLink,
  Plus,
  Receipt,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  CreditCard,
  X,
  FileText,
  Check,
  Zap,
  ShieldCheck,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { Expense, CategoryItem, DateRange } from '../types.js';
import { formatCurrency } from '../utils/calculations.js';
import { CATEGORY_COLORS } from '../data/defaults.js';
import { SpendTrackApi } from '../services/api.js';

interface ExpensesPageProps {
  expenses: Expense[];
  incomes?: any[];
  categories: CategoryItem[];
  dateRange: DateRange;
  lastSavedExpenseId?: string | null;
  onOpenAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onSelectItemAnalytics: (itemName: string) => void;
}

export interface UnifiedTransaction {
  id: string;
  type: 'expense' | 'income';
  title: string;
  amount: number;
  category: string;
  date: string;
  rawDate: Date;
  notes?: string;
  paymentMethod?: string;
  source?: string;
  receiptDriveFileId?: string;
  receiptViewLink?: string;
  calendarEventId?: string;
  recurringId?: string;
  rawExpense?: Expense;
  rawIncome?: any;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses = [],
  incomes = [],
  categories = [],
  lastSavedExpenseId,
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense,
  onSelectItemAnalytics,
}) => {
  // Filter & Search State
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTxDetail, setSelectedTxDetail] = useState<UnifiedTransaction | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Subscriptions & Reconciliation info
  const [reconData, setReconData] = useState<any>(null);

  useEffect(() => {
    SpendTrackApi.getReconciliationStatus()
      .then(setReconData)
      .catch(() => {});
  }, []);

  // Format and merge expenses and incomes into a unified transaction list
  const formattedExpenses: UnifiedTransaction[] = expenses.map((exp) => {
    const dateStr = exp.purchaseDate || exp.spentAt || exp.createdAt || new Date().toISOString();
    const parsedDate = new Date(dateStr);
    return {
      id: exp.id,
      type: 'expense',
      title: exp.merchant || exp.itemName || exp.title || 'Expense',
      amount: Number(exp.totalPrice) || Number(exp.amount) || 0,
      category: exp.category || 'General',
      date: dateStr,
      rawDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      notes: exp.notes || undefined,
      paymentMethod: exp.location || 'UPI / Card',
      source: exp.source || (exp.recurringId ? 'recurring' : 'manual'),
      receiptDriveFileId: exp.receiptDriveFileId || undefined,
      receiptViewLink: exp.receiptViewLink || undefined,
      calendarEventId: exp.calendarEventId || undefined,
      recurringId: exp.recurringId || undefined,
      rawExpense: exp,
    };
  });

  const formattedIncomes: UnifiedTransaction[] = incomes.map((inc) => {
    const dateStr = inc.createdAt || inc.date || new Date().toISOString();
    const parsedDate = new Date(dateStr);
    return {
      id: inc.id || `inc_${Math.random()}`,
      type: 'income',
      title: inc.title || inc.source || 'Income Credit',
      amount: Number(inc.amount) || 0,
      category: 'Income',
      date: dateStr,
      rawDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      notes: inc.note || undefined,
      paymentMethod: 'Bank Transfer / Direct Deposit',
      source: 'income',
      rawIncome: inc,
    };
  });

  const allTransactions: UnifiedTransaction[] = [...formattedExpenses, ...formattedIncomes].sort(
    (a, b) => b.rawDate.getTime() - a.rawDate.getTime()
  );

  // Filter transactions by Search, Type Filter (ALL, INCOME, EXPENSE), and Category
  const filteredTransactions = allTransactions.filter((tx) => {
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === 'ALL'
        ? true
        : filterType === 'INCOME'
        ? tx.type === 'income'
        : tx.type === 'expense';

    const matchesCategory =
      selectedCategory === 'ALL' ? true : tx.category === selectedCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Calculate current totals
  const totalSpent = formattedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = formattedIncomes.reduce((sum, i) => sum + i.amount, 0);
  const netCashflow = totalIncome - totalSpent;

  // Helper for grouping transactions by Date Headers ("Today", "Yesterday", "Weekday, Date")
  const groupedTransactions = filteredTransactions.reduce<Record<string, UnifiedTransaction[]>>(
    (groups, tx) => {
      const groupKey = getDateGroupTitle(tx.rawDate);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(tx);
      return groups;
    },
    {}
  );

  function getDateGroupTitle(dateObj: Date): string {
    if (!dateObj || isNaN(dateObj.getTime())) return 'Other Transactions';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return dateObj.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="space-y-4 pb-20 max-w-[1440px] mx-auto" id="transactions-page-container">
      {/* ------------------------------------------------------------- */}
      {/* 1. Header & Add Action                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Transactions
            </h1>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Recorded Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View, search, and manage your outlays & income records
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          id="transactions-add-expense-btn"
          onClick={onOpenAddExpense}
          className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Transaction Summary Cards                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Card 1: Total Spent */}
        <div className="p-3.5 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 block truncate">
            Monthly Spent
          </span>
          <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate mt-0.5 font-mono">
            {formatCurrency(totalSpent)}
          </p>
        </div>

        {/* Card 2: Total Income */}
        <div className="p-3.5 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 block truncate">
            Total Income
          </span>
          <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tracking-tight truncate mt-0.5 font-mono">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Card 3: Net Cashflow */}
        <div className="p-3.5 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-500 block truncate">
            Net Cashflow
          </span>
          <p
            className={`text-sm sm:text-base font-black tracking-tight truncate mt-0.5 font-mono ${
              netCashflow >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-500'
            }`}
          >
            {formatCurrency(netCashflow)}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Search & Filters Bar                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3.5 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            id="transaction-search-input"
            placeholder="Search by merchant, note, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row: All / Income / Expense + Category Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Filter Type Pills: All, Income, Expense */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({allTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('EXPENSE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                filterType === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Expense ({formattedExpenses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('INCOME')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                filterType === 'INCOME'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Income ({formattedIncomes.length})
            </button>
          </div>

          {/* Category Selector */}
          <div className="w-full sm:w-auto min-w-[140px]">
            <select
              id="filter-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Date-Grouped Transaction List                              */}
      {/* ------------------------------------------------------------- */}
      {Object.keys(groupedTransactions).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([dateGroup, items]) => (
            <div key={dateGroup} className="space-y-2">
              {/* Date Group Header */}
              <div className="flex items-center justify-between px-1.5 pt-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{dateGroup}</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {items.length} {items.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {/* Transactions in Date Group */}
              <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/80 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {items.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isNewlySaved = lastSavedExpenseId && tx.id === lastSavedExpenseId;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTxDetail(tx)}
                      className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer ${
                        isNewlySaved
                          ? 'bg-emerald-500/10 dark:bg-emerald-950/40 ring-2 ring-emerald-500/50 animate-pulse'
                          : ''
                      }`}
                    >
                      {/* Left: Type Avatar + Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                            isIncome
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                          style={
                            !isIncome && CATEGORY_COLORS[tx.category]
                              ? { backgroundColor: CATEGORY_COLORS[tx.category] + '20', color: CATEGORY_COLORS[tx.category] }
                              : {}
                          }
                        >
                          {isIncome ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[180px] xs:max-w-[220px]">
                              {tx.title}
                            </h4>
                            {isNewlySaved && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                Newly Saved ✓
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {tx.category}
                            </span>
                            {tx.receiptDriveFileId && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                Receipt ✓
                              </span>
                            )}
                            {tx.recurringId && (
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                                Recurring
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Indicator */}
                      <div className="text-right shrink-0 ml-2">
                        <div
                          className={`text-sm sm:text-base font-black font-mono ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {tx.rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-10 text-center rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <Receipt className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            No transactions found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {searchQuery || selectedCategory !== 'ALL' || filterType !== 'ALL'
              ? 'No transaction records match your active search and filter settings.'
              : 'You have not recorded any transactions yet. Tap + Add Expense to create your first record.'}
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. Transaction Detail View Modal                              */}
      {/* ------------------------------------------------------------- */}
      {selectedTxDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedTxDetail(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-[420px] rounded-[28px] p-5 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                    selectedTxDetail.type === 'income'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {selectedTxDetail.type === 'income' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Transaction Detail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxDetail(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Banner */}
            <div
              className={`p-4 rounded-2xl text-center space-y-0.5 border ${
                selectedTxDetail.type === 'income'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {selectedTxDetail.type === 'income' ? 'Income Amount' : 'Expense Amount'}
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight">
                {selectedTxDetail.type === 'income' ? '+' : '-'}{formatCurrency(selectedTxDetail.amount)}
              </div>
            </div>

            {/* Detailed Properties List */}
            <div className="space-y-2.5 text-xs">
              {/* Title / Merchant */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Title / Merchant</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-right">
                  {selectedTxDetail.title}
                </span>
              </div>

              {/* Category */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Category</span>
                <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  {selectedTxDetail.category}
                </span>
              </div>

              {/* Date & Time */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Date & Time</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedTxDetail.rawDate.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  at {selectedTxDetail.rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Payment Method */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Payment Method</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{selectedTxDetail.paymentMethod}</span>
                </span>
              </div>

              {/* Recurring Status */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Recurring Status</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedTxDetail.recurringId ? 'Recurring Bill' : 'One-Time Transaction'}
                </span>
              </div>

              {/* Notes */}
              {selectedTxDetail.notes && (
                <div className="py-1.5 border-b border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium block">Notes</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium">
                    {selectedTxDetail.notes}
                  </p>
                </div>
              )}

              {/* Receipt Attachment */}
              {selectedTxDetail.receiptViewLink && (
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Receipt Attachment</span>
                  <a
                    href={selectedTxDetail.receiptViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </a>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedTxDetail.rawExpense && (
              <div className="pt-2 flex items-center gap-2 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const rawExp = selectedTxDetail.rawExpense!;
                    setSelectedTxDetail(null);
                    setExpenseToDelete(rawExp);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const rawExp = selectedTxDetail.rawExpense!;
                    setSelectedTxDetail(null);
                    onEditExpense(rawExp);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Transaction</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-[calc(100vw-24px)] max-w-[420px] rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Transaction?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the transaction{' '}
              <strong className="text-slate-900 dark:text-white">"{expenseToDelete.itemName}"</strong> ({formatCurrency(expenseToDelete.totalPrice)})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteExpense(expenseToDelete);
                  setExpenseToDelete(null);
                }}
                className="px-4 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
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
