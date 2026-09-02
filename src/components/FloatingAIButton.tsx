import React from 'react';
import { Sparkles } from 'lucide-react';

interface FloatingAIButtonProps {
  onClick: () => void;
  isActive?: boolean;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick, isActive }) => {
  if (isActive) return null; // Don't show floating button if already on AI page

  return (
    <button
      id="floating-ai-launcher-btn"
      onClick={onClick}
      title="Ask SpendTrack AI"
      className="fixed bottom-18 md:bottom-8 right-4 md:right-8 z-30 flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-700/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
    >
      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 shadow-xs">
        <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
      </div>
      <span className="text-xs sm:text-sm font-bold tracking-tight">Ask SpendTrack AI</span>
    </button>
  );
};
