import React from 'react';
import {
  Home,
  Receipt,
  Plus,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface FloatingDockProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickAdd,
}) => {
  const items = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'quickadd', label: 'Add', icon: Plus, isFab: true },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'ai', label: 'AI CFO', icon: Sparkles },
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md pointer-events-auto">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[28px] px-3.5 py-2.5 flex items-center justify-around shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/60">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isFab) {
            return (
              <button
                key={item.id}
                onClick={onOpenQuickAdd}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-200 ring-4 ring-emerald-500/20 -mt-6 shrink-0 cursor-pointer"
                aria-label="Quick Add Action"
              >
                <Plus className="w-7 h-7 stroke-[2.5]" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 ring-1 ring-emerald-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110 text-emerald-600 dark:text-emerald-400' : ''
                }`}
                strokeWidth={2}
              />
              <span className="text-[10px] font-bold mt-0.5 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
