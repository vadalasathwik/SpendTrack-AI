import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  HardDrive,
  Calendar,
  Zap,
  Lock,
  ExternalLink,
  X,
  TrendingUp,
  Bot,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { BRAND_NAME } from '../constants/brand.js';

interface WelcomePageProps {
  onSignIn: () => void | Promise<void>;
  onExploreDemo?: () => void;
  isSigningIn?: boolean;
  errorMessage?: string | null;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onSignIn,
  onExploreDemo,
  isSigningIn = false,
  errorMessage = null,
}) => {

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background Decorative Ambient Material Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-emerald-100/50 via-teal-50/30 to-transparent pointer-events-none blur-3xl -z-10" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Navigation */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25 ring-4 ring-emerald-50">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-slate-900">{BRAND_NAME}</span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-200/60 hidden sm:inline-block">
                Workspace Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Personal Finance Operating System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onExploreDemo && (
            <button
              onClick={onExploreDemo}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-200/60 transition-all cursor-pointer"
            >
              Explore Demo Mode
            </button>
          )}
          <button
            onClick={onSignIn}
            disabled={isSigningIn}
            className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <span>Sign In</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area: Centered Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center items-center z-10">
        
        {/* Error Notification Banner if sign in failed */}
        {errorMessage && (
          <div className="w-full max-w-xl mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 shadow-sm animate-shake">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <p className="flex-1 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-bold mb-6 shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
            <span>AI-Powered Expense & Consumption Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Welcome to <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">{BRAND_NAME}</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Your personal AI-powered expense tracker connected to your own Google Workspace.
          </p>
        </div>

        {/* Features Grid: 4 Feature Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12">
          
          {/* Card 1: Google Sheets */}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-emerald-600/10 hover:border-emerald-300 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/40 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Data Sovereignty
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg sm:text-xl mb-2">
                <span>Google Sheets</span>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                <span className="text-emerald-700 font-bold text-base sm:text-lg">Personal expense database</span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                All your transactions, recurring items, and catalog data live directly in a dedicated spreadsheet in your Google Drive. 100% private and user-owned.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Bi-directional live spreadsheet sync</span>
            </div>
          </div>

          {/* Card 2: Google Drive */}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-emerald-600/10 hover:border-emerald-300 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/40 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <HardDrive className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  Cloud Vault
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg sm:text-xl mb-2">
                <span>Google Drive</span>
                <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                <span className="text-emerald-700 font-bold text-base sm:text-lg">Secure receipt storage</span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Upload receipts and invoices directly to your personal Google Drive folder. {BRAND_NAME} extracts purchase details automatically without third-party storage.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Encrypted personal cloud storage</span>
            </div>
          </div>

          {/* Card 3: Google Calendar */}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-emerald-600/10 hover:border-emerald-300 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/40 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <Calendar className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                  Smart Scheduling
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg sm:text-xl mb-2">
                <span>Google Calendar</span>
                <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                <span className="text-emerald-700 font-bold text-base sm:text-lg">Automatic bill reminders</span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Never miss a recurring subscription or utility payment. Due dates and payment reminders automatically synchronize to your Google Calendar events.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Automated renewal alerts & sync</span>
            </div>
          </div>

          {/* Card 4: Gemini AI */}
          <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-emerald-600/10 hover:border-emerald-300 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/40 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs group-hover:scale-105 transition-transform">
                  <Bot className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                  AI Intelligence
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg sm:text-xl mb-2">
                <span>Gemini AI</span>
                <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                <span className="text-emerald-700 font-bold text-base sm:text-lg">Smart spending insights</span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Conversational financial assistant powered by Google Gemini. Ask spending questions, analyze item unit inflation, and detect budget anomalies instantly.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Real-time natural language analytics</span>
            </div>
          </div>

        </div>

        {/* CTA Section */}
        <div className="w-full max-w-2xl bg-gradient-to-b from-white to-emerald-50/40 border border-emerald-200/80 rounded-3xl p-6 sm:p-10 shadow-xl shadow-emerald-900/5 text-center flex flex-col items-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 mb-4">
            <Lock className="w-6 h-6 stroke-[2]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            Ready to control your financial data?
          </h2>

          <p className="text-sm text-slate-600 mb-6 max-w-md">
            Connect your Google Workspace in seconds. No credit card required.
          </p>

          {/* Primary Green CTA Button: Continue with Google */}
          <button
            id="welcome-continue-google-btn"
            onClick={onSignIn}
            disabled={isSigningIn}
            className="w-full sm:w-auto min-w-[280px] px-8 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-lg rounded-2xl shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed group active:scale-98"
          >
            {isSigningIn ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Connecting Google Workspace...</span>
              </>
            ) : (
              <>
                {/* Official Google Brand "G" Icon Badge */}
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
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
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Under Button Notice */}
          <p className="mt-4 text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed font-normal">
            By continuing, you allow {BRAND_NAME} to create and sync your own Google Sheets, Drive and Calendar.
          </p>

          {/* Demo Fallback link */}
          {onExploreDemo && (
            <button
              onClick={onExploreDemo}
              className="mt-4 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Or preview app with sample data first &rarr;
            </button>
          )}
        </div>

      </main>

      {/* Footer Section */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 z-10">
        <div className="flex items-center gap-2">
          <span>&copy; 2026 {BRAND_NAME}. Personal AI Finance Workspace.</span>
        </div>

        {/* Footer Navigation Links */}
        <div className="flex items-center gap-4 font-semibold text-slate-600">
          <a
            href="/privacy"
            className="hover:text-emerald-700 transition-colors cursor-pointer"
          >
            Privacy Policy
          </a>
          <span className="text-slate-300">•</span>
          <a
            href="/terms"
            className="hover:text-emerald-700 transition-colors cursor-pointer"
          >
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  );
};
