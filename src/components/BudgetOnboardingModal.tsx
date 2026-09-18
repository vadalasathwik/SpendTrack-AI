import React, { useState } from 'react';
import { Wallet, Calendar, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserSettings } from '../types.js';
import { BRAND_NAME } from '../constants/brand.js';

interface BudgetOnboardingModalProps {
  isOpen: boolean;
  onSave: (settings: Partial<UserSettings>) => Promise<void>;
}

export const BudgetOnboardingModal: React.FC<BudgetOnboardingModalProps> = ({
  isOpen,
  onSave,
}) => {
  const [monthlyBudget, setMonthlyBudget] = useState<string>('30000');
  const [budgetStartDay, setBudgetStartDay] = useState<string>('1');
  const [currency, setCurrency] = useState<string>('INR');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const budgetNum = parseFloat(monthlyBudget) || 0;
  const startDayNum = parseInt(budgetStartDay, 10);
  const isStartDayValid = !isNaN(startDayNum) && startDayNum >= 1 && startDayNum <= 31;
  const isValid = budgetNum > 0 && isStartDayValid;

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/[^\d]/g, '');
    setMonthlyBudget(cleanDigits);
  };

  const handleStartDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/[^\d]/g, '');
    if (cleanDigits === '') {
      setBudgetStartDay('');
      return;
    }
    const val = parseInt(cleanDigits, 10);
    if (val >= 1 && val <= 31) {
      setBudgetStartDay(val.toString());
    } else if (val > 31) {
      setBudgetStartDay('31');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError('Please provide a valid budget amount (> 0) and start day (1 - 31).');
      return;
    }

    let symbol = '₹';
    if (currency === 'USD') symbol = '$';
    else if (currency === 'EUR') symbol = '€';
    else if (currency === 'GBP') symbol = '£';

    try {
      setIsSubmitting(true);
      await onSave({
        monthlyBudget: budgetNum,
        budgetStartDay: startDayNum,
        currency,
        currencySymbol: symbol,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save budget settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm">
      <div
        id="budget-onboarding-modal-dialog"
        className="bg-white dark:bg-slate-900 w-[calc(100vw-24px)] max-w-[420px] rounded-[20px] shadow-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Wallet className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome to {BRAND_NAME}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Set up your household monthly budget foundation. This will power your burn rate and predictions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Monthly Budget */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Monthly Household Budget <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">
                {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹'}
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                id="onboarding-monthly-budget"
                placeholder="50,000"
                value={monthlyBudget}
                onChange={handleBudgetChange}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-black text-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Total household spending budget for one month.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Budget Start Day */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Budget Start Day <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  id="onboarding-budget-start-day"
                  value={budgetStartDay}
                  onChange={handleStartDayChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Day of month (1 - 31)</p>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
              <select
                id="onboarding-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-bold text-slate-900"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            id="onboarding-submit-btn"
            className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 ${
              !isValid || isSubmitting
                ? 'bg-slate-400 opacity-40 pointer-events-none'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
            }`}
          >
            <span>{isSubmitting ? 'Saving Settings...' : 'Save & Initialize Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
