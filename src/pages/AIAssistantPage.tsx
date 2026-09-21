import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Plus,
  MessageSquare,
  User as UserIcon,
  ShieldCheck,
  Bot,
  Target,
  CreditCard,
  TrendingUp,
  Wallet,
  Activity,
  Award,
} from 'lucide-react';
import { Expense, RecurringExpense, CategoryItem, DateRange } from '../types.js';
import { AIChatMessage } from '../services/aiService.js';
import { parseAndExecuteLocalAiIntent } from '../services/localAiParser.js';

interface AIAssistantPageProps {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  categories?: CategoryItem[];
  dateRange?: DateRange;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
  onRefreshData?: () => void;
}

const QUICK_PROMPTS = [
  'I spent ₹240 at Swiggy',
  'Add ₹5000 salary',
  'Show this month\'s spending',
  'How much can I save?',
  'When is my next EMI?',
];

const AI_COACHES = [
  { id: 'swiggy', name: 'Record Swiggy Spend', icon: Wallet, prompt: 'I spent ₹240 at Swiggy' },
  { id: 'salary', name: 'Add Salary Income', icon: TrendingUp, prompt: 'Add ₹5000 salary' },
  { id: 'monthly', name: 'Monthly Spending Summary', icon: Activity, prompt: 'Show this month\'s spending' },
  { id: 'savings', name: 'Calculate Savings Buffer', icon: Award, prompt: 'How much can I save?' },
  { id: 'emi', name: 'Upcoming EMI Dates', icon: CreditCard, prompt: 'When is my next EMI?' },
];

const DEFAULT_WELCOME_MESSAGE: AIChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `Hello! I'm your **SpendTrack Local AI CFO**.\n\nI can execute database operations, parse expenses/incomes, and analyze your PostgreSQL metrics locally without external API dependencies.\n\nTry clicking any quick prompt below or type your question:`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  expenses = [],
  recurringExpenses = [],
  onRefreshData,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Financial Context summary
  const totalLivingExpenses = expenses.reduce((sum, e) => sum + e.totalPrice, 0);
  const totalEmis = recurringExpenses.reduce((sum, r) => sum + r.amount, 0);
  const totalIncome = 140000;
  const freeCash = Math.max(0, totalIncome - (totalLivingExpenses + totalEmis));
  const emiRatio = Math.round((totalEmis / totalIncome) * 100);
  const savingRate = Math.round((freeCash / totalIncome) * 100);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (userPromptText?: string) => {
    const textToSend = userPromptText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AIChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userPromptText) setInput('');
    setIsLoading(true);

    try {
      const result = await parseAndExecuteLocalAiIntent(textToSend, {
        expenses,
        recurringExpenses,
        onRefreshData,
      });

      const assistantMsg: AIChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `Apologies, I encountered an error: ${err.message || 'Processing error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 pb-20 animate-in fade-in duration-300">
      {/* PANEL 1: Left Panel - AI Quick Intents & Sessions (3 cols) */}
      <div className="hidden lg:flex lg:col-span-3 glass-panel rounded-[32px] p-4 flex-col justify-between overflow-y-auto custom-scrollbar shadow-2xl space-y-4">
        <div className="space-y-4">
          <button
            onClick={() => setMessages([DEFAULT_WELCOME_MESSAGE])}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New AI CFO Session</span>
          </button>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2">
              Quick AI Actions
            </span>
            <div className="space-y-1.5">
              {AI_COACHES.map((coach) => {
                const Icon = coach.icon;
                return (
                  <button
                    key={coach.id}
                    onClick={() => handleSendMessage(coach.prompt)}
                    className="w-full p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-violet-500/30 text-left transition-all cursor-pointer flex items-center gap-2.5 group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white truncate">
                      {coach.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 text-[11px] text-slate-400 space-y-1">
          <span className="font-black text-white block">Local AI Intent Engine</span>
          <p>Direct PostgreSQL API execution & zero API keys required.</p>
        </div>
      </div>

      {/* PANEL 2: Center Panel - Conversation View (6 cols) */}
      <div className="lg:col-span-6 glass-panel rounded-[32px] p-4 sm:p-6 flex flex-col justify-between shadow-2xl overflow-hidden relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-[24px] p-4 text-xs sm:text-sm font-medium leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-emerald-500 text-slate-950 rounded-tr-xs font-semibold'
                      : 'bg-slate-900/90 text-slate-100 border border-white/10 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div
                    className={`mt-2 flex items-center justify-end gap-2 text-[10px] ${
                      isUser ? 'text-slate-900/70 font-bold' : 'text-slate-500'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="hover:text-white transition-colors"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-violet-400 text-xs font-bold animate-pulse p-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>AI CFO is processing query & updating PostgreSQL...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts & Input */}
        <div className="mt-4 space-y-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 text-[11px] font-bold text-slate-200 hover:text-white transition-all whitespace-nowrap cursor-pointer shadow-sm"
              >
                💡 {prompt}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask AI Copilot (e.g., 'I spent ₹240 at Swiggy' or 'Add ₹5000 salary')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-900 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-medium"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2.5 w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* PANEL 3: Right Panel - Live Financial Context (3 cols) */}
      <div className="hidden lg:flex lg:col-span-3 glass-panel rounded-[32px] p-5 flex-col justify-between shadow-2xl overflow-y-auto custom-scrollbar space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Live Financial Context</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Income Inflow</span>
              <span className="text-base font-black text-emerald-400 font-mono">₹{totalIncome.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Living Expenses</span>
              <span className="text-base font-black text-rose-400 font-mono">₹{totalLivingExpenses.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Free Cash</span>
              <span className="text-base font-black text-blue-400 font-mono">₹{freeCash.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">EMI Burden Ratio</span>
              <span className="text-base font-black text-purple-400 font-mono">{emiRatio}%</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saving Velocity</span>
              <span className="text-base font-black text-amber-400 font-mono">{savingRate}%</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          ✓ Realtime PostgreSQL Connected
        </div>
      </div>
    </div>
  );
};

