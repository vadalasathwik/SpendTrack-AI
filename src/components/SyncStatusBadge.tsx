import React from 'react';
import { RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';
import { SyncStatus } from '../types.js';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  isOnline: boolean;
  onRetry?: () => void;
  compact?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  isOnline,
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
        <span>Saving changes...</span>
      </div>
    );
  }

  if (status.state === 'error') {
    return null;
  }

  // Saved / Synced
  return (
    <div
      id="sync-status-synced"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
      title={status.lastSyncedAt ? `Last saved: ${status.lastSyncedAt.toLocaleTimeString()}` : 'Saved securely in TrackPay'}
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>{compact ? 'Saved' : 'Saved securely in TrackPay'}</span>
    </div>
  );
};
