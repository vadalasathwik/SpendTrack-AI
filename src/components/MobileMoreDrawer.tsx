import React from 'react';
import {
  X,
  Package,
  Brain,
  Settings,
  Users,
  Compass,
  FolderTree,
  PieChart,
  Receipt,
  TrendingUp,
  BookOpen,
  Calendar,
  CreditCard,
  PiggyBank,
  Vault,
  Target,
  Activity,
  Sparkles,
} from 'lucide-react';
import { BRAND_NAME } from '../constants/brand.js';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
}) => {
  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'aicfo',
      title: '🤖 AI CFO & Affordability',
      subtitle: 'Simulate purchases, daily spend allowance & monthly reports',
      icon: Sparkles,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      id: 'networth',
      title: '🏛️ Net Worth Dashboard',
      subtitle: 'Total Assets minus Liabilities formula & tracking',
      icon: Vault,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60',
    },
    {
      id: 'goals',
      title: '🎯 Goal Forecast Engine',
      subtitle: 'House, Gold, Car, Vacation & Wedding predictions',
      icon: Target,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    },
    {
      id: 'health',
      title: '⚡ Financial Health Score',
      subtitle: 'Diagnostics (0–100), risk levels & emergency cushion',
      icon: Activity,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
    },
    {
      id: 'notebook',
      title: '⭐ Financial Notebook',
      subtitle: 'Personal diary for Income, EMIs, Investments & Savings',
      icon: BookOpen,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    },
    {
      id: 'planner',
      title: '📅 Monthly Planner',
      subtitle: 'Answers: What will happen this month?',
      icon: Calendar,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
    },
    {
      id: 'wealth',
      title: '🏆 Wealth Allocation',
      subtitle: 'Flagship allocation sliders & free cash calculator',
      icon: PieChart,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      id: 'emis',
      title: '💳 Loan EMIs',
      subtitle: 'Track bank loans, due days & interest rates',
      icon: CreditCard,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
    },
    {
      id: 'investments',
      title: '📈 Investments (SIPs)',
      subtitle: 'Monthly SIPs, Gold, Mutual Funds & Stocks',
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
    },
    {
      id: 'savings',
      title: '🐖 Savings (RD / FD)',
      subtitle: 'Track RDs, FDs & Emergency Fund goals',
      icon: PiggyBank,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60',
    },
    {
      id: 'receipt-scanner',
      title: '📷 AI Receipt Scanner',
      subtitle: 'Convert physical receipts into expenses via Gemini AI',
      icon: Receipt,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
    },
    {
      id: 'budget',
      title: '📊 Monthly Budget Dashboard',
      subtitle: 'Track PostgreSQL budget targets & remaining balance',
      icon: PieChart,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      id: 'categories',
      title: '🏷️ Category Management',
      subtitle: 'Custom categories, color tags & icons',
      icon: FolderTree,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
    },
    {
      id: 'monthly-items',
      title: '📦 Monthly Items',
      subtitle: 'Regular catalog & stock consumption rates',
      icon: Package,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    },
    {
      id: 'analytics',
      title: '📈 Analytics Dashboard',
      subtitle: 'PostgreSQL metrics, trends, category charts & merchants',
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
    },
    {
      id: 'settings',
      title: '⚙️ Settings',
      subtitle: 'Account, categories & CSV export',
      icon: Settings,
      color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        id="mobile-more-drawer"
        className="relative bg-white dark:bg-slate-900 w-[calc(100vw-24px)] max-w-[420px] rounded-[20px] shadow-2xl border border-slate-200/90 dark:border-slate-800 max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Drawer Handle on mobile */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">Tools</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Secondary features & workspace options
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-3 sm:p-4 space-y-2 overflow-y-auto flex-1">
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
                className={`w-full p-3.5 rounded-[16px] flex items-center gap-3.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shadow-2xs'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${item.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-bold truncate ${
                        isSelected ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {item.title}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400 dark:text-slate-500">
          {BRAND_NAME} • Futuristic because it is effortless.
        </div>
      </div>
    </div>
  );
};
