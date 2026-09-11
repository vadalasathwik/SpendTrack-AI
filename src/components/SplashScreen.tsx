import React, { useEffect, useState } from 'react';
import { TrackPayLogo } from './TrackPayLogo.js';

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 800,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, durationMs - 250);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-300">
        <TrackPayLogo size="xl" />
        <h1 className="text-3xl font-black tracking-tight text-white mt-1">
          Track<span className="text-emerald-400">Pay</span>
        </h1>
        <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
          Smart Personal Finance
        </p>

        {/* Animated Emerald Progress Bar */}
        <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden mt-4 p-0.5 border border-slate-700/60">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-pulse w-full" />
        </div>
      </div>
    </div>
  );
};
