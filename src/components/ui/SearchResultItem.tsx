import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface SearchResultItemProps {
  title: string;
  subtitle: string;
  amount?: number;
  categoryTag?: string;
  icon: LucideIcon;
  iconColor?: string;
  onClick: () => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  title,
  subtitle,
  amount,
  categoryTag,
  icon: Icon,
  iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 cursor-pointer flex items-center justify-between gap-3 transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${iconColor}`}>
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white truncate">{title}</h4>
            {categoryTag && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {categoryTag}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {amount !== undefined && (
          <span className="text-xs font-black text-emerald-400 font-mono">
            ₹{amount.toLocaleString('en-IN')}
          </span>
        )}
        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
      </div>
    </div>
  );
};
