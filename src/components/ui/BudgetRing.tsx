import React from 'react';

interface BudgetRingProps {
  percentage: number;
  spent: number;
  budget: number;
  remaining: number;
  size?: number;
  className?: string;
}

export const BudgetRing: React.FC<BudgetRingProps> = ({
  percentage,
  spent,
  budget,
  remaining,
  size = 140,
  className = '',
}) => {
  const safePercent = Math.max(0, Math.min(100, percentage));

  let strokeColor = '#18D39E'; // Green below 60%
  let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  if (safePercent > 85) {
    strokeColor = '#EF4444'; // Red above 85%
    badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  } else if (safePercent >= 60) {
    strokeColor = '#F59E0B'; // Amber 60-85%
    badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  }

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-6 ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-2xl font-black text-white font-mono">{safePercent}%</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Used</span>
        </div>
      </div>

      <div className="space-y-3 flex-1 w-full">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-400 uppercase tracking-wider">Remaining Surplus</span>
          <span className={`font-black font-mono text-sm px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
            ₹{remaining.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="w-full bg-slate-900 rounded-full h-3.5 p-0.5 border border-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${safePercent}%`,
              backgroundColor: strokeColor,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>Spent: ₹{spent.toLocaleString('en-IN')}</span>
          <span>Target: ₹{budget.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};
