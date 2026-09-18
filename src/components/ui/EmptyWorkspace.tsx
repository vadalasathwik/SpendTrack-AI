import React from 'react';
import { LucideIcon, Plus, TrendingUp, Target, FileText, CheckCircle2 } from 'lucide-react';

interface EmptyWorkspaceProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  preset?: 'portfolio' | 'goals' | 'documents' | 'inbox';
  className?: string;
}

export const EmptyWorkspace: React.FC<EmptyWorkspaceProps> = ({
  title,
  description,
  icon: Icon,
  actionText,
  onAction,
  preset,
  className = '',
}) => {
  let displayTitle = title || 'No Items Found';
  let displayDesc = description || 'Start tracking by adding your first item below.';
  let DisplayIcon: LucideIcon = Icon || Plus;
  let displayAction = actionText || 'Add Item';

  if (preset === 'portfolio') {
    displayTitle = 'Add Your First Investment';
    displayDesc = 'Track Mutual Funds, Stocks, FDs, and Sovereign Gold Bonds with automatic CAGR calculation.';
    DisplayIcon = TrendingUp;
    displayAction = 'Add Investment';
  } else if (preset === 'goals') {
    displayTitle = 'Create Your First Wealth Goal';
    displayDesc = 'Set target amounts for FIRE, Home Buying, Education, or Emergency Funds with smart timelines.';
    DisplayIcon = Target;
    displayAction = 'Create Goal';
  } else if (preset === 'documents') {
    displayTitle = 'Scan Aadhaar, PAN, or Insurance Policy';
    displayDesc = 'Upload PDF or photo documents to extract key details automatically with Gemini OCR.';
    DisplayIcon = FileText;
    displayAction = 'Upload Document';
  } else if (preset === 'inbox') {
    displayTitle = "You're All Caught Up!";
    displayDesc = 'No pending bill approvals, tax alerts, or action items require your attention right now.';
    DisplayIcon = CheckCircle2;
    displayAction = 'Refresh Inbox';
  }

  return (
    <div
      className={`glass-panel rounded-[28px] p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-xl ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
        <DisplayIcon className="w-7 h-7" strokeWidth={1.75} />
      </div>
      <div>
        <h4 className="text-sm font-black text-white">{displayTitle}</h4>
        <p className="text-xs text-slate-400 font-medium max-w-sm mt-1 leading-relaxed">
          {displayDesc}
        </p>
      </div>

      {onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{displayAction}</span>
        </button>
      )}
    </div>
  );
};
