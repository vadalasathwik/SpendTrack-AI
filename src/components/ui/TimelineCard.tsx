import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TimelineCardProps {
  title: string;
  subtitle: string;
  amount?: number;
  dateStr?: string;
  typeBadge?: string;
  badgeColor?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({
  title,
  subtitle,
  amount,
  dateStr,
  typeBadge,
  badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  icon: Icon,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-[20px] bg-slate-900/60 border border-white/5 hover:border-white/15 transition-all duration-200 flex items-center justify-between gap-3 ${
        onClick ? 'cursor-pointer hover:bg-slate-800/60' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 text-slate-300">
            <Icon className="w-4 h-4" strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white truncate">{title}</h4>
            {typeBadge && (
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeColor}`}>
                {typeBadge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="text-right shrink-0">
        {amount !== undefined && (
          <span className="text-xs font-black text-white block font-mono">
            ₹{amount.toLocaleString('en-IN')}
          </span>
        )}
        {dateStr && <span className="text-[10px] font-bold text-slate-500 block mt-0.5">{dateStr}</span>}
      </div>
    </div>
  );
};
