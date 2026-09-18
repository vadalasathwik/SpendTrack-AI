import { Expense, RecurringExpense, CategoryItem, DateRange } from '../types.js';
import { getStoredJWT } from './authService.js';
import { BRAND_NAME } from '../constants/brand.js';

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
    const token = getStoredJWT();

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
      throw new Error(errorData.error || `${BRAND_NAME} is temporarily unavailable.`);
    }

    const data = await res.json();
    return data.reply;
  },

  async askGeminiFinancialAssistant(params: any): Promise<string> {
    return this.sendMessage({
      message: params.question || params.message || '',
      history: params.history || [],
      dateRange: params.dateRange || { preset: 'currentMonth', startDate: '', endDate: '' },
      expenses: params.expenses || [],
      recurringExpenses: params.recurringExpenses || [],
      categories: params.categories || [],
    });
  },
};
