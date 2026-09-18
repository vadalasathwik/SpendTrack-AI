import React, { isValidElement } from 'react';
import { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon | React.ReactNode;
  accentColor?: string;
  badgeText?: string;
  badgeColor?: string;
  className?: string;
  onClick?: () => void;
  trend?: { value: number | string; isPositive?: boolean; isWarning?: boolean };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = '#10B981',
  badgeText,
  badgeColor,
  className = '',
  onClick,
  trend,
}) => {
  const renderIcon = () => {
    if (!icon) return null;

    if (isValidElement(icon)) {
      return icon;
    }

    if (typeof icon === 'function' || typeof icon === 'object') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="w-5 h-5" strokeWidth={2} />;
    }

    return null;
  };

  const getTrendBadgeStyle = () => {
    if (badgeColor) return badgeColor;
    if (trend?.isWarning) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (trend?.isPositive) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  };

  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-[28px] p-6 flex flex-col justify-between h-full min-h-[160px] bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/90 shadow-md dark:shadow-2xl transition-all duration-300 hover:border-emerald-500/30 ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      } ${className}`}
    >
      {/* Top Row: Icon Badge & Trend Chip */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 transition-transform duration-200 hover:scale-105"
          style={{
            backgroundColor: `${accentColor}15`,
            borderColor: `${accentColor}30`,
            color: accentColor,
          }}
        >
          {renderIcon()}
        </div>
        {(badgeText || trend) && (
          <span
            className={`text-[11px] font-extrabold px-3 py-1 rounded-full border shrink-0 uppercase tracking-wider ${getTrendBadgeStyle()}`}
          >
            {badgeText || (trend ? `${trend.isPositive ? '+' : ''}${trend.value}` : '')}
          </span>
        )}
      </div>

      {/* Middle & Bottom: Value, Title, Subtitle */}
      <div className="mt-5 space-y-1">
        <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <div className="text-3xl sm:text-[36px] font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
          {value}
        </div>
        {subtitle && (
          <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed pt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
