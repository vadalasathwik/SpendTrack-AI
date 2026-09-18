import React from 'react';
import { CreditCard, Calendar, ArrowUpRight } from 'lucide-react';
import { GlassCard } from './GlassCard.js';

interface LoanProgressCardProps {
  loan: {
    id: string;
    title: string;
    bank: string;
    emiAmount: number;
    outstanding: number;
    interestRate: number;
    dueDay: number;
    estimatedMonthlyInterest?: number;
    estimatedMonthlyPrincipal?: number;
    remainingMonths?: number;
    principalVsInterestRatio?: number;
  };
  onSimulate?: (loan: any) => void;
}

export const LoanProgressCard: React.FC<LoanProgressCardProps> = ({ loan, onSimulate }) => {
  const principalRatio = loan.principalVsInterestRatio || 60;
  const interestRatio = 100 - principalRatio;

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {loan.title}
            </h4>
            <span className="text-[11px] text-purple-400 font-semibold">{loan.bank}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-extrabold text-slate-400">Monthly EMI</span>
          <p className="text-sm font-extrabold text-emerald-400">
            ₹{loan.emiAmount.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/50 dark:border-slate-800">
        <div>
          <span className="text-slate-400 text-[11px]">Outstanding</span>
          <p className="font-bold text-slate-900 dark:text-white">
            ₹{loan.outstanding.toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <span className="text-slate-400 text-[11px]">ROI %</span>
          <p className="font-bold text-indigo-400">{loan.interestRate}% p.a.</p>
        </div>
      </div>

      {/* Principal vs Interest progress bar */}
      <div className="space-y-1 pt-1">
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
          <span>Principal: {principalRatio}%</span>
          <span>Interest: {interestRatio}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div style={{ width: `${principalRatio}%` }} className="bg-emerald-400 h-full" />
          <div style={{ width: `${interestRatio}%` }} className="bg-purple-500 h-full" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>Due on {loan.dueDay}th • ~{loan.remainingMonths || 24} mos left</span>
        </div>
        {onSimulate && (
          <button
            onClick={() => onSimulate(loan)}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            Part-Payment <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </GlassCard>
  );
};
