import React from 'react';
import { GlassCard } from './GlassCard.js';

export const SkeletonMetric: React.FC = () => {
  return (
    <GlassCard padding="p-4" className="space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-800/80 rounded-full" />
        <div className="h-6 w-6 rounded-xl bg-slate-800/80" />
      </div>
      <div className="h-7 w-36 bg-slate-800/90 rounded-lg" />
      <div className="h-2.5 w-20 bg-slate-800/60 rounded-full" />
    </GlassCard>
  );
};

export const SkeletonChart: React.FC = () => {
  return (
    <GlassCard padding="p-6" className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-4 w-32 bg-slate-800/80 rounded-lg" />
          <div className="h-2.5 w-48 bg-slate-800/50 rounded-full" />
        </div>
        <div className="h-6 w-20 bg-slate-800/70 rounded-xl" />
      </div>
      <div className="h-48 w-full bg-slate-900/60 rounded-2xl flex items-end justify-between p-4 gap-2">
        <div className="w-1/6 bg-slate-800/50 rounded-t-lg h-[40%]" />
        <div className="w-1/6 bg-slate-800/50 rounded-t-lg h-[70%]" />
        <div className="w-1/6 bg-slate-800/50 rounded-t-lg h-[50%]" />
        <div className="w-1/6 bg-slate-800/50 rounded-t-lg h-[85%]" />
        <div className="w-1/6 bg-slate-800/50 rounded-t-lg h-[65%]" />
        <div className="w-1/6 bg-slate-800/50 rounded-t-lg h-[95%]" />
      </div>
    </GlassCard>
  );
};

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 4 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: items }).map((_, idx) => (
        <GlassCard key={idx} padding="p-4" className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-1/3 bg-slate-800/90 rounded-md" />
              <div className="h-2.5 w-1/4 bg-slate-800/60 rounded-md" />
            </div>
          </div>
          <div className="h-5 w-20 bg-slate-800/80 rounded-lg" />
        </GlassCard>
      ))}
    </div>
  );
};

export const SkeletonCalendar: React.FC = () => {
  return (
    <GlassCard padding="p-6" className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-36 bg-slate-800/80 rounded-xl" />
        <div className="h-8 w-28 bg-slate-800/80 rounded-2xl" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, idx) => (
          <div key={idx} className="h-20 bg-slate-900/60 border border-white/5 rounded-2xl p-2 space-y-1">
            <div className="h-3 w-4 bg-slate-800/80 rounded-full" />
            {idx % 3 === 0 && <div className="h-2 w-full bg-slate-800/60 rounded-md" />}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
