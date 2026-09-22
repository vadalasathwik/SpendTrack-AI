import React from 'react';
import { WifiOff, Home, RefreshCw } from 'lucide-react';
import { SpendTrackLogo } from '../components/TrackPayLogo.js';

export const OfflineFallbackPage: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  const handleReload = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="space-y-6 max-w-sm">
        <div className="flex justify-center">
          <SpendTrackLogo size="xl" />
        </div>

        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/10">
          <WifiOff className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">You are Offline</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            SpendTrack AI is running in offline mode. Your data, receipts, and offline vault remain completely accessible.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={handleReload}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Check Network Connection</span>
          </button>
        </div>
      </div>
    </div>
  );
};
