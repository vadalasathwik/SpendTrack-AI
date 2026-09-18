import React from 'react';
import { CheckCircle2, Clock, FileText, LucideIcon, Sparkles } from 'lucide-react';

interface FinanceInboxCardProps {
  id: string;
  title: string;
  subtitle: string;
  amount?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  aiExplanation?: string;
  categoryTag?: string;
  icon?: LucideIcon;
  onComplete?: () => void;
  onSnooze?: () => void;
  onConvertToNote?: () => void;
  className?: string;
}

export const FinanceInboxCard: React.FC<FinanceInboxCardProps> = ({
  title,
  subtitle,
  amount,
  priority,
  aiExplanation,
  categoryTag,
  icon: Icon,
  onComplete,
  onSnooze,
  onConvertToNote,
  className = '',
}) => {
  const priorityStyles = {
    HIGH: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    LOW: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };

  return (
    <div
      className={`glass-panel rounded-[24px] p-4 space-y-3 shadow-lg transition-all duration-200 hover:border-white/20 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 text-slate-300 mt-0.5">
              <Icon className="w-5 h-5" strokeWidth={1.75} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-black text-white truncate">{title}</h4>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${priorityStyles[priority]}`}>
                {priority} Priority
              </span>
              {categoryTag && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {categoryTag}
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">{subtitle}</p>
          </div>
        </div>

        {amount !== undefined && (
          <span className="text-sm font-black text-white font-mono shrink-0">
            ₹{amount.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {aiExplanation && (
        <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/20 text-[11px] font-medium text-violet-200 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{aiExplanation}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
        {onSnooze && (
          <button
            onClick={onSnooze}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Snooze</span>
          </button>
        )}
        {onConvertToNote && (
          <button
            onClick={onConvertToNote}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>To Note</span>
          </button>
        )}
        {onComplete && (
          <button
            onClick={onComplete}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete</span>
          </button>
        )}
      </div>
    </div>
  );
};
