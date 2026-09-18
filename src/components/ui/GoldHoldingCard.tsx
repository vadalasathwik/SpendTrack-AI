import React from 'react';
import { Coins, Flame, Trash2 } from 'lucide-react';
import { GlassCard } from './GlassCard.js';

interface GoldHoldingCardProps {
  holding: {
    id: string;
    metalType: string;
    form: string;
    grams: number;
    buyPricePerGram: number;
    currentPricePerGram: number;
    totalCost: number;
    currentValue: number;
    purchasedAt: string;
  };
  onDelete?: (id: string) => void;
}

export const GoldHoldingCard: React.FC<GoldHoldingCardProps> = ({ holding, onDelete }) => {
  const isGold = holding.metalType === 'GOLD';
  const pnl = holding.currentValue - holding.totalCost;
  const isPositive = pnl >= 0;

  return (
    <GlassCard className="p-4 space-y-3 relative group">
      {onDelete && (
        <button
          onClick={() => onDelete(holding.id)}
          className="absolute top-3 right-3 p-1 rounded text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center justify-between pr-6">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isGold
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-slate-400/10 text-slate-300 border-slate-400/20'
            }`}
          >
            {isGold ? <Coins className="w-5 h-5 text-amber-400" /> : <Flame className="w-5 h-5 text-slate-300" />}
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {holding.form.replace(/_/g, ' ')}
            </h4>
            <span className="text-[11px] font-bold text-amber-400">{holding.grams} grams</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase text-slate-400 font-bold">Valuation</span>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
            ₹{holding.currentValue.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/50 dark:border-slate-800">
        <div>
          <span className="text-slate-400 text-[11px]">Buy Rate /g</span>
          <p className="font-bold text-slate-900 dark:text-white">
            ₹{holding.buyPricePerGram.toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <span className="text-slate-400 text-[11px]">Total Cost</span>
          <p className="font-medium text-slate-400">
            ₹{holding.totalCost.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-1">
        <span className="text-slate-400">
          {new Date(holding.purchasedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? '+' : ''}₹{pnl.toLocaleString('en-IN')}
        </span>
      </div>
    </GlassCard>
  );
};
