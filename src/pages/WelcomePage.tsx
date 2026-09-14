import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Receipt,
  Bell,
  Calendar,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import { BRAND_NAME } from '../constants/brand.js';
import { TrackPayLogo } from '../components/TrackPayLogo.js';

interface WelcomePageProps {
  onSignIn: () => void | Promise<void>;
  isSigningIn?: boolean;
  errorMessage?: string | null;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onSignIn,
  isSigningIn = false,
  errorMessage = null,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[450px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <TrackPayLogo size="md" showText />
        <button
          onClick={onSignIn}
          disabled={isSigningIn}
          className="text-xs sm:text-sm font-bold text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 px-4 py-2 rounded-[14px] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          <span>Sign In</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Content Area: Centered Apple-Style Onboarding */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col items-center justify-center text-center z-10">
        {errorMessage && (
          <div className="w-full max-w-md mb-6 p-4 rounded-[16px] bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-semibold flex items-center gap-2.5 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Hero Logo & Titles */}
        <div className="space-y-4 mb-10 max-w-xl mx-auto">
          <div className="flex justify-center mb-2">
            <TrackPayLogo size="xl" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            {BRAND_NAME}
          </h1>
          <p className="text-base sm:text-lg font-medium text-slate-300">
            Your smart personal finance companion.
          </p>
        </div>

        {/* 4 Clean Consumer Feature Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
          {/* Card 1 */}
          <div className="p-5 rounded-[20px] bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 transition-all duration-200 space-y-2 group">
            <div className="w-10 h-10 rounded-[14px] bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/60 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-extrabold text-base text-white">AI Receipt Scanner</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Instantly extract merchant details, line items, and totals from receipt photos.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-[20px] bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 transition-all duration-200 space-y-2 group">
            <div className="w-10 h-10 rounded-[14px] bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/60 group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-extrabold text-base text-white">Smart Payment Reminders</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Never miss a bill due date with automated monthly subscription cycles.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-[20px] bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 transition-all duration-200 space-y-2 group">
            <div className="w-10 h-10 rounded-[14px] bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/60 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-extrabold text-base text-white">Google Calendar Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Seamlessly sync upcoming due dates and paid histories into Google Calendar.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-[20px] bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 transition-all duration-200 space-y-2 group">
            <div className="w-10 h-10 rounded-[14px] bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/60 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="font-extrabold text-base text-white">Budget Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Conversational spending analytics, unit price trends, and daily burn rates.
            </p>
          </div>
        </div>

        {/* Primary CTA: Continue with Google */}
        <div className="w-full max-w-sm flex flex-col items-center gap-3">
          <button
            id="welcome-continue-google-btn"
            onClick={onSignIn}
            disabled={isSigningIn}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-base rounded-[14px] shadow-lg shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75 active:scale-[0.98]"
          >
            {isSigningIn ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center font-medium leading-relaxed">
            By signing in, you agree to {BRAND_NAME}&apos;s{' '}
            <a href="/privacy" className="text-emerald-400 hover:underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/terms" className="text-emerald-400 hover:underline">
              Terms of Service
            </a>
            .
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 border-t border-slate-800 text-center text-xs font-semibold text-slate-500 flex items-center justify-between">
        <span>&copy; 2026 {BRAND_NAME}</span>
        <div className="flex items-center gap-4">
          <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};
