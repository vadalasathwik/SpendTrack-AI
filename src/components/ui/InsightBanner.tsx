import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface InsightBannerProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-[24px] bg-gradient-to-r from-violet-950/80 via-slate-900 to-indigo-950/80 border border-violet-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-black text-white">{title}</h4>
          <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-0.5">
            {description}
          </p>
        </div>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-3.5 py-1.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-slate-950 text-xs font-black flex items-center gap-1 shrink-0 cursor-pointer shadow-md shadow-violet-500/20 transition-all self-start sm:self-auto"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
