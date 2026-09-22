import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { GlassCard } from './ui/GlassCard.js';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SpendTrack AI Finance OS ErrorBoundary caught a runtime error:', error, errorInfo);
  }

  handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
  };

  handleReturnHome = () => {
    (this as any).setState({ hasError: false, error: null });
    try {
      localStorage.setItem('spendtrack_active_tab', 'dashboard');
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-6 space-y-5 border-rose-500/30 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                System Recovered
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                Workspace Render Safeguard
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                SpendTrack AI caught a transient render error and prevented a blank screen.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 text-slate-300 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-white/10 cursor-pointer border border-white/10"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={this.handleReturnHome}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-400 cursor-pointer"
              >
                <Home className="w-4 h-4" /> Return Home
              </button>
            </div>
          </GlassCard>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
