import { Expense, RecurringExpense, CategoryItem, MonthlyItem } from '../types';
import { getAccessToken, setAccessToken } from './authService';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in with Google.');
  }

  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      setAccessToken(null);
      throw new Error('Not authenticated. Please sign in with Google.');
    }
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const SpendTrackApi = {
  // Check Workspace status
  async checkWorkspaceStatus() {
    return apiFetch<{ success: boolean; spreadsheetId: string; driveFolders: any }>('/api/workspace/status');
  },

  // Monthly Items (Templates)
  async getMonthlyItems(): Promise<MonthlyItem[]> {
    return apiFetch<MonthlyItem[]>('/api/monthly-items');
  },

  async createMonthlyItem(item: Omit<MonthlyItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MonthlyItem> {
    return apiFetch<MonthlyItem>('/api/monthly-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateMonthlyItem(id: string, item: Partial<MonthlyItem>): Promise<MonthlyItem> {
    return apiFetch<MonthlyItem>(`/api/monthly-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  async deleteMonthlyItem(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/monthly-items/${id}`, {
      method: 'DELETE',
    });
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return apiFetch<Expense[]>('/api/expenses');
  },

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    return apiFetch<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    return apiFetch<Expense>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  },

  async deleteExpense(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  async getCategories(): Promise<CategoryItem[]> {
    return apiFetch<CategoryItem[]>('/api/categories');
  },

  async saveCategories(categories: CategoryItem[]): Promise<CategoryItem[]> {
    return apiFetch<CategoryItem[]>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categories),
    });
  },

  // Recurring Expenses
  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    return apiFetch<RecurringExpense[]>('/api/recurring');
  },

  async createRecurringExpense(
    item: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RecurringExpense> {
    return apiFetch<RecurringExpense>('/api/recurring', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateRecurringExpense(id: string, item: Partial<RecurringExpense>): Promise<RecurringExpense> {
    return apiFetch<RecurringExpense>(`/api/recurring/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  async deleteRecurringExpense(id: string, calendarEventId?: string): Promise<{ success: boolean }> {
    const url = calendarEventId
      ? `/api/recurring/${id}?calendarEventId=${encodeURIComponent(calendarEventId)}`
      : `/api/recurring/${id}`;
    return apiFetch<{ success: boolean }>(url, {
      method: 'DELETE',
    });
  },

  // Drive Upload
  async uploadReceipt(file: { name: string; type: string; base64Data: string }) {
    return apiFetch<{ fileId: string; fileName: string; webViewLink: string }>('/api/drive/upload-receipt', {
      method: 'POST',
      body: JSON.stringify(file),
    });
  },

  // File metadata
  async getDriveFile(fileId: string) {
    return apiFetch<{ fileId: string; name: string; mimeType: string; webViewLink: string; thumbnailLink?: string }>(
      `/api/drive/file/${fileId}`
    );
  },
};
