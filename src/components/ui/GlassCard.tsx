import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  gradientHover?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  gradientHover = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/80 dark:bg-slate-900/90 border border-slate-800/80 dark:border-slate-800 rounded-[24px] p-6 backdrop-blur-md shadow-xl transition-all duration-300 ${
        gradientHover
          ? 'hover:border-emerald-500/40 hover:shadow-emerald-500/10 hover:shadow-2xl'
          : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
