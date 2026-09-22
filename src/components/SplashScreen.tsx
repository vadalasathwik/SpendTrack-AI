import React, { useEffect, useState } from 'react';
import { SpendTrackLogo } from './TrackPayLogo.js';

interface SplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 1200,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, durationMs - 300);

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
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-opacity duration-300 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-5 text-center animate-in zoom-in-95 duration-400">
        {/* Logo Container with Emerald Glowing Ring */}
        <div className="relative flex items-center justify-center">
          {/* Outer Ambient Glow */}
          <div className="absolute -inset-6 rounded-full bg-emerald-500/25 blur-2xl animate-pulse" />
          {/* Glowing Ring Animation */}
          <div className="absolute -inset-3 rounded-full border-2 border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-ping opacity-75" />
          <div className="absolute -inset-3 rounded-full border border-emerald-400/40 shadow-[0_0_50px_rgba(16,185,129,0.3)]" />
          
          <SpendTrackLogo size="xl" className="relative z-10 drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]" />
        </div>

        <div className="flex flex-col items-center mt-2">
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-1.5">
            SpendTrack <span className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]">AI</span>
          </h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">
            Smart Personal Finance OS
          </p>
        </div>

        {/* Emerald Loading Progress Bar */}
        <div className="w-28 h-1 bg-slate-900 rounded-full overflow-hidden mt-4 p-0.5 border border-slate-800">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full animate-pulse w-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
        </div>
      </div>
    </div>
  );
};
