import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  CreditCard,
  PiggyBank,
  FileText,
  Save,
  Loader2,
  Bell,
  Pin,
  Search,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';
import {
  IncomeItem,
  EmiItem,
  InvestmentItem,
  SavingItem,
  FinancialNote,
} from '../types.js';
import { formatCurrency } from '../utils/calculations.js';

interface FinancialNotebookPageProps {
  incomes: IncomeItem[];
  emis: EmiItem[];
  investments: InvestmentItem[];
  savings: SavingItem[];
  notes: FinancialNote[];
  onAddIncome: (data: { title: string; amount: number }) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
  onAddEmi: (data: any) => Promise<void>;
  onUpdateEmi: (id: string, data: any) => Promise<void>;
  onDeleteEmi: (id: string) => Promise<void>;
  onAddInvestment: (data: any) => Promise<void>;
  onUpdateInvestment: (id: string, data: any) => Promise<void>;
  onDeleteInvestment: (id: string) => Promise<void>;
  onAddSaving: (data: any) => Promise<void>;
  onUpdateSaving: (id: string, data: any) => Promise<void>;
  onDeleteSaving: (id: string) => Promise<void>;
  onSaveNote: (content: string, title?: string, tags?: string, pinned?: boolean) => Promise<void>;
  onUpdateNote?: (id: string, data: any) => Promise<void>;
  onDeleteNote?: (id: string) => Promise<void>;
}

export const FinancialNotebookPage: React.FC<FinancialNotebookPageProps> = ({
  incomes,
  emis,
  investments,
  savings,
  notes,
  onAddIncome,
  onDeleteIncome,
  onAddEmi,
  onUpdateEmi,
  onDeleteEmi,
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  onAddSaving,
  onUpdateSaving,
  onDeleteSaving,
  onSaveNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  // Income Form State
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [incomeTitle, setIncomeTitle] = useState('Salary');
  const [incomeAmount, setIncomeAmount] = useState('');

  // EMI Form State
  const [isAddingEmi, setIsAddingEmi] = useState(false);
  const [emiTitle, setEmiTitle] = useState('');
  const [emiBank, setEmiBank] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [emiDueDay, setEmiDueDay] = useState('10');
  const [emiInterest, setEmiInterest] = useState('');
  const [emiOutstanding, setEmiOutstanding] = useState('');

  // Investment Form State
  const [isAddingInv, setIsAddingInv] = useState(false);
  const [invTitle, setInvTitle] = useState('');
  const [invProvider, setInvProvider] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invType, setInvType] = useState<'SIP' | 'GOLD_SIP' | 'MUTUAL_FUND' | 'STOCKS'>('SIP');
  const [invNextDate, setInvNextDate] = useState(new Date().toISOString().split('T')[0]);

  // Savings Form State
  const [isAddingSav, setIsAddingSav] = useState(false);
  const [savTitle, setSavTitle] = useState('');
  const [savType, setSavType] = useState<'RD' | 'FD' | 'EMERGENCY_FUND'>('RD');
  const [savTarget, setSavTarget] = useState('');
  const [savCurrent, setSavCurrent] = useState('');
  const [savContribution, setSavContribution] = useState('');
  const [savInterest, setSavInterest] = useState('');

  // PHASE 5: ENHANCED NOTES STATE
  const activeNote = notes.length > 0 ? notes[0] : null;
  const [noteTitle, setNoteTitle] = useState(activeNote?.title || 'Monthly Goals 2026');
  const [noteContent, setNoteContent] = useState(activeNote?.content || '');
  const [noteTags, setNoteTags] = useState(activeNote?.tags || 'goals, sips, loans');
  const [isPinned, setIsPinned] = useState(activeNote?.pinned || false);
  const [noteSearch, setNoteSearch] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedMsg, setNoteSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (notes.length > 0) {
      setNoteTitle(notes[0].title || 'Monthly Goals 2026');
      setNoteContent(notes[0].content || '');
      setNoteTags(notes[0].tags || '');
      setIsPinned(notes[0].pinned || false);
    }
  }, [notes]);

  const handleNoteSave = async () => {
    try {
      setIsSavingNote(true);
      await onSaveNote(noteContent, noteTitle, noteTags, isPinned);
      setNoteSavedMsg('Saved to PostgreSQL ✓');
      setTimeout(() => setNoteSavedMsg(null), 3000);
    } catch (err) {
      console.error('Save note error:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Calculations
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalEmi = emis.reduce((sum, item) => sum + item.amount, 0);
  const totalInvestments = investments.reduce((sum, item) => sum + (item.isActive !== false ? item.amount : 0), 0);
  const totalSavings = savings.reduce((sum, item) => sum + item.monthlyContribution, 0);

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(incomeAmount);
    if (!incomeTitle.trim() || isNaN(val) || val <= 0) return;
    await onAddIncome({ title: incomeTitle.trim(), amount: val });
    setIncomeAmount('');
    setIsAddingIncome(false);
  };

  const handleEmiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(emiAmount);
    if (!emiTitle.trim() || !emiBank.trim() || isNaN(amt) || amt <= 0) return;
    await onAddEmi({
      title: emiTitle.trim(),
      bank: emiBank.trim(),
      amount: amt,
      dueDay: parseInt(emiDueDay, 10) || 1,
      interestRate: emiInterest ? parseFloat(emiInterest) : undefined,
      outstanding: emiOutstanding ? parseFloat(emiOutstanding) : undefined,
      reminder: true,
    });
    setEmiTitle('');
    setEmiBank('');
    setEmiAmount('');
    setEmiInterest('');
    setEmiOutstanding('');
    setIsAddingEmi(false);
  };

  const handleInvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(invAmount);
    if (!invTitle.trim() || !invProvider.trim() || isNaN(amt) || amt <= 0) return;
    await onAddInvestment({
      title: invTitle.trim(),
      provider: invProvider.trim(),
      amount: amt,
      type: invType,
      frequency: 'MONTHLY',
      nextDate: invNextDate,
      isActive: true,
    });
    setInvTitle('');
    setInvProvider('');
    setInvAmount('');
    setIsAddingInv(false);
  };

  const handleSavSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(savTarget) || 0;
    const current = parseFloat(savCurrent) || 0;
    const contrib = parseFloat(savContribution) || 0;
    if (!savTitle.trim()) return;
    await onAddSaving({
      title: savTitle.trim(),
      type: savType,
      targetAmount: target,
      currentAmount: current,
      monthlyContribution: contrib,
      interestRate: savInterest ? parseFloat(savInterest) : undefined,
    });
    setSavTitle('');
    setSavTarget('');
    setSavCurrent('');
    setSavContribution('');
    setSavInterest('');
    setIsAddingSav(false);
  };

  return (
    <div className="space-y-8 pb-16 max-w-[1440px] mx-auto">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Financial Notebook ⭐</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Write once, track automatically, and manage monthly commitments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-[16px] border border-emerald-200 dark:border-emerald-800/60 text-right min-w-[150px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              Total Monthly Income
            </span>
            <span className="text-xl font-black text-emerald-900 dark:text-emerald-200">
              {formatCurrency(totalIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: MONTHLY INCOME */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>1. Monthly Income</span>
          </h2>
          <button
            onClick={() => setIsAddingIncome(!isAddingIncome)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-[12px] flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Source</span>
          </button>
        </div>

        {isAddingIncome && (
          <form onSubmit={handleIncomeSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-[16px] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Source Title</label>
                <select
                  value={incomeTitle}
                  onChange={(e) => setIncomeTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="Salary">Salary</option>
                  <option value="Rental Income">Rental Income</option>
                  <option value="Business Income">Business Income</option>
                  <option value="Other Income">Other Income</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Monthly Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150000"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingIncome(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-[10px]"
              >
                Save Source
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {incomes.map((inc) => (
            <div
              key={inc.id}
              className="p-4 rounded-[16px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-500 block">{inc.title}</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {formatCurrency(inc.amount)}
                </span>
              </div>
              <button
                onClick={() => onDeleteIncome(inc.id)}
                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {incomes.length === 0 && (
            <div className="col-span-full p-4 text-center text-xs font-semibold text-slate-400">
              No income sources added yet. Click "Add Source" to set your monthly income.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: EMIs */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>2. Loan EMIs ({emis.length})</span>
            <span className="text-xs font-normal text-slate-400">Total: {formatCurrency(totalEmi)}/mo</span>
          </h2>
          <button
            onClick={() => setIsAddingEmi(!isAddingEmi)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-[12px] flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add EMI</span>
          </button>
        </div>

        {isAddingEmi && (
          <form onSubmit={handleEmiSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-[16px] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Loan Title (e.g. Home Loan)"
                value={emiTitle}
                onChange={(e) => setEmiTitle(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
              <input
                type="text"
                required
                placeholder="Bank (e.g. HDFC Bank)"
                value={emiBank}
                onChange={(e) => setEmiBank(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
              <input
                type="number"
                required
                placeholder="EMI Amount (₹)"
                value={emiAmount}
                onChange={(e) => setEmiAmount(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="Due Day (1-31)"
                value={emiDueDay}
                onChange={(e) => setEmiDueDay(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Interest Rate % (Optional)"
                value={emiInterest}
                onChange={(e) => setEmiInterest(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
              <input
                type="number"
                placeholder="Outstanding Principal (Optional)"
                value={emiOutstanding}
                onChange={(e) => setEmiOutstanding(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddingEmi(false)} className="px-3 py-1.5 text-xs text-slate-500">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-[10px]">
                Save EMI
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emis.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{item.title}</h3>
                  <span className="text-xs text-slate-500 font-semibold">{item.bank}</span>
                </div>
                <span className="text-base font-black text-purple-700 dark:text-purple-300">
                  {formatCurrency(item.amount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-[12px]">
                <span>Due: <strong>{item.dueDay}th of month</strong></span>
                {item.interestRate && <span>Interest: {item.interestRate}%</span>}
              </div>

              {item.outstanding && (
                <p className="text-[11px] font-semibold text-slate-400">
                  Outstanding Principal: {formatCurrency(item.outstanding)}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={() => onUpdateEmi(item.id, { reminder: !item.reminder })}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  <Bell className={`w-3.5 h-3.5 ${item.reminder ? 'text-purple-600 fill-purple-600' : ''}`} />
                  <span>{item.reminder ? 'Reminder On' : 'Reminder Off'}</span>
                </button>

                <button onClick={() => onDeleteEmi(item.id)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {emis.length === 0 && (
            <div className="col-span-full p-4 text-center text-xs font-semibold text-slate-400">
              No loan EMIs added.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: INVESTMENTS */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>3. Monthly Investments (SIP / Gold / Stocks)</span>
            <span className="text-xs font-normal text-slate-400">Total: {formatCurrency(totalInvestments)}/mo</span>
          </h2>
          <button
            onClick={() => setIsAddingInv(!isAddingInv)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-[12px] flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Investment</span>
          </button>
        </div>

        {isAddingInv && (
          <form onSubmit={handleInvSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-[16px] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                placeholder="SIP / Fund Name"
                value={invTitle}
                onChange={(e) => setInvTitle(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
              <input
                type="text"
                required
                placeholder="Provider (e.g. Zerodha, Groww)"
                value={invProvider}
                onChange={(e) => setInvProvider(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
              <input
                type="number"
                required
                placeholder="Monthly Amount (₹)"
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
              <select
                value={invType}
                onChange={(e) => setInvType(e.target.value as any)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              >
                <option value="SIP">Mutual Fund SIP</option>
                <option value="GOLD_SIP">Gold SIP</option>
                <option value="STOCKS">Stock Investment</option>
                <option value="MUTUAL_FUND">Lumpsum Fund</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddingInv(false)} className="px-3 py-1.5 text-xs text-slate-500">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-[10px]">
                Save Investment
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {investments.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{item.title}</h3>
                  <span className="text-xs text-slate-500 font-semibold">{item.provider}</span>
                </div>
                <span className="text-base font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(item.amount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                  {item.type.replace('_', ' ')}
                </span>
                <button
                  onClick={() => onUpdateInvestment(item.id, { isActive: !item.isActive })}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    item.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {item.isActive !== false ? 'Active' : 'Paused'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs text-slate-400">Monthly auto-track</span>
                <button onClick={() => onDeleteInvestment(item.id)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {investments.length === 0 && (
            <div className="col-span-full p-4 text-center text-xs font-semibold text-slate-400">
              No investments added yet.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: SAVINGS */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>4. Savings (RD / FD / Emergency Fund)</span>
            <span className="text-xs font-normal text-slate-400">Total: {formatCurrency(totalSavings)}/mo</span>
          </h2>
          <button
            onClick={() => setIsAddingSav(!isAddingSav)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-[12px] flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Plan</span>
          </button>
        </div>

        {isAddingSav && (
          <form onSubmit={handleSavSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-[16px] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Plan Name (e.g. Emergency Fund)"
                value={savTitle}
                onChange={(e) => setSavTitle(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
              <select
                value={savType}
                onChange={(e) => setSavType(e.target.value as any)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              >
                <option value="RD">Recurring Deposit (RD)</option>
                <option value="FD">Fixed Deposit (FD)</option>
                <option value="EMERGENCY_FUND">Emergency Fund</option>
              </select>
              <input
                type="number"
                placeholder="Monthly Contribution (₹)"
                value={savContribution}
                onChange={(e) => setSavContribution(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="Current Saved Amount (₹)"
                value={savCurrent}
                onChange={(e) => setSavCurrent(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
              <input
                type="number"
                placeholder="Target Goal Amount (₹)"
                value={savTarget}
                onChange={(e) => setSavTarget(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Interest Rate % (Optional)"
                value={savInterest}
                onChange={(e) => setSavInterest(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-white dark:bg-slate-900 border text-xs font-semibold"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddingSav(false)} className="px-3 py-1.5 text-xs text-slate-500">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-[10px]">
                Save Plan
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savings.map((item) => {
            const pct = item.targetAmount > 0 ? Math.min(100, Math.round((item.currentAmount / item.targetAmount) * 100)) : 0;
            return (
              <div
                key={item.id}
                className="p-5 rounded-[20px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{item.title}</h3>
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900 dark:text-white block">
                      {formatCurrency(item.currentAmount)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Target: {formatCurrency(item.targetAmount)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Progress</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs text-slate-500 font-medium">
                    +{formatCurrency(item.monthlyContribution)}/mo
                  </span>
                  <button onClick={() => onDeleteSaving(item.id)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {savings.length === 0 && (
            <div className="col-span-full p-4 text-center text-xs font-semibold text-slate-400">
              No savings plans added.
            </div>
          )}
        </div>
      </section>

      {/* PHASE 5: ENHANCED FINANCIAL NOTES WITH SEARCH, TAGS, PIN & LAST EDITED */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              5. Financial Diary & Smart Notes
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {noteSavedMsg && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                {noteSavedMsg}
              </span>
            )}
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-[12px] border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                isPinned
                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
              <span>{isPinned ? 'Pinned' : 'Pin Note'}</span>
            </button>

            <button
              onClick={handleNoteSave}
              disabled={isSavingNote}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-[12px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Note</span>
            </button>
          </div>
        </div>

        {/* Note Controls: Title & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Note Title</label>
            <input
              type="text"
              placeholder="Title (e.g. Monthly Goals 2026)"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Tags (Comma-separated)</label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. goals, loan, sips"
                value={noteTags}
                onChange={(e) => setNoteTags(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <textarea
          rows={6}
          placeholder="e.g.&#10;• Increase SIP to ₹15,000 in January 2027.&#10;• Close car loan in 2028.&#10;• Buy 100g physical gold by 2031."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className="w-full p-4 rounded-[16px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
        />

        {/* AI SMART NOTE ACTIONS */}
        <div className="p-3 bg-violet-950/40 border border-violet-500/30 rounded-[16px] flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>AI Smart Note Conversions:</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (!noteTitle && !noteContent) return;
                try {
                  const targetDate = new Date();
                  targetDate.setFullYear(targetDate.getFullYear() + 3);
                  await SpendTrackApi.createGoal({
                    title: noteTitle || 'Goal from Note',
                    targetAmount: 100000,
                    targetDate: targetDate.toISOString().split('T')[0],
                    monthlyContribution: 5000,
                  });
                  alert(`Created Goal "${noteTitle || 'Goal from Note'}" in PostgreSQL!`);
                } catch (err: any) {
                  alert(err.message || 'Failed to create goal');
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-violet-900/60 hover:bg-violet-800 text-violet-200 border border-violet-500/30 text-xs font-bold cursor-pointer transition-colors"
            >
              ✓ Convert to Goal
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!noteTitle && !noteContent) return;
                try {
                  const due = new Date();
                  due.setDate(due.getDate() + 7);
                  await SpendTrackApi.createReminder({
                    title: noteTitle || 'Reminder from Note',
                    description: noteContent,
                    dueDate: due.toISOString().split('T')[0],
                    priority: 'MEDIUM',
                  });
                  alert(`Created Reminder "${noteTitle || 'Reminder from Note'}" in PostgreSQL!`);
                } catch (err: any) {
                  alert(err.message || 'Failed to create reminder');
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/30 text-xs font-bold cursor-pointer transition-colors"
            >
              ✓ Convert to Reminder
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!noteTitle && !noteContent) return;
                try {
                  await SpendTrackApi.createInvestment({
                    title: noteTitle || 'Investment from Note',
                    provider: 'Automated Portfolio',
                    amount: 5000,
                    type: 'SIP',
                    nextDate: new Date().toISOString().split('T')[0],
                  });
                  alert(`Created Investment "${noteTitle || 'Investment from Note'}" in PostgreSQL!`);
                } catch (err: any) {
                  alert(err.message || 'Failed to create investment');
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/30 text-xs font-bold cursor-pointer transition-colors"
            >
              ✓ Convert to Investment
            </button>
          </div>
        </div>

        {activeNote?.updatedAt && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Last edited: {new Date(activeNote.updatedAt).toLocaleString()}</span>
          </div>
        )}
      </section>
    </div>
  );
};
