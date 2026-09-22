import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 bg-gradient-to-b from-slate-900/60 to-slate-900/30 border border-slate-800/80 rounded-[28px] text-center backdrop-blur-xl shadow-xl transition-all ${className}`}
    >
      {/* Icon Container with Emerald Glow */}
      <div className="relative mb-4">
        <div className="absolute -inset-2 rounded-2xl bg-emerald-500/20 blur-xl animate-pulse" />
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 relative z-10 shadow-lg shadow-emerald-500/10">
          <Icon className="w-8 h-8 stroke-[1.8]" />
        </div>
      </div>

      <h3 className="text-lg font-extrabold text-white tracking-tight">{title}</h3>
      <p className="text-xs font-medium text-slate-400 mt-1.5 max-w-[280px] leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>{actionLabel}</span>
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 font-semibold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
