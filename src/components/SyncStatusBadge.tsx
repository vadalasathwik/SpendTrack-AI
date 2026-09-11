import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, WifiOff, Cloud } from 'lucide-react';
import { SyncStatus } from '../types.js';
import { sanitizeErrorMessage } from '../utils/calculations.js';

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
        <span>Syncing workspace...</span>
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
      title={status.lastSyncedAt ? `Last synchronized: ${status.lastSyncedAt.toLocaleTimeString()}` : 'Synced with Google'}
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>{compact ? 'Synced' : 'Synced with Google'}</span>
    </div>
  );
};
