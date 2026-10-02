import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  PieChart,
  Brain,
  Receipt,
  Calendar,
  Zap,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { BRAND_NAME } from '../constants/brand.js';
import { SpendTrackLogo } from '../components/TrackPayLogo.js';

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
    <div className="min-h-[100svh] bg-slate-950 text-white font-sans flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-300 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] px-4 sm:px-6">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5 select-none">
          <SpendTrackLogo size="md" />
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white leading-none">
              SpendTrack <span className="text-emerald-400">AI</span>
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-0.5">
              Personal Finance OS
            </span>
          </div>
        </div>

        {/* Security Indicator in Header (Replaces old top-right Sign In button) */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-semibold text-slate-300">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit Encrypted</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col justify-center py-6 sm:py-10 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column (Desktop Hero & Product Preview / Mobile Compact Hero) */}
          <div className="lg:col-span-7 flex flex-col space-y-6 sm:space-y-8 text-left">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Smart Personal Finance</span>
            </div>

            {/* Typography Hierarchy */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                Your money. <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                  Clearly managed.
                </span>
              </h1>
              <p className="text-slate-300 text-base sm:text-xl font-medium max-w-xl leading-relaxed">
                Track spending, plan ahead, and understand your finances with AI.
              </p>
            </div>

            {/* Feature Pills Tag Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300">
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Insights</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300">
                <PieChart className="w-3.5 h-3.5 text-teal-400" />
                <span>Budget Target</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Smart Planning</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300">
                <Receipt className="w-3.5 h-3.5 text-teal-400" />
                <span>Receipt AI</span>
              </div>
            </div>

            {/* Desktop / Tablet Visual Product Preview (Hidden on Mobile for fast Auth focus) */}
            <div className="hidden sm:block pt-2">
              <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-2xl space-y-4 overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="absolute top-0 right-0 px-3 py-1 bg-slate-800/80 rounded-bl-xl text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Illustrative Product Preview
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                      ₹
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400">Monthly Budget Target</div>
                      <div className="text-sm font-extrabold text-white">₹28,450 <span className="text-xs font-normal text-slate-400">of ₹45,000</span></div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                    63% Used
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full w-[63%]" />
                </div>

                {/* AI Insight Badge */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <p className="text-slate-300 font-medium">
                    <strong className="text-emerald-400 font-bold">AI Insight:</strong> Grocery spending is 12% lower than last month.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Authentication Panel */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-8 shadow-2xl shadow-emerald-950/20 flex flex-col space-y-6 relative">
              {/* Card Header */}
              <div className="space-y-1.5 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome to SpendTrack AI
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  Sign in with Google to access your private financial workspace.
                </p>
              </div>

              {/* Error Callout */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs font-semibold flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                  <span>Unable to sign in. Please try again.</span>
                </div>
              )}

              {/* Primary Google Auth CTA */}
              <div className="space-y-3">
                <button
                  id="welcome-continue-google-btn"
                  type="button"
                  onClick={onSignIn}
                  disabled={isSigningIn}
                  aria-label="Continue with Google"
                  className="w-full min-h-[48px] py-3.5 px-5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-extrabold text-base rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.98]"
                >
                  {isSigningIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span className="text-slate-900">Signing you in...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                    </>
                  )}
                </button>
              </div>

              {/* Security & Privacy Badges */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Secure 256-Bit AES Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>OAuth 2.0 Direct Authentication</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Private Financial Data & Zero Password Storage</span>
                </div>
              </div>

              {/* Terms & Privacy Statement */}
              <p className="text-[11px] text-slate-400 text-center font-medium leading-relaxed">
                By continuing, you agree to {BRAND_NAME}&apos;s{' '}
                <a href="/privacy" className="text-emerald-400 hover:underline font-semibold">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/terms" className="text-emerald-400 hover:underline font-semibold">
                  Terms of Service
                </a>
                .
              </p>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto py-3 border-t border-slate-900 text-center text-xs font-semibold text-slate-500 flex items-center justify-between z-10">
        <span>&copy; {new Date().getFullYear()} {BRAND_NAME}</span>
        <div className="flex items-center gap-4">
          <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};
