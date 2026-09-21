import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, DollarSign, Activity, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { parseAndExecuteLocalAiIntent } from '../services/localAiParser.js';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface FloatingAiCopilotProps {
  onRefreshData?: () => void;
}

export const FloatingAiCopilot: React.FC<FloatingAiCopilotProps> = ({ onRefreshData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Good day! I am your SpendTrack AI CFO. Ask me to record spending, add salary, check EMI dates, or analyze savings.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSendPrompt = async (promptText?: string) => {
    const textToSend = promptText || query;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setQuery('');
    setLoading(true);

    try {
      const result = await parseAndExecuteLocalAiIntent(textToSend, {
        expenses: [],
        recurringExpenses: [],
        onRefreshData,
      });

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Unable to complete AI action right now. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Copilot Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-2xl hover:scale-105 transition-all cursor-pointer border border-violet-400/40"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>AI CFO Copilot</span>
        </button>
      )}

      {/* Expanded Copilot Drawer */}
      {isOpen && (
        <div className="bg-slate-900 border border-violet-500/30 w-[calc(100vw-40px)] sm:w-[380px] h-[520px] rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">SpendTrack AI CFO</h3>
                <p className="text-[10px] text-violet-300">Local PostgreSQL Copilot</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold text-slate-300 no-scrollbar">
            <button
              onClick={() => handleSendPrompt('I spent ₹240 at Swiggy')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-900/40 text-violet-300 border border-violet-500/20 whitespace-nowrap cursor-pointer"
            >
              Swiggy Spend
            </button>
            <button
              onClick={() => handleSendPrompt('Add ₹5000 salary')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-900/40 text-violet-300 border border-violet-500/20 whitespace-nowrap cursor-pointer"
            >
              Add Salary
            </button>
            <button
              onClick={() => handleSendPrompt('Show this month\'s spending')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-900/40 text-violet-300 border border-violet-500/20 whitespace-nowrap cursor-pointer"
            >
              Month Spend
            </button>
            <button
              onClick={() => handleSendPrompt('How much can I save?')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-900/40 text-violet-300 border border-violet-500/20 whitespace-nowrap cursor-pointer"
            >
              Savings
            </button>
            <button
              onClick={() => handleSendPrompt('When is my next EMI?')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-900/40 text-violet-300 border border-violet-500/20 whitespace-nowrap cursor-pointer"
            >
              Next EMI
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-[16px] max-w-[85%] text-xs font-medium leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800 text-slate-400 text-xs w-fit">
                <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <span>AI CFO is analyzing stats...</span>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask AI CFO..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
