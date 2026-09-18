import React, { useState } from 'react';
import { ChevronDown, GripVertical, LucideIcon } from 'lucide-react';

interface WidgetContainerProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  collapsible?: boolean;
  className?: string;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  id,
  title,
  icon: Icon,
  iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  children,
  action,
  collapsible = true,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      id={`widget-${id}`}
      className={`glass-panel rounded-[28px] p-5 sm:p-6 shadow-xl transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/5 gap-3 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <GripVertical className="w-4 h-4 text-slate-600 cursor-grab active:cursor-grabbing shrink-0 hidden sm:inline-block" />
          {Icon && (
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${iconColor}`}>
              <Icon className="w-4 h-4" strokeWidth={1.75} />
            </div>
          )}
          <h3 className="text-sm font-extrabold text-white tracking-tight truncate">{title}</h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {action}
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-7 h-7 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              title={isCollapsed ? 'Expand Widget' : 'Collapse Widget'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && <div className="pt-4 animate-in fade-in duration-200">{children}</div>}
    </div>
  );
};
