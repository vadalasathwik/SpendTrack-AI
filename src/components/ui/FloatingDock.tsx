import React from 'react';
import {
  Home,
  Wallet,
  Receipt,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface FloatingDockProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickAdd?: () => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const items = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'expenses', label: 'Transactions', icon: Receipt },
    { id: 'planner', label: 'Plan', icon: Calendar },
    { id: 'wallet', label: 'Vault', icon: Wallet },
    { id: 'ai', label: 'AI', icon: Sparkles },
  ];

  return (
    <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-[430px] pointer-events-auto pb-[env(safe-area-inset-bottom,0px)]">
      <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 rounded-[24px] sm:rounded-[28px] px-1 sm:px-2 py-1.5 sm:py-2 flex items-center justify-between shadow-2xl shadow-slate-950/80">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-label={item.label}
              className={`flex-1 min-w-0 min-h-[44px] flex flex-col items-center justify-center px-1 sm:px-2 py-1 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                isActive
                  ? 'text-emerald-400 font-extrabold bg-emerald-500/15 ring-1 ring-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon
                className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${
                  isActive ? 'scale-110 text-emerald-400' : ''
                }`}
                strokeWidth={2}
              />
              <span className="text-[10px] sm:text-[11px] font-bold mt-0.5 tracking-tight truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
