import React, { useState, useEffect } from 'react';
import { X, DollarSign, Tag, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_OPTIONS = [
  'Food',
  'Grocery',
  'Fuel',
  'Shopping',
  'Entertainment',
  'Travel',
  'Bills',
  'Health',
  'Utilities',
  'Dining',
  'Household',
  'Education',
  'Other',
];

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { category: string; monthlyLimit: number }) => Promise<void>;
  initialData?: { id?: string; category: string; monthlyLimit: number } | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [category, setCategory] = useState('Grocery');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category || 'Grocery');
      setMonthlyLimit(initialData.monthlyLimit ? String(initialData.monthlyLimit) : '');
    } else {
      setCategory('Grocery');
      setMonthlyLimit('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(monthlyLimit);

    if (isNaN(limitNum) || limitNum <= 0) {
      setError('Please enter a valid monthly limit greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({ category, monthlyLimit: limitNum });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save budget limit.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-[400px] bg-slate-900 border border-slate-800 rounded-[28px] p-6 shadow-2xl overflow-hidden relative"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {initialData ? 'Edit Budget Limit' : 'Set Category Budget'}
                </h2>
                <p className="text-xs text-slate-400">Monthly limit & smart tracking</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={Boolean(initialData)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50 appearance-none disabled:opacity-60"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Monthly Spending Limit (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Budget'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
