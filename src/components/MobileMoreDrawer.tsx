import React from 'react';
import {
  X,
  ShoppingCart,
  Sparkles,
  Repeat,
  Bot,
  Settings,
  Receipt,
  LayoutDashboard,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  userEmail?: string;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  userEmail,
}) => {
  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'monthly-items',
      title: 'Monthly Items Catalog',
      subtitle: 'Your regular purchases & 1-tap templates',
      icon: ShoppingCart,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      id: 'items',
      title: 'Item Intelligence',
      subtitle: 'Price shifts, lifespans & consumption rates',
      icon: Sparkles,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      id: 'recurring',
      title: 'Recurring Bills',
      subtitle: 'WiFi, utilities, subscriptions & calendar alerts',
      icon: Repeat,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'ai',
      title: 'SpendTrack AI',
      subtitle: 'Instant answers on spending & household burn',
      icon: Bot,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'settings',
      title: 'Workspace & Settings',
      subtitle: 'Google Sheets, Drive, categories & exports',
      icon: Settings,
      color: 'text-slate-600 bg-slate-100',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        id="mobile-more-drawer"
        className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/90 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
      >
        {/* Drawer Handle on mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight">More Features</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {userEmail ? `Connected as ${userEmail}` : 'SpendTrack Command Center'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-3 sm:p-4 space-y-1.5 overflow-y-auto flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`drawer-item-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center gap-3.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 border border-emerald-200 shadow-2xs'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-bold truncate ${
                        isSelected ? 'text-emerald-900' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          SpendTrack • Futuristic because it is effortless.
        </div>
      </div>
    </div>
  );
};
