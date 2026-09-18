import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useToast, ToastType } from '../../context/ToastContext.js';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          bg: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          bg: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
          bg: 'bg-slate-900/95 border-cyan-500/40 text-cyan-200',
        };
    }
  };

  return (
    <div className="fixed z-50 pointer-events-none flex flex-col gap-2 transition-all duration-300 top-5 right-5 max-w-sm w-[90vw] sm:w-80 max-sm:bottom-20 max-sm:top-auto max-sm:left-1/2 max-sm:-translate-x-1/2">
      {toasts.map((toast) => {
        const style = getToastStyle(toast.type);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200 ${style.bg}`}
          >
            <div className="flex items-start gap-2.5">
              {style.icon}
              <div>
                <h4 className="text-xs font-black tracking-tight">{toast.title}</h4>
                {toast.message && <p className="text-[11px] opacity-80 mt-0.5">{toast.message}</p>}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
