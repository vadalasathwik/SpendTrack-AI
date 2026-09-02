import { Expense, RecurringExpense, CategoryItem, DateRange } from '../types';
import { getAccessToken } from './authService';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
}

export interface SendAIMessageParams {
  message: string;
  history: AIChatMessage[];
  dateRange: DateRange;
  expenses: Expense[];
  recurringExpenses?: RecurringExpense[];
  categories?: CategoryItem[];
}

export const SpendTrackAIService = {
  /**
   * Sends a user prompt to the server-side SpendTrack AI service
   */
  async sendMessage(params: SendAIMessageParams): Promise<string> {
    const token = await getAccessToken();

    // Map history to simple role/content pairs
    const historyPayload = params.history
      .filter((h) => h.status !== 'error')
      .map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        content: h.content,
      }));

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
      message: params.message,
      history: historyPayload,
      dateRange: params.dateRange,
      currentDate: new Date().toISOString().split('T')[0],
      clientData: {
        expenses: params.expenses,
        recurringExpenses: params.recurringExpenses || [],
        categories: params.categories || [],
      },
    };

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'SpendTrack AI is temporarily unavailable.');
    }

    const data = await res.json();
    return data.reply;
  },
};
