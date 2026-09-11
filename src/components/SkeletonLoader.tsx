import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/60 dark:border-slate-800/60 shadow-xs animate-pulse space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[14px] bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="space-y-2">
          <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      </div>
      <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-full" />
    </div>
    <div className="w-full h-10 bg-slate-100 dark:bg-slate-800/60 rounded-[12px]" />
    <div className="flex justify-between items-center pt-2">
      <div className="w-16 h-7 bg-slate-200 dark:bg-slate-800 rounded-[12px]" />
      <div className="w-20 h-7 bg-slate-200 dark:bg-slate-800 rounded-[14px]" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 pb-12 max-w-[1440px] mx-auto animate-pulse">
    {/* Hero Skeleton */}
    <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-[20px]" />
    {/* Safe to spend skeleton */}
    <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-[20px]" />
    {/* Cards grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);
