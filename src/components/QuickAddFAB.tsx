import React, { useState } from 'react';
import {
  Plus,
  X,
  Wallet,
  Package,
  Calendar,
  Camera,
} from 'lucide-react';

interface QuickAddFABProps {
  onOpenExpense: () => void;
  onOpenStock: () => void;
  onOpenBill: () => void;
  onOpenScanReceipt: () => void;
}

export const QuickAddFAB: React.FC<QuickAddFABProps> = ({
  onOpenExpense,
  onOpenStock,
  onOpenBill,
  onOpenScanReceipt,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFAB = () => setIsOpen((prev) => !prev);

  const actions = [
    {
      id: 'expense',
      label: 'Expense',
      icon: Wallet,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      onClick: () => {
        setIsOpen(false);
        onOpenExpense();
      },
    },
    {
      id: 'bill',
      label: 'Payment',
      icon: Calendar,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      onClick: () => {
        setIsOpen(false);
        onOpenBill();
      },
    },
    {
      id: 'scan',
      label: 'Receipt',
      icon: Camera,
      color: 'bg-teal-600 hover:bg-teal-700 text-white',
      onClick: () => {
        setIsOpen(false);
        onOpenScanReceipt();
      },
    },
    {
      id: 'stock',
      label: 'Monthly Item',
      icon: Package,
      color: 'bg-amber-600 hover:bg-amber-700 text-white',
      onClick: () => {
        setIsOpen(false);
        onOpenStock();
      },
    },
  ];

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 flex flex-col items-end">
      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Speed Dial Menu Items */}
      {isOpen && (
        <div className="flex flex-col items-end gap-3 mb-3 z-40">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                id={`fab-action-${action.id}`}
                onClick={action.onClick}
                style={{ animationDelay: `${idx * 40}ms` }}
                className="flex items-center gap-2.5 group cursor-pointer animate-in slide-in-from-bottom-3 duration-200 fill-mode-backwards"
              >
                <span className="px-3 py-1 rounded-xl bg-slate-900/90 text-white text-xs font-bold shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95 ${action.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Elevated FAB Toggle Button */}
      <button
        id="main-quick-add-fab"
        onClick={toggleFAB}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-200 z-40 cursor-pointer ${
          isOpen
            ? 'bg-slate-800 rotate-45 shadow-slate-900/30'
            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40 hover:scale-105 active:scale-95'
        }`}
        title="Quick Add Action Menu"
        aria-label="Quick Add"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>
    </div>
  );
};
