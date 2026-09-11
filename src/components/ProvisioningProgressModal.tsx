import React from 'react';
import {
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  HardDrive,
  Calendar,
  Sparkles,
  ShieldCheck,
  TrendingUp,
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
    description: 'Verifying Google credentials & Firebase ID token',
    icon: ShieldCheck,
  },
  {
    label: 'Creating Google Sheets…',
    description: `Initializing "${BRAND_NAME} Database" & workspace tabs`,
    icon: FileSpreadsheet,
  },
  {
    label: 'Preparing Drive…',
    description: `Configuring "${BRAND_NAME}/Receipts" cloud storage`,
    icon: HardDrive,
  },
  {
    label: 'Connecting Calendar…',
    description: 'Linking Google Calendar for recurring bill events',
    icon: Calendar,
  },
  {
    label: 'Initializing AI…',
    description: 'Configuring Gemini AI consumption assistant',
    icon: Sparkles,
  },
  {
    label: 'Opening Dashboard…',
    description: 'Finalizing workspace setup & loading data',
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
      <div className="bg-white dark:bg-slate-900 rounded-[20px] max-w-[420px] w-[calc(100vw-24px)] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Background Accent Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-100/50 rounded-bl-full pointer-events-none -z-10 blur-2xl" />

        {/* Brand Header */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30 ring-8 ring-emerald-50 mb-5 animate-pulse">
          <TrendingUp className="w-7 h-7 stroke-[2.5]" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight text-center">
          Provisioning Workspace
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium text-center mt-1 mb-8 max-w-xs leading-relaxed">
          Creating your private database & securing your Google Workspace resources
        </p>

        {/* 6 Step Progress List */}
        <div className="w-full space-y-4">
          {PROVISIONING_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;
            const StepIcon = step.icon;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3.5 p-3 rounded-2xl transition-all duration-300 ${
                  isCurrent
                    ? 'bg-emerald-50/90 border border-emerald-200/90 shadow-sm'
                    : isCompleted
                    ? 'bg-slate-50/60 opacity-90'
                    : 'opacity-40'
                }`}
              >
                {/* Status Indicator Icon */}
                <div className="shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 animate-in zoom-in-75 duration-200">
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-500 flex items-center justify-center shadow-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200/80 text-slate-400 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>

                {/* Step Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-extrabold ${
                        isCurrent
                          ? 'text-emerald-900 font-black'
                          : isCompleted
                          ? 'text-slate-900 font-bold'
                          : 'text-slate-500 font-medium'
                      }`}
                    >
                      {step.label}
                    </span>
                    <StepIcon
                      className={`w-4 h-4 ${
                        isCurrent
                          ? 'text-emerald-600'
                          : isCompleted
                          ? 'text-emerald-500'
                          : 'text-slate-300'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-normal leading-tight mt-0.5 truncate">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Footer Note */}
        <div className="mt-7 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Powered by Google Workspace & Firebase Admin
          </span>
        </div>
      </div>
    </div>
  );
};
