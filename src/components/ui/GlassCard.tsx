import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  gradientHover?: boolean;
  onClick?: () => void;
  padding?: string;
  radius?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  gradientHover = false,
  onClick,
  padding = 'p-6',
  radius = 'rounded-[28px]',
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel ${radius} ${padding} bg-white/95 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800/90 shadow-md dark:shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        gradientHover ? 'glass-panel-hover' : ''
      } ${onClick ? 'cursor-pointer hover:border-emerald-500/30 hover:shadow-lg' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
