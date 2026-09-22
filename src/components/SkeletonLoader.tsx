import React from 'react';

export const GlassShimmerItem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-800/50 dark:bg-slate-800/60 rounded-xl animate-shimmer ${className}`} />
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-[24px] border border-slate-800/80 shadow-lg space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <GlassShimmerItem className="w-10 h-10 rounded-[14px] shrink-0" />
        <div className="space-y-2">
          <GlassShimmerItem className="w-32 h-4" />
          <GlassShimmerItem className="w-20 h-3" />
        </div>
      </div>
      <GlassShimmerItem className="w-16 h-5 rounded-full" />
    </div>
    <GlassShimmerItem className="w-full h-10 rounded-[14px]" />
    <div className="flex justify-between items-center pt-2">
      <GlassShimmerItem className="w-20 h-6" />
      <GlassShimmerItem className="w-24 h-7 rounded-[14px]" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 pb-12 max-w-[1440px] mx-auto animate-pulse">
    {/* Hero Banner Skeleton */}
    <div className="h-48 bg-gradient-to-br from-slate-900/90 to-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-[28px] p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <GlassShimmerItem className="w-28 h-3" />
          <GlassShimmerItem className="w-48 h-8" />
        </div>
        <GlassShimmerItem className="w-12 h-12 rounded-2xl" />
      </div>
      <div className="flex gap-4">
        <GlassShimmerItem className="w-32 h-10 rounded-2xl" />
        <GlassShimmerItem className="w-32 h-10 rounded-2xl" />
      </div>
    </div>

    {/* Metric Cards Grid Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-900/60 backdrop-blur-md p-4 rounded-[20px] border border-slate-800/80 space-y-3">
          <GlassShimmerItem className="w-20 h-3" />
          <GlassShimmerItem className="w-28 h-6" />
          <GlassShimmerItem className="w-16 h-3" />
        </div>
      ))}
    </div>

    {/* Cards grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

export const WalletSkeleton: React.FC = () => (
  <div className="space-y-6 pb-12 max-w-[1440px] mx-auto animate-pulse">
    {/* Payment Cards Stack Skeleton */}
    <div className="h-52 bg-gradient-to-r from-emerald-950/40 to-slate-900/80 backdrop-blur-xl border border-emerald-900/30 rounded-[28px] p-6 flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <GlassShimmerItem className="w-32 h-5" />
        <GlassShimmerItem className="w-10 h-6 rounded-md" />
      </div>
      <GlassShimmerItem className="w-56 h-6 my-4" />
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <GlassShimmerItem className="w-20 h-3" />
          <GlassShimmerItem className="w-28 h-4" />
        </div>
        <GlassShimmerItem className="w-16 h-4" />
      </div>
    </div>

    {/* Quick Action Buttons Skeleton */}
    <div className="flex gap-3 overflow-x-auto pb-2">
      {[1, 2, 3, 4].map((i) => (
        <GlassShimmerItem key={i} className="w-28 h-12 rounded-2xl shrink-0" />
      ))}
    </div>

    {/* Payment Methods Grid Skeleton */}
    <div className="space-y-3">
      <GlassShimmerItem className="w-40 h-5" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  </div>
);

export const ReceiptsSkeleton: React.FC = () => (
  <div className="space-y-6 pb-12 max-w-[1440px] mx-auto animate-pulse">
    {/* Search & Filter Header Skeleton */}
    <div className="flex items-center gap-3">
      <GlassShimmerItem className="flex-1 h-12 rounded-2xl" />
      <GlassShimmerItem className="w-12 h-12 rounded-2xl" />
    </div>

    {/* Category Pills Skeleton */}
    <div className="flex gap-2 overflow-x-auto">
      {[1, 2, 3, 4, 5].map((i) => (
        <GlassShimmerItem key={i} className="w-24 h-9 rounded-full shrink-0" />
      ))}
    </div>

    {/* Receipt Vault Cards Grid Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-slate-900/60 backdrop-blur-md p-4 rounded-[24px] border border-slate-800/80 space-y-4">
          <GlassShimmerItem className="w-full h-36 rounded-2xl" />
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <GlassShimmerItem className="w-32 h-4" />
              <GlassShimmerItem className="w-24 h-3" />
            </div>
            <GlassShimmerItem className="w-16 h-6 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const BudgetSkeleton: React.FC = () => (
  <div className="space-y-6 pb-12 max-w-[1440px] mx-auto animate-pulse">
    {/* Budget Header Card Skeleton */}
    <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-[28px] border border-slate-800/80 space-y-5">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <GlassShimmerItem className="w-36 h-4" />
          <GlassShimmerItem className="w-48 h-8" />
        </div>
        <GlassShimmerItem className="w-20 h-8 rounded-full" />
      </div>
      <GlassShimmerItem className="w-full h-4 rounded-full" />
      <div className="flex justify-between text-xs">
        <GlassShimmerItem className="w-24 h-3" />
        <GlassShimmerItem className="w-24 h-3" />
      </div>
    </div>

    {/* Category Budgets Grid Skeleton */}
    <div className="space-y-3">
      <GlassShimmerItem className="w-44 h-5" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-900/60 backdrop-blur-md p-4 rounded-[20px] border border-slate-800/80 space-y-3">
            <div className="flex justify-between items-center">
              <GlassShimmerItem className="w-28 h-4" />
              <GlassShimmerItem className="w-20 h-4" />
            </div>
            <GlassShimmerItem className="w-full h-3 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-6 pb-12 max-w-[1440px] mx-auto animate-pulse">
    {/* Timeframe Selector Skeleton */}
    <div className="flex justify-between items-center">
      <GlassShimmerItem className="w-36 h-6" />
      <GlassShimmerItem className="w-48 h-10 rounded-2xl" />
    </div>

    {/* Main Chart Skeleton */}
    <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-[28px] border border-slate-800/80 space-y-4">
      <div className="flex justify-between items-center">
        <GlassShimmerItem className="w-40 h-5" />
        <GlassShimmerItem className="w-24 h-4" />
      </div>
      <GlassShimmerItem className="w-full h-56 rounded-2xl" />
    </div>

    {/* Breakdown Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-[24px] border border-slate-800/80 space-y-4">
        <GlassShimmerItem className="w-36 h-4" />
        <GlassShimmerItem className="w-full h-40 rounded-xl" />
      </div>
      <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-[24px] border border-slate-800/80 space-y-4">
        <GlassShimmerItem className="w-36 h-4" />
        <GlassShimmerItem className="w-full h-40 rounded-xl" />
      </div>
    </div>
  </div>
);
