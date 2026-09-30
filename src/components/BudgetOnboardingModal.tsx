import React, { useState } from 'react';
import { Wallet, ArrowRight, X } from 'lucide-react';
import { UserSettings } from '../types.js';
import { BRAND_NAME } from '../constants/brand.js';
import { FormLabel } from './ui/FormLabel.js';
import { CurrencyInput } from './ui/CurrencyInput.js';
import { InputField } from './ui/InputField.js';

interface BudgetOnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSave: (settings: Partial<UserSettings>) => Promise<void>;
}

export const BudgetOnboardingModal: React.FC<BudgetOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [monthlyBudget, setMonthlyBudget] = useState<string>('');
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

  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
      <div
        id="budget-onboarding-modal-dialog"
        className="bg-slate-900 w-[calc(100vw-24px)] max-w-[420px] rounded-[20px] shadow-2xl border border-slate-800 p-5 sm:p-6 space-y-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative"
      >
        {/* Close Button (X) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close budget setup"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Wallet className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Welcome to {BRAND_NAME}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Set up your household monthly budget foundation. This will power your burn rate and predictions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Monthly Budget */}
          <div>
            <FormLabel required htmlFor="onboarding-monthly-budget">
              Monthly Household Budget
            </FormLabel>
            <CurrencyInput
              required
              id="onboarding-monthly-budget"
              placeholder="50,000"
              currencySymbol={symbol}
              value={monthlyBudget}
              onChange={handleBudgetChange}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Total household spending budget for one month.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Budget Start Day */}
            <div>
              <FormLabel required htmlFor="onboarding-budget-start-day">
                Budget Start Day
              </FormLabel>
              <InputField
                required
                type="text"
                inputMode="numeric"
                id="onboarding-budget-start-day"
                value={budgetStartDay}
                onChange={handleStartDayChange}
              />
              <p className="text-[11px] text-slate-400 mt-1">Day of month (1 - 31)</p>
            </div>

            {/* Currency */}
            <div>
              <FormLabel htmlFor="onboarding-currency-select">Currency</FormLabel>
              <select
                id="onboarding-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-400 caret-emerald-400 px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-bold text-sm"
              >
                <option value="INR" className="bg-slate-900 text-white">INR (₹)</option>
                <option value="USD" className="bg-slate-900 text-white">USD ($)</option>
                <option value="EUR" className="bg-slate-900 text-white">EUR (€)</option>
                <option value="GBP" className="bg-slate-900 text-white">GBP (£)</option>
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
                ? 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            <span>{isSubmitting ? 'Saving Settings...' : 'Save & Initialize Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Skip for now */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center hover:bg-slate-800/50"
            >
              Skip for now
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
