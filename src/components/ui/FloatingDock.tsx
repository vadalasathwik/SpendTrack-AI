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
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'receipts', label: 'Receipts', icon: Receipt },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'ai', label: 'AI', icon: Sparkles },
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-[420px] pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-[28px] px-2 py-2 flex items-center justify-around shadow-2xl shadow-slate-950/80">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-emerald-400 font-extrabold bg-emerald-500/15 ring-1 ring-emerald-500/30 scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110 text-emerald-400' : ''
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
