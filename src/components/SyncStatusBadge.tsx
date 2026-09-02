import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, WifiOff, Cloud } from 'lucide-react';
import { SyncStatus } from '../types';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  isOnline: boolean;
  onRetry?: () => void;
  compact?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  isOnline,
  onRetry,
  compact = false,
}) => {
  if (!isOnline) {
    return (
      <div
        id="sync-status-offline"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
      >
        <WifiOff className="w-3.5 h-3.5" />
        <span>You are offline</span>
      </div>
    );
  }

  if (status.state === 'saving' || status.state === 'syncing') {
    return (
      <div
        id="sync-status-saving"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>{status.state === 'saving' ? 'Saving to Sheets...' : 'Syncing with Google...'}</span>
      </div>
    );
  }

  if (status.state === 'error') {
    return (
      <div
        id="sync-status-error"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate max-w-[150px] sm:max-w-xs">{status.errorMessage || 'Unable to save'}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-1 underline font-semibold hover:text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Saved / Synced
  return (
    <div
      id="sync-status-synced"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
      title={status.lastSyncedAt ? `Last synchronized: ${status.lastSyncedAt.toLocaleTimeString()}` : 'Synced with Google'}
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>{compact ? 'Synced' : 'Synced with Google'}</span>
    </div>
  );
};
