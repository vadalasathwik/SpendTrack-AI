import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  RotateCcw,
  User as UserIcon,
  ShieldCheck,
  Activity,
  PieChart,
  Wallet,
  Calendar,
  Receipt,
  CheckCircle2,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Expense, RecurringExpense, CategoryItem, DateRange } from '../types.js';
import { AIChatMessage } from '../services/aiService.js';
import { parseAndExecuteLocalAiIntent } from '../services/localAiParser.js';
import { formatCurrency } from '../utils/calculations.js';

interface AIAssistantPageProps {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  categories?: CategoryItem[];
  incomes?: any[];
  dateRange?: DateRange;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
  onRefreshData?: () => void;
}

const SUGGESTED_PROMPTS = [
  {
    id: 'monthly_spend',
    text: 'How much did I spend this month?',
    icon: Activity,
    badge: 'Spending',
  },
  {
    id: 'top_categories',
    text: 'Where am I spending the most?',
    icon: PieChart,
    badge: 'Categories',
  },
  {
    id: 'budget_left',
    text: 'How much budget do I have left?',
    icon: Wallet,
    badge: 'Budget',
  },
  {
    id: 'upcoming_bills',
    text: 'What bills are coming next?',
    icon: Calendar,
    badge: 'Bills',
  },
  {
    id: 'recent_expenses',
    text: 'Show my recent expenses.',
    icon: Receipt,
    badge: 'Transactions',
  },
  {
    id: 'affordability',
    text: 'Can I afford this expense?',
    icon: CheckCircle2,
    badge: 'Affordability',
  },
];

const DEFAULT_WELCOME_MESSAGE: AIChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `Hello! I'm your **AI Financial Copilot**.\n\nAsk me questions about your monthly spending, top categories, remaining budget, upcoming bills, recent expenses, or purchase affordability.\n\nClick any suggested question above or type your natural-language question below!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  expenses = [],
  recurringExpenses = [],
  categories = [],
  incomes = [],
  initialQuestion,
  onClearInitialQuestion,
  onRefreshData,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Real-time financial calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.purchaseDate) return false;
      const d = new Date(e.purchaseDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [expenses, currentMonth, currentYear]);

  const activeExpensesList = currentMonthExpenses.length > 0 ? currentMonthExpenses : expenses;
  const currentMonthSpent = useMemo(() => {
    return activeExpensesList.reduce((sum, e) => sum + (e.totalPrice || 0), 0);
  }, [activeExpensesList]);

  const totalCategoryBudget = useMemo(() => {
    const sum = categories.reduce((acc, c) => acc + (c.allocatedBudget || 0), 0);
    return sum > 0 ? sum : 40000;
  }, [categories]);

  const remainingBudget = totalCategoryBudget - currentMonthSpent;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialQuestion) {
      handleSendMessage(initialQuestion);
      if (onClearInitialQuestion) onClearInitialQuestion();
    }
  }, [initialQuestion]);

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
        categories,
        incomes,
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
    <div className="space-y-5 max-w-[1440px] mx-auto pb-24 text-slate-900 dark:text-white" id="ai-financial-copilot-page">
      {/* ------------------------------------------------------------- */}
      {/* Top Header                                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
            <Sparkles className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              AI Financial Copilot
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              "Ask questions about your finances."
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMessages([DEFAULT_WELCOME_MESSAGE])}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer self-start sm:self-center flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Suggested Prompts Grid                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Suggested Questions</span>
          </h2>
          <span className="text-[11px] font-bold text-slate-400">Click to ask AI</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SUGGESTED_PROMPTS.map((prompt) => {
            const Icon = prompt.icon;
            return (
              <button
                type="button"
                key={prompt.id}
                onClick={() => handleSendMessage(prompt.text)}
                className="p-3.5 rounded-[20px] bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/50 text-left transition-all cursor-pointer flex items-center gap-3 group active:scale-98"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 block truncate">
                    {prompt.text}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {prompt.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Main Conversation & Financial Summary Grid                    */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chat Area (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-6 flex flex-col justify-between min-h-[480px] h-[calc(100vh-360px)]">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-[22px] p-4 text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-xs font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div
                      className={`mt-2 flex items-center justify-end gap-2 text-[10px] ${
                        isUser ? 'text-white/80 font-bold' : 'text-slate-400 font-medium'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-0.5 cursor-pointer"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>AI Financial Copilot is analyzing your data...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Natural Language Input */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ask questions about your finances..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="w-full pl-4 pr-12 py-3.5 rounded-[18px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Context Summary Side Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Live Application Context</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-[18px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Current Month Spent
                </span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                  {formatCurrency(currentMonthSpent)}
                </span>
              </div>

              <div className="p-3.5 rounded-[18px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Remaining Monthly Budget
                </span>
                <span className={`text-base font-black font-mono ${remainingBudget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(remainingBudget)}
                </span>
              </div>

              <div className="p-3.5 rounded-[18px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Recorded Expenses
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                  {expenses.length} transactions
                </span>
              </div>

              <div className="p-3.5 rounded-[18px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Recurring Commitments
                </span>
                <span className="text-base font-black text-purple-600 dark:text-purple-400 font-mono">
                  {recurringExpenses.length} active bills
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              ✓ Connected to Real User Data
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
