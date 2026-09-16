import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, DollarSign, Activity, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { SpendTrackApi } from '../services/api.js';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const FloatingAiCopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Good day! I am your TrackPay AI CFO. Ask me anything about your cash flow, purchase affordability, EMI exposure, or monthly savings targets.',
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
      let aiText = '';
      const lower = textToSend.toLowerCase();

      if (lower.includes('afford') || lower.includes('can i buy')) {
        const matchAmount = textToSend.match(/\d+/);
        const amount = matchAmount ? Number(matchAmount[0]) : 10000;
        const result = await SpendTrackApi.checkAffordability(amount);
        aiText = result.message;
      } else if (lower.includes('health') || lower.includes('score')) {
        const health = await SpendTrackApi.getCfoHealth();
        aiText = `Your Financial Health Score is ${health.healthScore}/100 (${health.risk} Risk). Free cash remaining: ₹${health.freeCash.toLocaleString('en-IN')}. Saving rate: ${health.savingRate}%.`;
      } else if (lower.includes('invest') || lower.includes('savings')) {
        const cashflow = await SpendTrackApi.getCfoCashflow();
        const safeInvestment = Math.round(cashflow.freeCash * 0.4);
        aiText = `Based on your free cash buffer of ₹${cashflow.freeCash.toLocaleString('en-IN')}, you can safely allocate ₹${safeInvestment.toLocaleString('en-IN')}/month into index funds or Gold SIPs.`;
      } else if (lower.includes('report') || lower.includes('summary')) {
        const report = await SpendTrackApi.getMonthlyClosingReport();
        aiText = report.aiSummary;
      } else {
        const health = await SpendTrackApi.getCfoHealth();
        aiText = `Health Score: ${health.healthScore}/100. Free Cash: ₹${health.freeCash.toLocaleString('en-IN')}. ${health.insights[0] || 'Keep optimizing your monthly cash buffer.'}`;
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'I was unable to retrieve live financial stats right now. Please try again.',
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
                <h3 className="font-extrabold text-sm text-white">TrackPay AI CFO</h3>
                <p className="text-[10px] text-violet-300">Personal Financial Intelligence</p>
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
          <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold text-slate-300">
            <button
              onClick={() => handleSendPrompt('Can I buy this for ₹25,000?')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-900/40 text-violet-300 border border-violet-500/20 whitespace-nowrap cursor-pointer"
            >
              Can I buy this?
            </button>
            <button
              onClick={() => handleSendPrompt('Summarize September')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-900/40 text-violet-300 border border-violet-500/20 whitespace-nowrap cursor-pointer"
            >
              Summarize Month
            </button>
            <button
              onClick={() => handleSendPrompt('Increase SIP recommendation')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-900/40 text-violet-300 border border-violet-500/20 whitespace-nowrap cursor-pointer"
            >
              Increase SIP
            </button>
            <button
              onClick={() => handleSendPrompt('Reduce EMI burden strategy')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-violet-900/40 text-violet-300 border border-violet-500/20 whitespace-nowrap cursor-pointer"
            >
              Reduce EMI burden
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
