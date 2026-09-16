import React, { useState } from 'react';
import { Search, X, Receipt, BookOpen, CreditCard, TrendingUp, Target, Bell, ArrowRight } from 'lucide-react';
import { Expense, EmiItem, InvestmentItem, SavingItem, GoalItem, FinancialNote, ReminderItem } from '../types.js';

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
  expenses,
  notes,
  emis,
  investments,
  goals,
  reminders,
  onSelectTab,
}) => {
  const [query, setQuery] = useState('');

  // Register global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredExpenses = q ? expenses.filter((e) => e.itemName.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)).slice(0, 5) : [];
  const filteredNotes = q ? notes.filter((n) => (n.title || '').toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || (n.tags || '').toLowerCase().includes(q)).slice(0, 5) : [];
  const filteredEmis = q ? emis.filter((e) => e.title.toLowerCase().includes(q) || e.bank.toLowerCase().includes(q)).slice(0, 5) : [];
  const filteredInvestments = q ? investments.filter((i) => i.title.toLowerCase().includes(q) || i.provider.toLowerCase().includes(q)).slice(0, 5) : [];
  const filteredGoals = q ? goals.filter((g) => g.title.toLowerCase().includes(q) || (g.category || '').toLowerCase().includes(q)).slice(0, 5) : [];
  const filteredReminders = q ? reminders.filter((r) => r.title.toLowerCase().includes(q)).slice(0, 5) : [];

  const totalResults =
    filteredExpenses.length +
    filteredNotes.length +
    filteredEmis.length +
    filteredInvestments.length +
    filteredGoals.length +
    filteredReminders.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search expenses, notes, EMIs, investments, goals, reminders..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs font-bold text-slate-500 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
            >
              Clear
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {!q ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Type keywords to search across your entire Financial Operating System workspace.
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Expenses */}
              {filteredExpenses.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5 text-emerald-400" /> Expenses</span>
                    <button onClick={() => { onSelectTab('expenses'); onClose(); }} className="text-emerald-400 hover:underline flex items-center gap-0.5">View all <ArrowRight className="w-3 h-3" /></button>
                  </div>
                  <div className="space-y-1.5">
                    {filteredExpenses.map((exp) => (
                      <div key={exp.id} onClick={() => { onSelectTab('expenses'); onClose(); }} className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-all">
                        <div>
                          <p className="text-xs font-bold text-white">{exp.itemName}</p>
                          <p className="text-[10px] text-slate-400">{exp.category} • {exp.purchaseDate}</p>
                        </div>
                        <span className="text-xs font-black text-emerald-400">₹{exp.totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {filteredNotes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-amber-400" /> Financial Notes</span>
                    <button onClick={() => { onSelectTab('notebook'); onClose(); }} className="text-amber-400 hover:underline flex items-center gap-0.5">View all <ArrowRight className="w-3 h-3" /></button>
                  </div>
                  <div className="space-y-1.5">
                    {filteredNotes.map((note) => (
                      <div key={note.id} onClick={() => { onSelectTab('notebook'); onClose(); }} className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer transition-all">
                        <p className="text-xs font-bold text-white">{note.title || 'Untitled Note'}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EMIs */}
              {filteredEmis.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-purple-400" /> Loan EMIs</span>
                    <button onClick={() => { onSelectTab('emis'); onClose(); }} className="text-purple-400 hover:underline flex items-center gap-0.5">View all <ArrowRight className="w-3 h-3" /></button>
                  </div>
                  <div className="space-y-1.5">
                    {filteredEmis.map((emi) => (
                      <div key={emi.id} onClick={() => { onSelectTab('emis'); onClose(); }} className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-all">
                        <div>
                          <p className="text-xs font-bold text-white">{emi.title}</p>
                          <p className="text-[10px] text-slate-400">{emi.bank} • Due {emi.dueDay}th</p>
                        </div>
                        <span className="text-xs font-black text-rose-400">₹{emi.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              {filteredGoals.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-blue-400" /> Goals</span>
                    <button onClick={() => { onSelectTab('goals'); onClose(); }} className="text-blue-400 hover:underline flex items-center gap-0.5">View all <ArrowRight className="w-3 h-3" /></button>
                  </div>
                  <div className="space-y-1.5">
                    {filteredGoals.map((goal) => (
                      <div key={goal.id} onClick={() => { onSelectTab('goals'); onClose(); }} className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-all">
                        <div>
                          <p className="text-xs font-bold text-white">{goal.title}</p>
                          <p className="text-[10px] text-slate-400">Target: ₹{goal.targetAmount.toLocaleString('en-IN')}</p>
                        </div>
                        <span className="text-xs font-bold text-blue-400">{goal.progressPercent || 0}%</span>
                      </div>
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
