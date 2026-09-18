import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  PieChart,
  CreditCard,
  TrendingUp,
  PiggyBank,
  Calendar,
  BookOpen,
  Plus,
  Bot,
  ShieldCheck,
  Coins,
  Users,
  XCircle,
  Wand2,
  Check,
  Slash,
} from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';

interface FinanceOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (homeMode: string) => void;
}

export interface OnboardingSelections {
  hasLoans: boolean | null;
  hasInvestments: boolean | null;
  hasSavings: boolean | null;
  hasInsurance: boolean | null;
  hasGold: boolean | null;
  hasFamilyWorkspace: boolean | null;
}

export const FinanceOnboardingWizard: React.FC<FinanceOnboardingWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);

  // Selections for optional modules
  const [selections, setSelections] = useState<OnboardingSelections>({
    hasLoans: null,
    hasInvestments: null,
    hasSavings: null,
    hasInsurance: null,
    hasGold: null,
    hasFamilyWorkspace: null,
  });

  // Step 1: Income
  const [salary, setSalary] = useState<string>('120000');
  const [rental, setRental] = useState<string>('20000');
  const [otherIncome, setOtherIncome] = useState<string>('0');

  // Step 2: Budget Controlled States
  const [currency, setCurrency] = useState<string>('INR');
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState<string>('105000');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(105000);
  const [budgetStartDayInput, setBudgetStartDayInput] = useState<string>('1');
  const [budgetStartDay, setBudgetStartDay] = useState<number>(1);

  const [livingBudget, setLivingBudget] = useState<string>('45000');
  const [emiBudget, setEmiBudget] = useState<string>('25000');
  const [investmentBudget, setInvestmentBudget] = useState<string>('20000');
  const [savingsBudget, setSavingsBudget] = useState<string>('15000');

  // Step 3: EMI (Optional)
  const [emiBank, setEmiBank] = useState<string>('HDFC Bank');
  const [emiTitle, setEmiTitle] = useState<string>('Home Loan EMI');
  const [emiAmount, setEmiAmount] = useState<string>('25000');
  const [emiDueDay, setEmiDueDay] = useState<string>('10');

  // Step 4: Investments (Optional)
  const [invTitle, setInvTitle] = useState<string>('Nifty 50 Index SIP');
  const [invProvider, setInvProvider] = useState<string>('Zerodha');
  const [invAmount, setInvAmount] = useState<string>('15000');

  // Step 5: Savings (Optional)
  const [savTitle, setSavTitle] = useState<string>('Emergency Cushion Fund');
  const [savTarget, setSavTarget] = useState<string>('300000');
  const [savCurrent, setSavCurrent] = useState<string>('75000');
  const [savMonthly, setSavMonthly] = useState<string>('10000');

  // Step 6 & 7: Experience & Summary
  const [selectedHomeMode, setSelectedHomeMode] = useState<string>('default');
  const [saving, setSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalIncome = (Number(salary) || 0) + (Number(rental) || 0) + (Number(otherIncome) || 0);
  const totalAllocated =
    (Number(livingBudget) || 0) +
    (Number(emiBudget) || 0) +
    (Number(investmentBudget) || 0) +
    (Number(savingsBudget) || 0);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    if (newCurrency === 'USD') setCurrencySymbol('$');
    else if (newCurrency === 'EUR') setCurrencySymbol('€');
    else if (newCurrency === 'GBP') setCurrencySymbol('£');
    else setCurrencySymbol('₹');
  };

  const handleMonthlyBudgetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/[^\d]/g, '');
    setMonthlyBudgetInput(digits);
    const num = parseInt(digits, 10);
    setMonthlyBudget(isNaN(num) ? 0 : num);
  };

  const handleBudgetStartDayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/[^\d]/g, '');
    setBudgetStartDayInput(digits);
    const num = parseInt(digits, 10);
    if (!isNaN(num)) {
      setBudgetStartDay(Math.min(31, Math.max(1, num)));
    } else {
      setBudgetStartDay(0);
    }
  };

  const isBudgetValid = monthlyBudget > 0 && budgetStartDay >= 1 && budgetStartDay <= 31;

  const handleFinishOnboarding = async () => {
    if (!isBudgetValid) return;
    setSaving(true);
    try {
      // 1. Save Incomes
      let incomeSaved = false;
      if (salary && Number(salary) > 0) {
        await SpendTrackApi.createIncome({ title: 'Primary Salary', amount: Number(salary) });
        incomeSaved = true;
      }
      if (rental && Number(rental) > 0) {
        await SpendTrackApi.createIncome({ title: 'Rental Income', amount: Number(rental) });
        incomeSaved = true;
      }

      // 2. Save EMI ONLY if user selected Loans
      let emiSaved = false;
      if (selections.hasLoans && emiAmount && Number(emiAmount) > 0) {
        await SpendTrackApi.createEmi({
          title: emiTitle,
          bank: emiBank,
          amount: Number(emiAmount),
          dueDay: Number(emiDueDay),
        });
        emiSaved = true;
      }

      // 3. Save Investment ONLY if user selected Investments
      if (selections.hasInvestments && invAmount && Number(invAmount) > 0) {
        await SpendTrackApi.createInvestment({
          title: invTitle,
          provider: invProvider,
          amount: Number(invAmount),
          type: 'SIP',
          nextDate: new Date().toISOString().split('T')[0],
        });
      }

      // 4. Save Saving ONLY if user selected Savings
      let savingsSaved = false;
      if (selections.hasSavings && savMonthly && Number(savMonthly) > 0) {
        await SpendTrackApi.createSaving({
          title: savTitle,
          type: 'EMERGENCY_FUND',
          targetAmount: Number(savTarget || 300000),
          currentAmount: Number(savCurrent || 75000),
          monthlyContribution: Number(savMonthly),
        });
        savingsSaved = true;
      }

      // 5. Save Settings & Module Preferences
      await SpendTrackApi.saveSettings({
        homeMode: selectedHomeMode,
        monthlyBudget: String(monthlyBudget || totalAllocated),
        budgetStartDay: String(budgetStartDay),
        currency: currency,
        currencySymbol: currencySymbol,
      });

      if (process.env.NODE_ENV !== 'production') {
        if (incomeSaved) console.log('✓ Income saved');
        console.log('✓ Budget saved');
        if (emiSaved) console.log('✓ EMI saved');
        if (savingsSaved) console.log('✓ Savings saved');
      }

      await onComplete(selectedHomeMode);
      onClose();
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      alert(err.message || 'Failed to complete setup wizard');
    } finally {
      setSaving(false);
    }
  };

  const handleModuleDecision = (key: keyof OnboardingSelections, choice: boolean) => {
    setSelections((prev) => ({ ...prev, [key]: choice }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Wizard Header & Dynamic Progress */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Step {step} of 7 • Adaptive Setup
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {step === 1 && '1. Configure Monthly Income'}
              {step === 2 && '2. Define Monthly Household Budget'}
              {step === 3 && '3. Loan & EMI Commitments'}
              {step === 4 && '4. Investments & Wealth Building'}
              {step === 5 && '5. Savings & Emergency Cushion'}
              {step === 6 && '6. Insurance, Gold & Family'}
              {step === 7 && '7. Review Setup & Launch'}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i + 1 === step ? 'bg-emerald-500 w-5' : i + 1 < step ? 'bg-emerald-600/80' : 'bg-slate-300 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: INCOME */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Record your monthly income streams to power live burn rate and cash flow forecasting.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Salary ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rental / Passive Income ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={rental}
                  onChange={(e) => setRental(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Monthly Inflow:</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{currencySymbol}{totalIncome.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* STEP 2: BUDGET FOUNDATION */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Set up your core household monthly budget foundation. This amount is required for burn rate calculation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Household Budget <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-500 dark:text-slate-400 pointer-events-none select-none">
                    {currencySymbol}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="50,000"
                    value={monthlyBudgetInput}
                    onChange={handleMonthlyBudgetInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Total household spending budget for one month.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Budget Start Day <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1"
                value={budgetStartDayInput}
                onChange={handleBudgetStartDayInputChange}
                className="w-full sm:w-1/2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Day of month (1 - 31)</p>
            </div>
          </div>
        )}

        {/* STEP 3: LOANS (ADAPTIVE DECISION CARD) */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Do you have any active loan EMIs?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Home loans, car loans, or personal credit commitments. You can skip this step anytime.
              </p>
            </div>

            {/* Decision Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleModuleDecision('hasLoans', true)}
                className={`min-h-[56px] p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selections.hasLoans === true
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-md'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h4 className="font-extrabold text-sm">Yes, add active loan</h4>
                    <p className="text-xs opacity-75">Configure monthly EMI schedule</p>
                  </div>
                </div>
                {selections.hasLoans === true && <Check className="w-5 h-5 text-emerald-500 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleModuleDecision('hasLoans', false);
                  setStep(4);
                }}
                className={`min-h-[56px] p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selections.hasLoans === false
                    ? 'border-slate-400 dark:border-slate-600 bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Slash className="w-5 h-5 text-slate-400" />
                  <div>
                    <h4 className="font-bold text-sm">No, skip loans</h4>
                    <p className="text-xs opacity-75">Proceed to investments</p>
                  </div>
                </div>
                {selections.hasLoans === false && <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Skipped</span>}
              </button>
            </div>

            {/* Loan Inputs Expanded Form */}
            {selections.hasLoans === true && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">Configure Primary Loan EMI</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Loan Name</label>
                    <input
                      type="text"
                      value={emiTitle}
                      onChange={(e) => setEmiTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={emiBank}
                      onChange={(e) => setEmiBank(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly EMI ({currencySymbol})</label>
                    <input
                      type="number"
                      value={emiAmount}
                      onChange={(e) => setEmiAmount(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Due Day of Month</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={emiDueDay}
                      onChange={(e) => setEmiDueDay(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: INVESTMENTS (ADAPTIVE DECISION CARD) */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Do you invest in SIPs, Stocks, or Mutual Funds?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track monthly investment contributions and SIP wealth accumulation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleModuleDecision('hasInvestments', true)}
                className={`min-h-[56px] p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selections.hasInvestments === true
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-md'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h4 className="font-extrabold text-sm">Yes, add SIP or Investment</h4>
                    <p className="text-xs opacity-75">Track portfolio growth</p>
                  </div>
                </div>
                {selections.hasInvestments === true && <Check className="w-5 h-5 text-emerald-500 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleModuleDecision('hasInvestments', false);
                  setStep(5);
                }}
                className={`min-h-[56px] p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selections.hasInvestments === false
                    ? 'border-slate-400 dark:border-slate-600 bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Slash className="w-5 h-5 text-slate-400" />
                  <div>
                    <h4 className="font-bold text-sm">No, skip investments</h4>
                    <p className="text-xs opacity-75">Proceed to savings</p>
                  </div>
                </div>
                {selections.hasInvestments === false && <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Skipped</span>}
              </button>
            </div>

            {selections.hasInvestments === true && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">Configure Primary SIP</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Investment Name</label>
                    <input
                      type="text"
                      value={invTitle}
                      onChange={(e) => setInvTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Platform / Broker</label>
                    <input
                      type="text"
                      value={invProvider}
                      onChange={(e) => setInvProvider(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Contribution ({currencySymbol})</label>
                    <input
                      type="number"
                      value={invAmount}
                      onChange={(e) => setInvAmount(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: SAVINGS (ADAPTIVE DECISION CARD) */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Do you have active emergency funds or savings goals?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Set up emergency cushions or target deposit goals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleModuleDecision('hasSavings', true)}
                className={`min-h-[56px] p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selections.hasSavings === true
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-md'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <PiggyBank className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h4 className="font-extrabold text-sm">Yes, add savings goal</h4>
                    <p className="text-xs opacity-75">Emergency fund or deposits</p>
                  </div>
                </div>
                {selections.hasSavings === true && <Check className="w-5 h-5 text-emerald-500 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleModuleDecision('hasSavings', false);
                  setStep(6);
                }}
                className={`min-h-[56px] p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selections.hasSavings === false
                    ? 'border-slate-400 dark:border-slate-600 bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Slash className="w-5 h-5 text-slate-400" />
                  <div>
                    <h4 className="font-bold text-sm">No, skip savings</h4>
                    <p className="text-xs opacity-75">Proceed to optional features</p>
                  </div>
                </div>
                {selections.hasSavings === false && <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Skipped</span>}
              </button>
            </div>

            {selections.hasSavings === true && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">Configure Emergency Cushion</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Savings Name</label>
                    <input
                      type="text"
                      value={savTitle}
                      onChange={(e) => setSavTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Deposit ({currencySymbol})</label>
                    <input
                      type="number"
                      value={savMonthly}
                      onChange={(e) => setSavMonthly(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Amount ({currencySymbol})</label>
                    <input
                      type="number"
                      value={savTarget}
                      onChange={(e) => setSavTarget(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Saved ({currencySymbol})</label>
                    <input
                      type="number"
                      value={savCurrent}
                      onChange={(e) => setSavCurrent(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: INSURANCE, GOLD & FAMILY DECISION CARDS */}
        {step === 6 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Additional Workspaces & Modules</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enable optional modules for insurance policy vaults, precious metal tracking, or family sharing.
              </p>
            </div>

            <div className="space-y-3">
              {/* Insurance Module Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-purple-500" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Insurance Vault</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Health, life, and motor policies</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleModuleDecision('hasInsurance', true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selections.hasInsurance === true
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    Enable
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModuleDecision('hasInsurance', false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selections.hasInsurance === false
                        ? 'bg-slate-400 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Skip
                  </button>
                </div>
              </div>

              {/* Gold & Silver Reserve Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Gold & Silver Workspace</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Physical bullion reserves</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleModuleDecision('hasGold', true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selections.hasGold === true
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    Enable
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModuleDecision('hasGold', false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selections.hasGold === false
                        ? 'bg-slate-400 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Skip
                  </button>
                </div>
              </div>

              {/* Family Workspace Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Family Workspace</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Shared household budget</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleModuleDecision('hasFamilyWorkspace', true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selections.hasFamilyWorkspace === true
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    Enable
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModuleDecision('hasFamilyWorkspace', false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      selections.hasFamilyWorkspace === false
                        ? 'bg-slate-400 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: HOME EXPERIENCE & FINISH SUMMARY */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Setup Complete & Experience Preference</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review your configured modules before entering TrackPay Personal CFO OS.
              </p>
            </div>

            {/* Included vs Skipped Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider block">
                Setup Breakdown
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Included List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Included Modules
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Household Budget
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Income Streams
                    </span>
                    {selections.hasLoans && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Loans & EMIs
                      </span>
                    )}
                    {selections.hasInvestments && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Investments & SIPs
                      </span>
                    )}
                    {selections.hasSavings && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Emergency Savings
                      </span>
                    )}
                    {selections.hasInsurance && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Insurance Vault
                      </span>
                    )}
                    {selections.hasGold && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Gold Reserve
                      </span>
                    )}
                  </div>
                </div>

                {/* Skipped List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Skipped Modules (Zero Data Created)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {!selections.hasLoans && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-medium">
                        Loans & EMIs
                      </span>
                    )}
                    {!selections.hasInvestments && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-medium">
                        Investments & SIPs
                      </span>
                    )}
                    {!selections.hasSavings && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-medium">
                        Emergency Savings
                      </span>
                    )}
                    {!selections.hasInsurance && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-medium">
                        Insurance Vault
                      </span>
                    )}
                    {!selections.hasGold && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-medium">
                        Gold Reserve
                      </span>
                    )}
                    {!selections.hasFamilyWorkspace && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-medium">
                        Family Workspace
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Home Experience Mode Selection */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider block">
                Preferred Home Experience
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'default', title: 'Default Executive', desc: 'Balanced OS dashboard with health score, stats & timeline', icon: Sparkles },
                  { id: 'calendar', title: 'Calendar First', desc: 'Large monthly planner view for date-focused managers', icon: Calendar },
                  { id: 'notebook', title: 'Notebook First', desc: 'Financial diary with quick notes and smart AI note tools', icon: BookOpen },
                  { id: 'quickadd', title: 'Quick Add First', desc: 'Huge action buttons for fast daily expense entry', icon: Plus },
                  { id: 'aicfo', title: 'AI CFO First', desc: 'Interactive chat-first assistant with financial context', icon: Bot },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedHomeMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedHomeMode(opt.id)}
                      className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white shadow-md font-extrabold'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`p-2 rounded-xl border ${isSelected ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs sm:text-sm">{opt.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER NAVIGATION & FINISH CONTROLS */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200"
              >
                Edit Setup
              </button>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={saving || !isBudgetValid}
                className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-xl transition-all cursor-pointer ${
                  saving || !isBudgetValid
                    ? 'bg-slate-400 opacity-40 pointer-events-none text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white hover:scale-102'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Initializing OS...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Enter Finance OS</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
