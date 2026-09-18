import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  iconColor?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  action,
  iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${iconColor}`}>
            <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
          </div>
        )}
        <div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs font-medium text-slate-400 mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};
