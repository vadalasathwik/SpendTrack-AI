import React from 'react';
import { GitCompare, CheckCircle2, Cloud, HardDrive, RefreshCw, X } from 'lucide-react';
import { GlassCard } from './ui/GlassCard.js';

export interface ConflictItem {
  id: string;
  title: string;
  localValue: { amount: number; note: string; date: string };
  cloudValue: { amount: number; note: string; date: string };
}

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: ConflictItem | null;
  onResolve: (choice: 'local' | 'cloud' | 'merge') => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflict,
  onResolve,
}) => {
  if (!isOpen || !conflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-lg p-6 space-y-5 border-amber-500/40 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Multi-Device Conflict Detected</h3>
              <p className="text-[10px] text-amber-400 font-bold">Never overwriting your financial ledger silently</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-black text-white">Conflicting Record: {conflict.title}</h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Local Device Version */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" /> Local Device
              </span>
              <div>
                <span className="text-slate-400 text-[10px] block">Amount</span>
                <span className="font-mono font-black text-white text-base">₹{conflict.localValue.amount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Note</span>
                <span className="text-slate-300 font-medium">{conflict.localValue.note || 'None'}</span>
              </div>
            </div>

            {/* Cloud Version */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5" /> Cloud Server
              </span>
              <div>
                <span className="text-slate-400 text-[10px] block">Amount</span>
                <span className="font-mono font-black text-white text-base">₹{conflict.cloudValue.amount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Note</span>
                <span className="text-slate-300 font-medium">{conflict.cloudValue.note || 'None'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={() => onResolve('local')}
            className="py-2.5 px-3 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-extrabold hover:bg-indigo-500/30 cursor-pointer"
          >
            Keep Mine
          </button>
          <button
            onClick={() => onResolve('cloud')}
            className="py-2.5 px-3 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-extrabold hover:bg-cyan-500/30 cursor-pointer"
          >
            Keep Cloud
          </button>
          <button
            onClick={() => onResolve('merge')}
            className="py-2.5 px-3 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400 cursor-pointer shadow-lg"
          >
            Merge Both
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
