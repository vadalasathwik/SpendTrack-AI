import React from 'react';
import { Briefcase, TrendingUp, CheckCircle2 } from 'lucide-react';
import { GlassCard } from './GlassCard.js';

interface SalaryCardProps {
  salary: {
    month: number;
    year: number;
    basic: number;
    hra: number;
    da?: number;
    bonus?: number;
    pfDeduction?: number;
    profTaxDeduction?: number;
    grossSalary: number;
    netSalary: number;
  };
  growthPercentage?: number;
}

export const SalaryCard: React.FC<SalaryCardProps> = ({ salary, growthPercentage }) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const totalDeductions = salary.grossSalary - salary.netSalary;

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {monthNames[(salary.month || 1) - 1]} {salary.year} Payslip
            </h4>
            <span className="text-[11px] text-slate-400">Gross: ₹{salary.grossSalary.toLocaleString('en-IN')}</span>
          </div>
        </div>
        {growthPercentage !== undefined && growthPercentage > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" /> +{growthPercentage}% YoY
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-200/50 dark:border-slate-800 text-center">
        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold block">BASIC</span>
          <span className="font-extrabold text-slate-900 dark:text-white">₹{salary.basic.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold block">HRA</span>
          <span className="font-extrabold text-slate-900 dark:text-white">₹{salary.hra.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-rose-400 font-bold block">DEDUCTIONS</span>
          <span className="font-extrabold text-rose-400">₹{totalDeductions.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Net Take-Home</span>
        </div>
        <p className="text-base font-extrabold text-emerald-400">
          ₹{salary.netSalary.toLocaleString('en-IN')}/mo
        </p>
      </div>
    </GlassCard>
  );
};
