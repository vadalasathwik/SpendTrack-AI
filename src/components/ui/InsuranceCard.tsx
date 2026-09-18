import React from 'react';
import { ShieldCheck, Clock, FileText, Trash2 } from 'lucide-react';
import { GlassCard } from './GlassCard.js';

interface InsuranceCardProps {
  policy: {
    id: string;
    title: string;
    type: string;
    provider: string;
    policyNumber?: string;
    premiumAmount: number;
    renewalDate: string;
    coverageAmount: number;
    daysToRenewal?: number;
    status?: 'CRITICAL' | 'UPCOMING' | 'HEALTHY';
  };
  onDelete?: (id: string) => void;
}

export const InsuranceCard: React.FC<InsuranceCardProps> = ({ policy, onDelete }) => {
  const days = policy.daysToRenewal ?? 30;
  const isUrgent = days <= 30;

  return (
    <GlassCard className="p-4 space-y-3 relative group">
      {onDelete && (
        <button
          onClick={() => onDelete(policy.id)}
          className="absolute top-3 right-3 p-1 rounded text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center justify-between pr-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {policy.title}
            </h4>
            <span className="text-[11px] text-slate-400">{policy.provider}</span>
          </div>
        </div>
        <span
          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
            policy.status === 'CRITICAL'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : policy.status === 'UPCOMING'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}
        >
          {days <= 0 ? 'Due Today' : `${days}d to renewal`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/50 dark:border-slate-800">
        <div>
          <span className="text-slate-400 text-[11px]">Coverage</span>
          <p className="font-extrabold text-slate-900 dark:text-white">
            ₹{policy.coverageAmount.toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <span className="text-slate-400 text-[11px]">Annual Premium</span>
          <p className="font-bold text-amber-400">
            ₹{policy.premiumAmount.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Renew: {new Date(policy.renewalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {policy.policyNumber && (
          <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
            #{policy.policyNumber}
          </span>
        )}
      </div>
    </GlassCard>
  );
};
