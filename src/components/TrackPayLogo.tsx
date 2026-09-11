import React from 'react';
import { Wallet, Check } from 'lucide-react';

interface TrackPayLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const TrackPayLogo: React.FC<TrackPayLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl p-1.5',
    md: 'w-10 h-10 rounded-[14px] p-2',
    lg: 'w-14 h-14 rounded-[18px] p-3',
    xl: 'w-20 h-20 rounded-[24px] p-4',
  };

  const walletIconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  };

  const checkBadgeSizes = {
    sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    md: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
    lg: 'w-4.5 h-4.5 -bottom-1 -right-1',
    xl: 'w-6 h-6 -bottom-1 -right-1',
  };

  const textSizes = {
    sm: 'text-base font-black',
    md: 'text-xl font-black',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClasses[size]} bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center relative shrink-0 ring-1 ring-emerald-400/30`}
      >
        <div className="relative flex items-center justify-center">
          <Wallet className={`${walletIconSizes[size]} stroke-[2.2]`} />
          <div
            className={`absolute ${checkBadgeSizes[size]} bg-emerald-400 text-slate-950 rounded-full flex items-center justify-center font-bold border border-emerald-600 shadow-2xs`}
          >
            <Check className="w-full h-full stroke-[3]" />
          </div>
        </div>
      </div>

      {showText && (
        <span className={`${textSizes[size]} tracking-tight text-slate-900 dark:text-white`}>
          Track<span className="text-emerald-600 dark:text-emerald-400">Pay</span>
        </span>
      )}
    </div>
  );
};
