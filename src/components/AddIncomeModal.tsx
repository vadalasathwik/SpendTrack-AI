import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ArrowDownLeft, AlertCircle } from 'lucide-react';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; amount: number; date?: string; paymentMethod?: string; notes?: string }) => Promise<void>;
}

const INCOME_SOURCES = ['Salary', 'Freelance', 'Business', 'Bonus', 'Investment Return', 'Gift / Other'];
const PAYMENT_METHODS = ['Bank Transfer', 'UPI', 'Direct Deposit', 'Cash', 'Check'];

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('Salary');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('Salary');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Bank Transfer');
      setNotes('');
      setError(null);
      setTimeout(() => amountInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Please enter an income source or title.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      amountInputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        title: title.trim(),
        amount: numAmount,
        date,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save income record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white dark:bg-slate-900 w-[calc(100vw-24px)] max-w-[420px] rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Add Income
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Record salary, freelance, or inflow credits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[14px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none">₹</span>
              <input
                ref={amountInputRef}
                type="number"
                inputMode="decimal"
                step="any"
                required
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 text-base sm:text-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 caret-cyan-400 text-right tabular-nums rounded-[12px] focus:ring-2 focus:ring-cyan-500 focus:outline-none font-black min-h-[44px] transition-all"
              />
            </div>
          </div>

          {/* Title / Source Selectable Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Income Source <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {INCOME_SOURCES.map((src) => {
                const isSelected = title === src;
                return (
                  <button
                    type="button"
                    key={src}
                    onClick={() => setTitle(src)}
                    className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all border cursor-pointer min-h-[38px] flex items-center gap-1 active:scale-95 ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    <span>{src}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              required
              placeholder="Or enter custom source (e.g. Consulting)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold min-h-[40px]"
            />
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none font-semibold min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Deposit Account / Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none font-semibold min-h-[44px]"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Client details, invoice number, reference..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-extrabold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Income'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
