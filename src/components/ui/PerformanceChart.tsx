import React from 'react';
import { GlassCard } from './GlassCard.js';

interface PerformanceChartProps {
  title: string;
  data: { label: string; value: number }[];
  color?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  title,
  data,
  color = '#10b981',
}) => {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = data
    .map((d, idx) => {
      const x = (idx / (data.length - 1)) * 300;
      const y = 80 - ((d.value - minVal) / range) * 60;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <GlassCard className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
          {title}
        </h4>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Live Trend
        </span>
      </div>

      <div className="relative h-24 w-full pt-2">
        <svg viewBox="0 0 300 90" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <polygon
            points={`0,90 ${points} 300,90`}
            fill="url(#chartGradient)"
          />

          {/* Line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 pt-1 font-mono">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </GlassCard>
  );
};
