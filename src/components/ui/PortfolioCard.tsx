import React from 'react';
import { TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { GlassCard } from './GlassCard.js';

interface PortfolioCardProps {
  holding: {
    id: string;
    name: string;
    symbol?: string;
    assetType: string;
    quantity: number;
    buyPrice: number;
    currentPrice: number;
    invested: number;
    currentValue: number;
    sector?: string;
    cagr?: number;
  };
  onDelete?: (id: string) => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ holding, onDelete }) => {
  const pnl = holding.currentValue - holding.invested;
  const pnlPercent = holding.invested > 0 ? (pnl / holding.invested) * 100 : 0;
  const isPositive = pnl >= 0;

  return (
    <GlassCard className="p-4 flex flex-col justify-between space-y-3 relative group">
      {onDelete && (
        <button
          onClick={() => onDelete(holding.id)}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
          title="Delete holding"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center justify-between pr-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {holding.assetType}
          </span>
          <h4 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">
            {holding.name}
          </h4>
          {holding.sector && (
            <p className="text-xs text-slate-400">{holding.sector}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
        <div>
          <span className="text-[11px] text-slate-400">Current Value</span>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
            ₹{holding.currentValue.toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-slate-400">Invested</span>
          <p className="text-sm font-medium text-slate-400">
            ₹{holding.invested.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-xs">
        <div className={`flex items-center gap-1 font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>
            {isPositive ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN')} ({pnlPercent.toFixed(1)}%)
          </span>
        </div>
        {holding.cagr && holding.cagr > 0 && (
          <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
            CAGR: {holding.cagr}%
          </span>
        )}
      </div>
    </GlassCard>
  );
};
