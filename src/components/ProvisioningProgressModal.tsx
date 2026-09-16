import React from 'react';
import {
  CheckCircle2,
  Loader2,
  Database,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import { BRAND_NAME } from '../constants/brand.js';

interface ProvisioningProgressModalProps {
  isOpen: boolean;
  currentStepIndex: number;
}

const PROVISIONING_STEPS = [
  {
    label: 'Authenticating…',
    description: 'Verifying Google credentials',
    icon: ShieldCheck,
  },
  {
    label: 'Connecting Database…',
    description: 'Linking PostgreSQL user session',
    icon: Database,
  },
  {
    label: 'Initializing AI…',
    description: 'Configuring Gemini AI receipt scanner & assistant',
    icon: Sparkles,
  },
  {
    label: 'Opening Dashboard…',
    description: 'Finalizing setup & loading data',
    icon: LayoutDashboard,
  },
];

export const ProvisioningProgressModal: React.FC<ProvisioningProgressModalProps> = ({
  isOpen,
  currentStepIndex,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 selection:bg-emerald-100">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl mx-auto flex items-center justify-center font-black text-xl shadow-inner">
            {BRAND_NAME.charAt(0)}
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Setting up {BRAND_NAME}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please wait while we initialize your workspace...
          </p>
        </div>

        <div className="space-y-3">
          {PROVISIONING_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.label}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  isDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300'
                    : isCurrent
                    ? 'bg-slate-50 dark:bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 text-slate-900 dark:text-white'
                    : 'bg-slate-50/30 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                }`}
              >
                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 opacity-40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{step.label}</p>
                  <p className="text-[11px] opacity-75 truncate">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
