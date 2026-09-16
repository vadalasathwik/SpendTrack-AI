import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  action,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-[24px] p-8 text-center max-w-md mx-auto space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-extrabold text-white">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
