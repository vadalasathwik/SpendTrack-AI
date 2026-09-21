import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, WifiOff, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SyncStatus } from '../types.js';
import { offlineSyncManager, SyncStatusInfo } from '../services/offlineSyncManager.js';

interface SyncStatusBadgeProps {
  status?: SyncStatus;
  isOnline?: boolean;
  compact?: boolean;
  onOpenConflictModal?: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  compact = false,
  onOpenConflictModal,
}) => {
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>({
    state: offlineSyncManager.isOnline() ? 'synced' : 'offline',
    pendingCount: 0,
    lastSyncedAt: new Date(),
    conflictCount: 0,
  });

  useEffect(() => {
    const unsubscribe = offlineSyncManager.subscribe((info) => {
      setSyncInfo(info);
    });
    return unsubscribe;
  }, []);

  // 1. Conflict State
  if (syncInfo.state === 'conflict' || syncInfo.conflictCount > 0) {
    return (
      <button
        id="sync-status-conflict"
        onClick={onOpenConflictModal}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-all cursor-pointer animate-pulse"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
        <span>{syncInfo.conflictCount} Conflict{syncInfo.conflictCount > 1 ? 's' : ''} to Resolve</span>
      </button>
    );
  }

  // 2. Offline State
  if (syncInfo.state === 'offline' || !offlineSyncManager.isOnline()) {
    return (
      <div
        id="sync-status-offline"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
        title="App is running offline. All changes are saved locally & queued."
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>
          {syncInfo.pendingCount > 0
            ? `Offline (${syncInfo.pendingCount} pending)`
            : 'Offline Mode'}
        </span>
      </div>
    );
  }

  // 3. Syncing State
  if (syncInfo.state === 'syncing') {
    return (
      <div
        id="sync-status-syncing"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
      >
        <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
        <span>Syncing {syncInfo.pendingCount > 0 ? `${syncInfo.pendingCount} items` : 'changes'}...</span>
      </div>
    );
  }

  // 4. Synced & Secured State
  return (
    <div
      id="sync-status-synced"
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
      title={syncInfo.lastSyncedAt ? `Last synced: ${syncInfo.lastSyncedAt.toLocaleTimeString()}` : 'Encrypted & Synced'}
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
      <span>{compact ? 'Synced' : 'Synced & Encrypted'}</span>
    </div>
  );
};
