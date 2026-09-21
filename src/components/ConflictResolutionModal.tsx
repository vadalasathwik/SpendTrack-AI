import React from 'react';
import { AlertTriangle, Server, Smartphone, Copy, CheckCircle, RefreshCw, X } from 'lucide-react';
import { OfflineMutation } from '../services/offlineStore.js';
import { formatCurrency } from '../utils/calculations.js';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: OfflineMutation | null;
  onResolve: (mutationId: string, resolution: 'keep_mine' | 'keep_server' | 'keep_both') => Promise<void>;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflict,
  onResolve,
}) => {
  if (!isOpen || !conflict) return null;

  const localData = conflict.payload || {};
  const serverData = conflict.conflictData?.serverVersion || null;

  const handleAction = async (resolution: 'keep_mine' | 'keep_server' | 'keep_both') => {
    await onResolve(conflict.id, resolution);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-500/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Sync Conflict Detected
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Local offline edit conflicts with data modified on server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 text-xs text-rose-800 dark:text-rose-300">
            <p className="font-semibold mb-1">Why am I seeing this?</p>
            You made changes while offline for <strong className="uppercase">{conflict.entity}</strong> ({conflict.action}), but the server record was updated concurrently. Choose how you want to resolve this to ensure 0 data loss.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Version Card */}
            <div className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>Local Version (Your Offline Draft)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium">
                  Client Draft
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <div><span className="text-slate-400">Title / Name:</span> <strong className="text-slate-900 dark:text-white">{localData.title || localData.merchant || localData.name || 'N/A'}</strong></div>
                {localData.amount !== undefined && (
                  <div><span className="text-slate-400">Amount:</span> <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(localData.amount))}</strong></div>
                )}
                {localData.category && (
                  <div><span className="text-slate-400">Category:</span> {localData.category}</div>
                )}
                <div><span className="text-slate-400">Edited At:</span> {new Date(conflict.timestamp).toLocaleString()}</div>
              </div>
            </div>

            {/* Server Version Card */}
            <div className="p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <Server className="w-4 h-4" />
                  <span>Server Version (Remote Database)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-medium">
                  Cloud State
                </span>
              </div>

              {serverData ? (
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div><span className="text-slate-400">Title / Name:</span> <strong className="text-slate-900 dark:text-white">{serverData.title || serverData.merchant || serverData.name || 'N/A'}</strong></div>
                  {serverData.amount !== undefined && (
                    <div><span className="text-slate-400">Amount:</span> <strong className="text-indigo-600 dark:text-indigo-400">{formatCurrency(Number(serverData.amount))}</strong></div>
                  )}
                  {serverData.category && (
                    <div><span className="text-slate-400">Category:</span> {serverData.category}</div>
                  )}
                  <div><span className="text-slate-400">Updated At:</span> {serverData.updatedAt ? new Date(serverData.updatedAt).toLocaleString() : 'Remote Server'}</div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 italic py-4 text-center">
                  Server record modified or removed online.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={() => handleAction('keep_server')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Keep Server Version</span>
          </button>

          <button
            onClick={() => handleAction('keep_both')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-indigo-500/40 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors flex items-center justify-center gap-2"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Keep Both (Duplicate)</span>
          </button>

          <button
            onClick={() => handleAction('keep_mine')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Keep My Offline Version</span>
          </button>
        </div>
      </div>
    </div>
  );
};
