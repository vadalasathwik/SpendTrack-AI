import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Plus,
  MessageSquare,
  ChevronDown,
  User as UserIcon,
  CornerDownLeft,
  Lightbulb,
} from 'lucide-react';
import { Expense, RecurringExpense, CategoryItem, DateRange, AIChatSession } from '../types.js';
import { SpendTrackAIService, AIChatMessage } from '../services/aiService.js';
import { SpendTrackApi } from '../services/api.js';
import { filterExpensesByDateRange, formatCurrency } from '../utils/calculations.js';
import { BRAND_NAME } from '../constants/brand.js';

interface AIAssistantPageProps {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  categories: CategoryItem[];
  dateRange: DateRange;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
}

const SUGGESTED_QUESTIONS = [
  'Where did my money go this month?',
  'Which category increased the most?',
  'How much did I spend on groceries?',
  'Which items became more expensive?',
  'How long did my cooking gas last?',
  'What is my average daily household spending?',
  'Which regular items cost me the most?',
  'Compare this month with last month.',
  'How much did I spend on utilities?',
  'What recurring bills do I have?',
  'What was my biggest single expense?',
  'How much milk do I use per day?',
];

const DEFAULT_WELCOME_MESSAGE: AIChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `Hello! I'm **${BRAND_NAME}**. I analyze your real expense history, category trends, item inflation, and daily household consumption rates.\n\nAsk me anything about your spending or select a suggested topic below.`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  expenses,
  recurringExpenses,
  categories,
  dateRange,
  initialQuestion,
  onClearInitialQuestion,
}) => {
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>(() => `chat_${Date.now()}`);
  const [messages, setMessages] = useState<AIChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load chat history from Google Sheets via backend API
  useEffect(() => {
    let isMounted = true;
    const fetchChatHistory = async () => {
      try {
        setIsHistoryLoading(true);
        const records = await SpendTrackApi.getAIChatHistory();
        if (!isMounted) return;

        if (records && records.length > 0) {
          const sessionMap = new Map<string, AIChatMessage[]>();
          const timeMap = new Map<string, string>();

          records.forEach((rec) => {
            const timeStr = rec.timestamp
              ? new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const m: AIChatMessage = {
              id: rec.messageId || `msg-${Math.random()}`,
              role: rec.role === 'user' ? 'user' : 'assistant',
              content: rec.message,
              timestamp: timeStr,
            };

            const existing = sessionMap.get(rec.chatId) || [];
            existing.push(m);
            sessionMap.set(rec.chatId, existing);

            if (!timeMap.has(rec.chatId)) {
              timeMap.set(rec.chatId, rec.timestamp || new Date().toISOString());
            }
          });

          const loadedSessions: AIChatSession[] = Array.from(sessionMap.entries()).map(([cid, msgs]) => {
            const firstUserMsg = msgs.find((m) => m.role === 'user');
            const title = firstUserMsg
              ? firstUserMsg.content.length > 30
                ? firstUserMsg.content.substring(0, 30) + '...'
                : firstUserMsg.content
              : 'Chat Conversation';

            return {
              id: cid,
              title,
              createdAt: timeMap.get(cid) || new Date().toISOString(),
              messages: msgs,
            };
          });

          setSessions(loadedSessions);

          if (loadedSessions.length > 0) {
            const latestSession = loadedSessions[loadedSessions.length - 1];
            setActiveChatId(latestSession.id);
            setMessages(latestSession.messages);
          }
        }
      } catch (err) {
        console.error('Failed to load persistent chat history:', err);
      } finally {
        if (isMounted) setIsHistoryLoading(false);
      }
    };

    fetchChatHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update current messages view when activeChatId changes
  useEffect(() => {
    const currentSession = sessions.find((s) => s.id === activeChatId);
    if (currentSession && currentSession.messages.length > 0) {
      setMessages(currentSession.messages);
    } else if (sessions.length > 0 && !sessions.some((s) => s.id === activeChatId)) {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
    }
  }, [activeChatId, sessions]);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle initial question passed from Dashboard or Launcher
  useEffect(() => {
    if (initialQuestion) {
      handleSendMessage(initialQuestion);
      onClearInitialQuestion?.();
    }
  }, [initialQuestion]);

  // Calculate active period stats for context display
  const periodExpenses = filterExpensesByDateRange(
    expenses,
    dateRange.startDate,
    dateRange.endDate
  );
  const totalPeriodSpending = periodExpenses.reduce((s, e) => s + (Number(e.totalPrice) || 0), 0);

  const activeSession = sessions.find((s) => s.id === activeChatId);
  const currentChatTitle = activeSession?.title || 'New Conversation';

  const handleNewChat = () => {
    const newChatId = `chat_${Date.now()}`;
    setActiveChatId(newChatId);
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setErrorMessage(null);
    setShowSessionDropdown(false);
  };

  const handleDeleteChat = async (chatIdToDelete: string) => {
    try {
      await SpendTrackApi.deleteAIChat(chatIdToDelete);
      const remainingSessions = sessions.filter((s) => s.id !== chatIdToDelete);
      setSessions(remainingSessions);

      if (activeChatId === chatIdToDelete) {
        if (remainingSessions.length > 0) {
          const nextSession = remainingSessions[remainingSessions.length - 1];
          setActiveChatId(nextSession.id);
          setMessages(nextSession.messages);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setErrorMessage(null);
    setInput('');

    const nowISO = new Date().toISOString();
    const timeDisplay = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-${Date.now()}`;

    const userMessage: AIChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: timeDisplay,
      status: 'sent',
    };

    const isFirstInSession = messages.filter((m) => m.id !== 'welcome-msg').length === 0;
    const currentChatId = activeChatId;

    const baseMessages = messages.filter((m) => m.id !== 'welcome-msg');
    const updatedHistory = [...baseMessages, userMessage];
    setMessages(updatedHistory);
    setIsLoading(true);

    // Save user message to Google Sheets async
    SpendTrackApi.saveAIChatMessage({
      chatId: currentChatId,
      messageId: userMsgId,
      role: 'user',
      message: query,
      timestamp: nowISO,
    }).catch((err) => console.error('Failed to persist user chat message:', err));

    // Update local session list
    setSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === currentChatId);
      const newTitle = isFirstInSession
        ? query.length > 30
          ? query.substring(0, 30) + '...'
          : query
        : prev[existingIdx]?.title || 'Chat Conversation';

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          title: newTitle,
          messages: updatedHistory,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: currentChatId,
            title: newTitle,
            createdAt: nowISO,
            messages: updatedHistory,
          },
        ];
      }
    });

    try {
      const replyText = await SpendTrackAIService.sendMessage({
        message: query,
        history: updatedHistory,
        dateRange,
        expenses,
        recurringExpenses,
        categories,
      });

      const aiMsgId = `ai-${Date.now()}`;
      const aiMessage: AIChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      };

      const finalMessages = [...updatedHistory, aiMessage];
      setMessages(finalMessages);

      // Save AI response to Google Sheets async
      SpendTrackApi.saveAIChatMessage({
        chatId: currentChatId,
        messageId: aiMsgId,
        role: 'assistant',
        message: replyText,
        timestamp: new Date().toISOString(),
      }).catch((err) => console.error('Failed to persist AI chat message:', err));

      // Update local session list with AI response
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === currentChatId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            messages: finalMessages,
          };
          return updated;
        }
        return prev;
      });
    } catch (err: any) {
      console.error('AI chat error:', err);
      const errMsg = err.message || `${BRAND_NAME} is temporarily unavailable.`;
      setErrorMessage(errMsg);

      const errorFallbackMsg: AIChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **${errMsg}**\n\nPlease check your network connection or verify your GEMINI_API_KEY in Settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorFallbackMsg]);
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const content = isBullet ? line.trim().substring(2) : line;

      const parts = content.split(/(\*\*.*?\*\*)/g);

      const parsedContent = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={pIdx}>{part}</span>;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-emerald-500 font-bold">•</span>
            <span className="flex-1 text-slate-700">{parsedContent}</span>
          </div>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="my-1 text-slate-700 leading-relaxed">
          {parsedContent}
        </p>
      );
    });
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-10.5rem)] md:h-[calc(100vh-9.5rem)] max-w-4xl mx-auto w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      id="spendtrack-ai-container"
    >
      {/* AI Header / Multi-Chat Toolbar */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0 relative z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/30 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            {/* Active Session Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSessionDropdown((v) => !v)}
                className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-white hover:text-emerald-300 transition-colors text-left truncate cursor-pointer"
              >
                <span className="truncate max-w-[180px] sm:max-w-[280px]">
                  {currentChatTitle}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {showSessionDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 z-50 text-xs">
                  <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-700 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    <span>Saved Chats ({sessions.length})</span>
                    <button
                      onClick={handleNewChat}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                          s.id === activeChatId
                            ? 'bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/40'
                            : 'hover:bg-slate-700 text-slate-300'
                        }`}
                        onClick={() => {
                          setActiveChatId(s.id);
                          setMessages(s.messages);
                          setShowSessionDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{s.title}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(s.id);
                          }}
                          title="Delete Chat"
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {sessions.length === 0 && (
                      <p className="text-slate-400 text-center py-3">No saved chats yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-2 truncate">
              <span>{dateRange.label}</span>
              <span>•</span>
              <span>
                {periodExpenses.length} purchases ({formatCurrency(totalPeriodSpending)})
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls: New Chat & Delete Active Chat */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNewChat}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Start new AI conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          {activeSession && (
            <button
              onClick={() => handleDeleteChat(activeChatId)}
              title="Delete this conversation"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-slate-50/50">
        {isHistoryLoading && (
          <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading conversation history from Google Sheets...</span>
          </div>
        )}

        {!isHistoryLoading &&
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isErr = msg.status === 'error';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${
                    isUser
                      ? 'bg-slate-800 text-white'
                      : isErr
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-xs relative group ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : isErr
                      ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="space-y-1">{renderFormattedText(msg.content)}</div>
                  )}

                  {/* Footer with Timestamp & Copy */}
                  <div
                    className={`flex items-center justify-between gap-2 mt-2 pt-1 border-t text-[10px] ${
                      isUser ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {!isUser && !isErr && (
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-emerald-600 text-white shadow-xs animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-3 text-slate-600 text-sm">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              <span className="font-medium text-slate-700">
                Analyzing your spending & consumption data...
              </span>
            </div>
          </div>
        )}

        {/* Suggested Questions Section */}
        {messages.length <= 2 && !isLoading && !isHistoryLoading && (
          <div className="mt-4 pt-2">
            <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Suggested Questions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="text-left text-xs bg-white hover:bg-emerald-50/80 hover:border-emerald-300 border border-slate-200 text-slate-700 hover:text-emerald-900 rounded-xl p-2.5 transition-all shadow-2xs flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <span className="font-medium">{q}</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Retry Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-t border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => handleSendMessage(messages[messages.length - 1]?.content)}
            className="font-bold text-rose-700 hover:text-rose-900 underline ml-2 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your spending, groceries, fuel, gas, or daily burn..."
              rows={1}
              disabled={isLoading}
              className="w-full resize-none rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50 focus:bg-white transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            id="send-ai-btn"
            className="p-2.5 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-medium text-sm transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-400 mt-2">
          {BRAND_NAME} saves conversations to Google Sheets and analyzes real household spending.
        </p>
      </div>
    </div>
  );
};
