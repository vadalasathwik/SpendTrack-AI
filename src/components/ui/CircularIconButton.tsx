import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CircularIconButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  ariaLabel: string;
  badgeCount?: number;
  className?: string;
}

export const CircularIconButton: React.FC<CircularIconButtonProps> = ({
  icon: Icon,
  onClick,
  ariaLabel,
  badgeCount,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`w-10 h-10 rounded-full bg-slate-900/80 border border-white/10 hover:border-white/20 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center relative transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-md ${className}`}
    >
      <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center ring-2 ring-[#070B14]">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  );
};
