import React from 'react';
import { Sparkles } from 'lucide-react';

interface AiSuggestionCardProps {
  promptText: string;
  onClick: () => void;
  className?: string;
}

export const AiSuggestionCard: React.FC<AiSuggestionCardProps> = ({
  promptText,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-violet-500/40 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-95 ${className}`}
    >
      <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
      <span>{promptText}</span>
    </button>
  );
};
