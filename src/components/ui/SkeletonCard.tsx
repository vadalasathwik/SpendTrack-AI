import React from 'react';

interface SkeletonCardProps {
  height?: string;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 'h-36',
  className = '',
}) => {
  return (
    <div
      className={`glass-panel rounded-[28px] p-6 animate-pulse space-y-4 ${height} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-2xl bg-slate-800" />
        <div className="w-16 h-4 rounded-full bg-slate-800" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="w-24 h-3 rounded-full bg-slate-800" />
        <div className="w-40 h-8 rounded-xl bg-slate-800" />
      </div>
    </div>
  );
};
