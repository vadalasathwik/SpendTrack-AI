import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  badgeText?: string;
  badgeColor?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  badgeText,
  badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  className = '',
}) => {
  return (
    <div
      className={`bg-slate-900/90 border border-slate-800 rounded-[20px] p-5 flex flex-col justify-between backdrop-blur-md shadow-lg transition-all duration-200 hover:border-slate-700 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        </div>
        {badgeText && (
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${badgeColor}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-3">
        <span className="text-2xl font-black text-white tracking-tight block">{value}</span>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};
