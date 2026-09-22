import React, { useState } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle2, ServerCrash, X } from 'lucide-react';

/* 1. Retry Button */
interface RetryButtonProps {
  onRetry: () => void | Promise<void>;
  label?: string;
  className?: string;
  isRetrying?: boolean;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  label = 'Retry Connection',
  className = '',
  isRetrying = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onRetry();
    } finally {
      setLoading(false);
    }
  };

  const activeLoading = isRetrying || loading;

  return (
    <button
      onClick={handleClick}
      disabled={activeLoading}
      className={`px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 select-none ${className}`}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${activeLoading ? 'animate-spin' : ''}`} />
      <span>{activeLoading ? 'Retrying...' : label}</span>
    </button>
  );
};

/* 2. Offline Banner */
interface OfflineBannerProps {
  isOffline: boolean;
  pendingCount?: number;
  onDismiss?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  pendingCount = 0,
  onDismiss,
}) => {
  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs font-semibold select-none animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 max-w-[90%]">
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
        <span>
          You are offline. {pendingCount > 0 ? `${pendingCount} changes saved locally & queued.` : 'App features remain fully functional offline.'}
        </span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss offline banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

/* 3. Server Unavailable Card */
interface ServerUnavailableCardProps {
  onRetry: () => void | Promise<void>;
  title?: string;
  message?: string;
  className?: string;
}

export const ServerUnavailableCard: React.FC<ServerUnavailableCardProps> = ({
  onRetry,
  title = 'Server Unavailable',
  message = 'Unable to reach SpendTrack servers. You can continue working offline; all changes will sync automatically when reconnected.',
  className = '',
}) => {
  return (
    <div
      className={`p-6 rounded-[28px] bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center space-y-4 max-w-md mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
        <ServerCrash className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-extrabold text-white">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
      </div>

      <RetryButton onRetry={onRetry} label="Retry Connection" />
    </div>
  );
};

/* 4. Sync Successful Toast */
interface SyncSuccessToastProps {
  show: boolean;
  message?: string;
  onClose?: () => void;
}

export const SyncSuccessToast: React.FC<SyncSuccessToastProps> = ({
  show,
  message = 'Sync Successful! All offline changes synced with server.',
  onClose,
}) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <p className="text-xs font-bold text-white">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-emerald-800/50 rounded-lg text-emerald-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
