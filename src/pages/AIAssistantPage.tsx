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
  'How much did I spend?',
  'Upcoming payments',
  'Analyze my budget',
  'Where did my money go this month?',
  'Which category increased the most?',
  'How much did I spend on groceries?',
  'Which regular items cost me the most?',
];

const DEFAULT_WELCOME_MESSAGE: AIChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `Hello! I'm **${BRAND_NAME}**.\n\n### Ask TrackPay anything\n\nSelect a prompt chip below or ask any question about your spending:`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  expenses = [],
  recurringExpenses = [],
  categories = [],
  dateRange = { preset: 'currentMonth' as const, startDate: '', endDate: '', label: 'Current Month' },
  initialQuestion,
  onClearInitialQuestion,
}) => {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeRecurring = Array.isArray(recurringExpenses) ? recurringExpenses : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

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

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeMessages = Array.isArray(messages) ? messages : [];

  // Load chat history from Google Sheets via backend API
  useEffect(() => {
    let isMounted = true;
    const fetchChatHistory = async () => {
      try {
        setIsHistoryLoading(true);
        const records = await SpendTrackApi.getAIChatHistory();
        if (!isMounted) return;

        const safeRecords = Array.isArray(records) ? records : [];

        if (safeRecords.length > 0) {
          const sessionMap = new Map<string, AIChatMessage[]>();
          const timeMap = new Map<string, string>();

          safeRecords.forEach((rec) => {
            if (!rec) return;
            const timeStr = rec.timestamp
              ? new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const m: AIChatMessage = {
              id: rec.messageId || `msg-${Math.random()}`,
              role: rec.role === 'user' ? 'user' : 'assistant',
              content: rec.message || '',
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
            const safeMsgs = Array.isArray(msgs) ? msgs : [];
            const firstUserMsg = safeMsgs.find((m) => m.role === 'user');
            const title = firstUserMsg && firstUserMsg.content
              ? firstUserMsg.content.length > 30
                ? firstUserMsg.content.substring(0, 30) + '...'
                : firstUserMsg.content
              : 'Chat Conversation';

            return {
              id: cid,
              title,
              createdAt: timeMap.get(cid) || new Date().toISOString(),
              messages: safeMsgs,
            };
          });

          setSessions(loadedSessions);

          if (loadedSessions.length > 0) {
            const latestSession = loadedSessions[loadedSessions.length - 1];
            setActiveChatId(latestSession.id);
            setMessages(Array.isArray(latestSession.messages) ? latestSession.messages : [DEFAULT_WELCOME_MESSAGE]);
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
    const currentSession = safeSessions.find((s) => s?.id === activeChatId);
    if (currentSession && Array.isArray(currentSession.messages) && currentSession.messages.length > 0) {
      setMessages(currentSession.messages);
    } else if (safeSessions.length > 0 && !safeSessions.some((s) => s?.id === activeChatId)) {
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

  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState<string>('');

  const handleRenameChat = (chatId: string, currentTitle: string) => {
    setEditingTitleId(chatId);
    setEditingTitleText(currentTitle);
  };

  const saveRenameChat = (chatId: string) => {
    if (!editingTitleText.trim()) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === chatId ? { ...s, title: editingTitleText.trim() } : s))
    );
    setEditingTitleId(null);
  };

  const renderFormattedText = (text: string) => {
    // Check for code blocks
    if (text.includes('```')) {
      const parts = text.split(/(```[\s\S]*?```)/g);
      return parts.map((part, pIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const codeContent = part.slice(3, -3).replace(/^[a-z]+\n/, '');
          return (
            <pre key={pIdx} className="my-2 p-3 bg-slate-950 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto">
              <code>{codeContent}</code>
            </pre>
          );
        }
        return <div key={pIdx}>{renderFormattedText(part)}</div>;
      });
    }

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableRows: string[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check if line is a table row
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        tableRows.push(trimmed);
        return;
      }

      // If we accumulated table rows and hit a non-table line, render the table
      if (tableRows.length > 0) {
        elements.push(renderMarkdownTable(tableRows, `table-${idx}`));
        tableRows = [];
      }

      const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
      const content = isBullet ? trimmed.substring(2) : line;
      const parts = content.split(/(\*\*.*?\*\*)/g);

      const parsedContent = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={pIdx}>{part}</span>;
      });

      if (isBullet) {
        elements.push(
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-emerald-500 font-bold">•</span>
            <span className="flex-1 text-slate-700 dark:text-slate-300">{parsedContent}</span>
          </div>
        );
      } else if (trimmed === '') {
        elements.push(<div key={idx} className="h-1.5" />);
      } else {
        elements.push(
          <p key={idx} className="my-1 text-slate-700 dark:text-slate-300 leading-relaxed">
            {parsedContent}
          </p>
        );
      }
    });

    if (tableRows.length > 0) {
      elements.push(renderMarkdownTable(tableRows, 'table-end'));
    }

    return elements;
  };

  const renderMarkdownTable = (rows: string[], keyPrefix: string) => {
    const parsedRows = rows.map((r) =>
      r
        .split('|')
        .map((c) => c.trim())
        .filter((c, i, arr) => i > 0 && i < arr.length - 1)
    );

    if (parsedRows.length < 2) return null;
    const headers = parsedRows[0];
    const dataRows = parsedRows.slice(2);

    return (
      <div key={keyPrefix} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 font-medium">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      className="flex h-[calc(100vh-10.5rem)] md:h-[calc(100vh-9.5rem)] max-w-[1440px] mx-auto w-full bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 soft-shadow overflow-hidden"
      id="spendtrack-ai-container"
    >
      {/* DESKTOP SIDEBAR FOR CHAT CONVERSATIONS */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Conversations</span>
          </div>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer group ${
                s.id === activeChatId
                  ? 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-300/80 dark:border-emerald-800'
                  : 'hover:bg-slate-200/60 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
              onClick={() => {
                setActiveChatId(s.id);
                setMessages(s.messages);
              }}
            >
              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                {editingTitleId === s.id ? (
                  <input
                    type="text"
                    value={editingTitleText}
                    onChange={(e) => setEditingTitleText(e.target.value)}
                    onBlur={() => saveRenameChat(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRenameChat(s.id);
                    }}
                    autoFocus
                    className="w-full px-1 py-0.5 text-xs bg-white text-slate-900 rounded border border-emerald-500 focus:outline-none"
                  />
                ) : (
                  <span className="truncate" onDoubleClick={() => handleRenameChat(s.id, s.title)}>
                    {s.title}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(s.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer transition-opacity"
                title="Delete Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {sessions.length === 0 && (
            <p className="text-slate-400 text-center py-6 text-xs">No saved chats</p>
          )}
        </div>
      </aside>

      {/* MAIN CHAT WINDOW */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Chat Toolbar Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-white truncate">
                {currentChatTitle}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {dateRange.label} • {periodExpenses.length} purchases ({formatCurrency(totalPeriodSpending)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-[14px] text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer md:hidden"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {activeSession && (
              <button
                onClick={() => handleDeleteChat(activeChatId)}
                title="Delete Chat"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
          {isHistoryLoading && (
            <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Loading chat history...</span>
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

                  <div
                    className={`max-w-[88%] sm:max-w-[75%] rounded-[20px] px-4 py-3 text-sm shadow-xs relative group ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-xs'
                        : isErr
                        ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="space-y-1">{renderFormattedText(msg.content)}</div>
                    )}

                    <div
                      className={`flex items-center justify-between gap-2 mt-2 pt-1.5 border-t text-[10px] ${
                        isUser ? 'border-slate-800 text-slate-400' : 'border-slate-100 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>

                      {!isUser && !isErr && (
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
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

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-emerald-600 text-white shadow-xs animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                <span className="font-medium">Analyzing your spending & consumption data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* STICKY MESSAGE INPUT BOX */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
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
                className="w-full resize-none rounded-[12px] border border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              id="send-ai-btn"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-[14px] font-bold text-sm transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
