/**
 * SpendTrack AI Offline Sync Manager
 * Orchestrates online/offline state monitoring, offline write queueing,
 * automatic queue processing upon reconnection, and conflict handling.
 */

import {
  enqueueMutation,
  getPendingMutations,
  removeMutation,
  updateMutationStatus,
  saveCachedItem,
  deleteCachedItem,
  OfflineMutation,
} from './offlineStore.js';
import { SpendTrackApi } from './api.js';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'conflict';

export interface SyncStatusInfo {
  state: SyncState;
  pendingCount: number;
  lastSyncedAt: Date | null;
  conflictCount: number;
  activeConflict?: OfflineMutation;
}

type SyncStateListener = (status: SyncStatusInfo) => void;

class OfflineSyncManagerClass {
  private listeners: Set<SyncStateListener> = new Set();
  private onlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncingQueue: boolean = false;
  private lastSyncedAt: Date | null = null;
  private activeConflict: OfflineMutation | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Periodically check queue on boot/heartbeat
      setTimeout(() => {
        if (this.onlineStatus) {
          this.syncPendingQueue();
        }
      }, 3000);
    }
  }

  public isOnline(): boolean {
    return this.onlineStatus;
  }

  public async queueMutation(
    entity: 'expenses' | 'incomes' | 'qr_vault' | 'notes' | 'planner',
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: any,
    targetId?: string
  ): Promise<OfflineMutation> {
    const mutation = await enqueueMutation({
      entity,
      action,
      payload,
      targetId: targetId || payload.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    });
    this.notifyListeners();
    return mutation;
  }

  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    this.notifyListeners();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    getPendingMutations().then((pending) => {
      const conflicts = pending.filter((m) => m.status === 'conflict');
      const activeConflict = conflicts[0] || null;
      this.activeConflict = activeConflict;

      let state: SyncState = 'synced';
      if (conflicts.length > 0) {
        state = 'conflict';
      } else if (!this.onlineStatus) {
        state = 'offline';
      } else if (this.isSyncingQueue) {
        state = 'syncing';
      } else if (pending.length > 0) {
        state = 'offline';
      }

      const info: SyncStatusInfo = {
        state,
        pendingCount: pending.length,
        lastSyncedAt: this.lastSyncedAt,
        conflictCount: conflicts.length,
        activeConflict: activeConflict || undefined,
      };

      this.listeners.forEach((fn) => fn(info));
    }).catch(err => {
      console.warn('Failed to fetch pending mutations for sync badge notification:', err);
    });
  }

  private handleOnline = () => {
    this.onlineStatus = true;
    console.log('📶 Internet connection restored. Initiating auto-sync queue...');
    this.notifyListeners();
    this.syncPendingQueue();
  };

  private handleOffline = () => {
    this.onlineStatus = false;
    console.log('📵 Operating in Offline Mode. Enqueuing mutations locally.');
    this.notifyListeners();
  };

  /**
   * Executes a mutation. If online, executes via SpendTrackApi and caches result.
   * If offline or request fails due to network, queues mutation in IndexedDB and updates local cache.
   */
  public async executeMutation<T = any>(
    entity: 'expenses' | 'incomes' | 'qr_vault' | 'notes' | 'planner',
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: any,
    targetId: string,
    onlineApiCall: () => Promise<T>
  ): Promise<{ result: T; isOffline: boolean }> {
    if (this.onlineStatus) {
      try {
        const result = await onlineApiCall();

        // Update local IndexedDB cache with server response
        if (action === 'DELETE') {
          await deleteCachedItem(entity, targetId);
        } else if (result && typeof result === 'object' && 'id' in (result as object)) {
          await saveCachedItem(entity, result as any);
        }

        this.lastSyncedAt = new Date();
        this.notifyListeners();
        return { result, isOffline: false };
      } catch (err: any) {
        // Check if error is network/offline error
        const isNetworkError =
          !navigator.onLine ||
          err.message?.includes('Failed to fetch') ||
          err.message?.includes('NetworkError') ||
          err.message?.includes('Network request failed');

        if (!isNetworkError) {
          // Genuine API error (e.g. 400 Bad Request, 422 Unprocessable)
          throw err;
        }

        console.warn('Network call failed. Falling back to offline queueing.', err);
      }
    }

    // Offline mode or network fallback: Queue mutation in IndexedDB write_queue
    const mutation = await enqueueMutation({
      entity,
      action,
      payload,
      targetId,
    });

    // Optimistically update domain cache in IndexedDB
    if (action === 'DELETE') {
      await deleteCachedItem(entity, targetId);
    } else {
      const optimisticItem = { id: targetId, ...payload, updatedAt: new Date().toISOString() };
      await saveCachedItem(entity, optimisticItem);
    }

    this.notifyListeners();

    const resultFallback = (action === 'DELETE'
      ? ({ success: true, id: targetId } as unknown as T)
      : ({ id: targetId, ...payload } as unknown as T));

    return { result: resultFallback, isOffline: true };
  }

  /**
   * Processes pending offline write queue sequentially upon reconnection.
   */
  public async syncPendingQueue(): Promise<{ syncedCount: number; conflictCount: number }> {
    if (this.isSyncingQueue || !this.onlineStatus) {
      return { syncedCount: 0, conflictCount: 0 };
    }

    this.isSyncingQueue = true;
    this.notifyListeners();

    let syncedCount = 0;
    let conflictCount = 0;

    try {
      const pendingMutations = await getPendingMutations();

      for (const mutation of pendingMutations) {
        // Skip already flagged conflict items until user resolves them
        if (mutation.status === 'conflict') {
          conflictCount++;
          continue;
        }

        await updateMutationStatus(mutation.id, 'syncing');
        this.notifyListeners();

        try {
          let serverResult: any = null;

          if (mutation.entity === 'expenses') {
            if (mutation.action === 'CREATE') {
              serverResult = await SpendTrackApi.createExpense(mutation.payload);
            } else if (mutation.action === 'UPDATE') {
              serverResult = await SpendTrackApi.updateExpense(mutation.targetId, mutation.payload);
            } else if (mutation.action === 'DELETE') {
              serverResult = await SpendTrackApi.deleteExpense(mutation.targetId);
            }
          } else if (mutation.entity === 'incomes') {
            if (mutation.action === 'CREATE') {
              serverResult = await SpendTrackApi.createIncome(mutation.payload);
            } else if (mutation.action === 'DELETE') {
              serverResult = await SpendTrackApi.deleteIncome(mutation.targetId);
            }
          } else if (mutation.entity === 'notes') {
            if (mutation.action === 'CREATE' || mutation.action === 'UPDATE') {
              serverResult = await SpendTrackApi.createReminder({
                title: mutation.payload.title || 'Note',
                description: mutation.payload.content,
                dueDate: new Date().toISOString(),
              });
            }
          } else if (mutation.entity === 'planner') {
            if (mutation.action === 'CREATE') {
              serverResult = await SpendTrackApi.createReminder(mutation.payload);
            } else if (mutation.action === 'UPDATE') {
              serverResult = await SpendTrackApi.updateReminder(mutation.targetId, mutation.payload);
            } else if (mutation.action === 'DELETE') {
              serverResult = await SpendTrackApi.deleteReminder(mutation.targetId);
            }
          }

          // If temporary ID was replaced with real server ID, update cache
          if (serverResult && serverResult.id && serverResult.id !== mutation.targetId) {
            await deleteCachedItem(mutation.entity, mutation.targetId);
            await saveCachedItem(mutation.entity, serverResult);
          } else if (mutation.action === 'DELETE') {
            await deleteCachedItem(mutation.entity, mutation.targetId);
          } else if (serverResult) {
            await saveCachedItem(mutation.entity, serverResult);
          }

          // Operation successful: remove from queue
          await removeMutation(mutation.id);
          syncedCount++;
        } catch (err: any) {
          console.error(`Error syncing queued mutation ${mutation.id}:`, err);

          if (err.status === 409 || err.message?.includes('conflict') || err.message?.includes('409')) {
            // Conflict detected
            await updateMutationStatus(mutation.id, 'conflict', {
              serverVersion: err.serverData || null,
              message: err.message || 'Server data was modified offline.',
            });
            conflictCount++;
          } else {
            await updateMutationStatus(mutation.id, 'failed');
          }
        }
      }

      this.lastSyncedAt = new Date();
    } catch (err) {
      console.error('Failed processing offline write queue:', err);
    } finally {
      this.isSyncingQueue = false;
      this.notifyListeners();
    }

    return { syncedCount, conflictCount };
  }

  /**
   * Resolves a queue conflict based on user action
   */
  public async resolveConflict(
    mutationId: string,
    resolution: 'keep_mine' | 'keep_server' | 'keep_both'
  ): Promise<void> {
    const pending = await getPendingMutations();
    const mutation = pending.find((m) => m.id === mutationId);
    if (!mutation) return;

    try {
      if (resolution === 'keep_mine') {
        // Force sync local draft
        if (mutation.entity === 'expenses') {
          await SpendTrackApi.createExpense(mutation.payload);
        } else if (mutation.entity === 'incomes') {
          await SpendTrackApi.createIncome(mutation.payload);
        }
        await removeMutation(mutationId);
      } else if (resolution === 'keep_server') {
        // Discard local offline draft
        await removeMutation(mutationId);
      } else if (resolution === 'keep_both') {
        // Duplicate as new entity
        const dupPayload = { ...mutation.payload, title: `${mutation.payload.title || 'Item'} (Offline Copy)` };
        if (mutation.entity === 'expenses') {
          await SpendTrackApi.createExpense(dupPayload);
        } else if (mutation.entity === 'incomes') {
          await SpendTrackApi.createIncome(dupPayload);
        }
        await removeMutation(mutationId);
      }
    } catch (err) {
      console.error('Failed to resolve queue conflict:', err);
    } finally {
      this.notifyListeners();
    }
  }
}

export const offlineSyncManager = new OfflineSyncManagerClass();
