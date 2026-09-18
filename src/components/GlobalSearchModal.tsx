import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Receipt,
  BookOpen,
  CreditCard,
  TrendingUp,
  Target,
  Bell,
  ArrowRight,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import {
  Expense,
  EmiItem,
  InvestmentItem,
  SavingItem,
  GoalItem,
  FinancialNote,
  ReminderItem,
} from '../types.js';
import { SearchResultItem } from './ui/SearchResultItem.js';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  notes: FinancialNote[];
  emis: EmiItem[];
  investments: InvestmentItem[];
  goals: GoalItem[];
  reminders: ReminderItem[];
  onSelectTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  expenses = [],
  notes = [],
  emis = [],
  investments = [],
  goals = [],
  reminders = [],
  onSelectTab,
}) => {
  const [query, setQuery] = useState('');

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation (Up, Down, Enter, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape') {
        if (isOpen) onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredExpenses = q
    ? expenses.filter((e) => e.itemName.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)).slice(0, 4)
    : [];
  const filteredNotes = q
    ? notes.filter((n) => (n.title || '').toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || (n.tags || '').toLowerCase().includes(q)).slice(0, 4)
    : [];
  const filteredEmis = q
    ? emis.filter((e) => e.title.toLowerCase().includes(q) || e.bank.toLowerCase().includes(q)).slice(0, 4)
    : [];
  const filteredInvestments = q
    ? investments.filter((i) => i.title.toLowerCase().includes(q) || i.provider.toLowerCase().includes(q)).slice(0, 4)
    : [];
  const filteredGoals = q
    ? goals.filter((g) => g.title.toLowerCase().includes(q) || (g.category || '').toLowerCase().includes(q)).slice(0, 4)
    : [];

  const totalResults =
    filteredExpenses.length +
    filteredNotes.length +
    filteredEmis.length +
    filteredInvestments.length +
    filteredGoals.length;

  return (
    <div
      role="dialog"
      aria-label="Universal Command Palette 2.0"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-[#0D1527] border border-white/10 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Spotlight Search Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" strokeWidth={2} />
          <input
            type="text"
            autoFocus
            aria-label="Search items or command palette"
            placeholder="Search expenses, notes, EMIs, investments, goals... (Cmd+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base font-bold text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs font-extrabold text-slate-400 hover:text-white px-2.5 py-1 rounded-xl bg-slate-800"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Spotlight Search Results Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          {!q ? (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Universal Command Palette 2.0</span>
                <span className="text-[10px] text-emerald-400 font-mono">Use ↑ ↓ Enter Esc</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => { onSelectTab('expenses'); onClose(); }}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-emerald-500/40 text-xs font-bold text-white cursor-pointer transition-all hover:scale-102"
                >
                  <Receipt className="w-4 h-4 text-emerald-400 mb-1" /> Add Expense
                </button>
                <button
                  onClick={() => { onSelectTab('goals'); onClose(); }}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-amber-500/40 text-xs font-bold text-white cursor-pointer transition-all hover:scale-102"
                >
                  <Target className="w-4 h-4 text-amber-400 mb-1" /> Create Goal
                </button>
                <button
                  onClick={() => { onSelectTab('emis'); onClose(); }}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-purple-500/40 text-xs font-bold text-white cursor-pointer transition-all hover:scale-102"
                >
                  <CreditCard className="w-4 h-4 text-purple-400 mb-1" /> Manage EMIs
                </button>
                <button
                  onClick={() => { onSelectTab('receipts'); onClose(); }}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-indigo-500/40 text-xs font-bold text-white cursor-pointer transition-all hover:scale-102"
                >
                  <Wallet className="w-4 h-4 text-indigo-400 mb-1" /> Import Statement
                </button>
                <button
                  onClick={() => { onSelectTab('documents'); onClose(); }}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-teal-500/40 text-xs font-bold text-white cursor-pointer transition-all hover:scale-102"
                >
                  <BookOpen className="w-4 h-4 text-teal-400 mb-1" /> Document Vault
                </button>
                <button
                  onClick={() => { onSelectTab('aicfo'); onClose(); }}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-rose-500/40 text-xs font-bold text-white cursor-pointer transition-all hover:scale-102"
                >
                  <TrendingUp className="w-4 h-4 text-rose-400 mb-1" /> Ask AI Copilot
                </button>
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Group 1: Expenses */}
              {filteredExpenses.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                    <span>Expenses</span>
                    <button
                      onClick={() => { onSelectTab('expenses'); onClose(); }}
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {filteredExpenses.map((exp) => (
                      <SearchResultItem
                        key={exp.id}
                        title={exp.itemName}
                        subtitle={`${exp.category} • ${exp.purchaseDate}`}
                        amount={exp.totalPrice}
                        icon={Receipt}
                        iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        onClick={() => { onSelectTab('expenses'); onClose(); }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group 2: Financial Notes */}
              {filteredNotes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                    <span>Financial Notes</span>
                    <button
                      onClick={() => { onSelectTab('notebook'); onClose(); }}
                      className="text-amber-400 hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {filteredNotes.map((note) => (
                      <SearchResultItem
                        key={note.id}
                        title={note.title || 'Untitled Note'}
                        subtitle={note.content}
                        categoryTag={note.tags}
                        icon={BookOpen}
                        iconColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
                        onClick={() => { onSelectTab('notebook'); onClose(); }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group 3: Loan EMIs */}
              {filteredEmis.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                    <span>Loan EMIs</span>
                    <button
                      onClick={() => { onSelectTab('notebook'); onClose(); }}
                      className="text-purple-400 hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {filteredEmis.map((emi) => (
                      <SearchResultItem
                        key={emi.id}
                        title={emi.title}
                        subtitle={`${emi.bank} • Due ${emi.dueDay}th`}
                        amount={emi.amount}
                        icon={CreditCard}
                        iconColor="text-purple-400 bg-purple-500/10 border-purple-500/20"
                        onClick={() => { onSelectTab('notebook'); onClose(); }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group 4: SIP & Investments */}
              {filteredInvestments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                    <span>Investments & SIPs</span>
                    <button
                      onClick={() => { onSelectTab('notebook'); onClose(); }}
                      className="text-blue-400 hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {filteredInvestments.map((inv) => (
                      <SearchResultItem
                        key={inv.id}
                        title={inv.title}
                        subtitle={`${inv.provider} • Next ${inv.nextDate}`}
                        amount={inv.amount}
                        icon={TrendingUp}
                        iconColor="text-blue-400 bg-blue-500/10 border-blue-500/20"
                        onClick={() => { onSelectTab('notebook'); onClose(); }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
