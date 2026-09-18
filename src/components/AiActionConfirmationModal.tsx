import React from 'react';
import { Sparkles, CheckCircle2, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { GlassCard } from './ui/GlassCard.js';

export interface AiProposedAction {
  id: string;
  agentName: string;
  actionTitle: string;
  actionDescription: string;
  payloadSummary: { label: string; value: string }[];
  onConfirm: () => Promise<void>;
}

interface AiActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposedAction: AiProposedAction | null;
}

export const AiActionConfirmationModal: React.FC<AiActionConfirmationModalProps> = ({
  isOpen,
  onClose,
  proposedAction,
}) => {
  const [loading, setLoading] = React.useState(false);

  if (!isOpen || !proposedAction) return null;

  const handleExecute = async () => {
    setLoading(true);
    try {
      await proposedAction.onConfirm();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to execute AI proposed action');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-md p-6 space-y-4 border-emerald-500/40 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">AI Agent Proposed Action</h3>
              <p className="text-[10px] text-emerald-400 font-bold">{proposedAction.agentName} System Agent</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {proposedAction.actionTitle}
            </h4>
            <p className="text-[11px] text-slate-400">{proposedAction.actionDescription}</p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action Payload Inspection:</span>
            {proposedAction.payloadSummary.map((item, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">{item.label}</span>
                <span className="font-bold text-emerald-400 font-mono">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Reviewing before commit ensures strict audit trail integrity in PostgreSQL.</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirm & Execute
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
