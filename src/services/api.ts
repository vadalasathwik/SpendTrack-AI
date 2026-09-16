import {
  Expense,
  RecurringExpense,
  CategoryItem,
  MonthlyItem,
  ConsumptionLog,
  AppNotification,
  AIChatRecord,
} from "../types";
import { getStoredJWT, clearAuthSession } from "./authService";

/* -------------------------------------------------------
   Universal authenticated fetch
-------------------------------------------------------- */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredJWT();

  if (!token) {
    throw new Error(
      "Not authenticated. Please sign in with Google."
    );
  }

  const res = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("spendtrack_401_unauthorized"));
      }
      throw new Error(
        "Session expired or unauthorized. Please sign in with Google again."
      );
    }

    const errorBody = await res.json().catch(() => ({}));

    throw new Error(
      errorBody.error || `Request failed (${res.status})`
    );
  }

  return res.json();
}

/* -------------------------------------------------------
   SpendTrack API
-------------------------------------------------------- */
export const SpendTrackApi = {
  // Workspace Status
  async checkWorkspaceStatus() {
    return apiFetch<{
      success: boolean;
    }>("/api/workspace/status");
  },

  async getWorkspaceMembers() {
    return {
      workspace: null,
      members: [],
      invites: [],
      currentRole: "owner",
    };
  },

  async inviteWorkspaceMember(_email: string, _role: string) {
    return { token: `inv_${Date.now()}` };
  },

  async acceptWorkspaceInvite(_token: string) {
    return { success: true };
  },

  async removeWorkspaceMember(_targetUid: string) {
    return { success: true };
  },

  // Monthly Items (stubbed for compatibility)
  async getMonthlyItems(): Promise<MonthlyItem[]> {
    return [];
  },

  async createMonthlyItem(
    item: Omit<MonthlyItem, "id" | "createdAt" | "updatedAt">
  ): Promise<MonthlyItem> {
    return {
      id: `mi_${Date.now()}`,
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateMonthlyItem(
    id: string,
    item: Partial<MonthlyItem>
  ): Promise<MonthlyItem> {
    return {
      id,
      name: item.name || "",
      category: item.category || "",
      unit: item.unit || "unit",
      usageTrackingEnabled: false,
      isEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item,
    };
  },

  async deleteMonthlyItem(_id: string) {
    return { success: true };
  },

  // Expenses (Prisma API)
  async getExpenses(): Promise<Expense[]> {
    return apiFetch<Expense[]>("/api/expenses");
  },

  async createExpense(
    expense: Omit<Expense, "id" | "createdAt" | "updatedAt">
  ): Promise<Expense> {
    return apiFetch<Expense>("/api/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    });
  },

  async updateExpense(
    id: string,
    expense: Partial<Expense>
  ): Promise<Expense> {
    return apiFetch<Expense>(`/api/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(expense),
    });
  },

  async deleteExpense(id: string) {
    return apiFetch<{ success: boolean }>(`/api/expenses/${id}`, {
      method: "DELETE",
    });
  },

  // Categories (Prisma API)
  async getCategories(): Promise<CategoryItem[]> {
    return apiFetch<CategoryItem[]>("/api/categories");
  },

  async createCategory(category: { name: string; color?: string; icon?: string }): Promise<CategoryItem> {
    return apiFetch<CategoryItem>("/api/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  },

  async updateCategory(
    id: string,
    category: { name?: string; color?: string; icon?: string }
  ): Promise<CategoryItem> {
    return apiFetch<CategoryItem>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category),
    });
  },

  async deleteCategory(id: string) {
    return apiFetch<{ success: boolean }>(`/api/categories/${id}`, {
      method: "DELETE",
    });
  },

  async saveCategories(categories: CategoryItem[]) {
    return apiFetch<CategoryItem[]>("/api/categories", {
      method: "POST",
      body: JSON.stringify(categories),
    });
  },

  // Recurring Bills (stubbed / in-memory for compatibility)
  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    return [];
  },

  async createRecurringExpense(
    item: Omit<RecurringExpense, "id" | "createdAt" | "updatedAt">
  ): Promise<RecurringExpense> {
    return {
      id: `rec_${Date.now()}`,
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateRecurringExpense(
    id: string,
    item: Partial<RecurringExpense>
  ): Promise<RecurringExpense> {
    return {
      id,
      name: item.name || "",
      category: item.category || "",
      amount: item.amount || 0,
      frequency: item.frequency || "monthly",
      dueDay: item.dueDay || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item,
    };
  },

  async deleteRecurringExpense(_id: string) {
    return { success: true };
  },

  async generateDueRecurringExpenses() {
    return {
      success: true,
      createdExpenses: [],
      updatedBills: [],
    };
  },

  // Consumption Log (stubbed)
  async getConsumptionLogs(): Promise<ConsumptionLog[]> {
    return [];
  },

  async createConsumptionLog(
    log: Omit<ConsumptionLog, "id" | "createdAt" | "updatedAt">
  ) {
    return {
      log: {
        id: `cl_${Date.now()}`,
        ...log,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      updatedItem: null,
    };
  },

  async deleteConsumptionLog(_id: string) {
    return { success: true };
  },

  // AI Receipt Scanner
  async scanReceipt(payload: {
    name: string;
    type: string;
    base64Data: string;
  }) {
    return apiFetch<any>("/api/receipt/scan", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Budget Management (Prisma API)
  async getBudgetSummary(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month !== undefined) params.append("month", String(month));
    if (year !== undefined) params.append("year", String(year));
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<{
      budget: number;
      spent: number;
      remaining: number;
      percentage: number;
    }>(`/api/budget/summary${query}`);
  },

  async getCurrentBudget(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month !== undefined) params.append("month", String(month));
    if (year !== undefined) params.append("year", String(year));
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<{
      month: number;
      year: number;
      budget: number;
    }>(`/api/budget/current${query}`);
  },

  async setBudget(amount: number, month?: number, year?: number) {
    return apiFetch<any>("/api/budget", {
      method: "POST",
      body: JSON.stringify({ amount, month, year }),
    });
  },

  async predictBudget(
    clientExpenses?: Expense[],
    clientRecurring?: RecurringExpense[]
  ) {
    return apiFetch<any>("/api/budget/predict", {
      method: "POST",
      body: JSON.stringify({
        clientExpenses,
        clientRecurring,
      }),
    });
  },

  // User Settings
  async getSettings(): Promise<Record<string, string>> {
    return apiFetch<Record<string, string>>("/api/settings");
  },

  async saveSettings(settings: Record<string, string>): Promise<Record<string, string>> {
    return apiFetch<Record<string, string>>("/api/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  },

  // AI Chat History
  async getAIChatHistory(): Promise<AIChatRecord[]> {
    return apiFetch<AIChatRecord[]>("/api/ai/chat/history");
  },

  async saveAIChatMessage(record: Omit<AIChatRecord, "timestamp"> & { timestamp?: string }) {
    return apiFetch<{ success: boolean; record: AIChatRecord }>("/api/ai/chat/history", {
      method: "POST",
      body: JSON.stringify(record),
    });
  },

  async deleteAIChat(chatId: string) {
    return apiFetch<{ success: boolean }>(`/api/ai/chat/history?chatId=${encodeURIComponent(chatId)}`, {
      method: "DELETE",
    });
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const res = await apiFetch<any>("/api/notifications");
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.notifications)) return res.notifications;
    return [];
  },

  async saveNotification(notification: Omit<AppNotification, "id" | "createdAt"> & { id?: string; createdAt?: string }) {
    return apiFetch<AppNotification>("/api/notifications", {
      method: "POST",
      body: JSON.stringify(notification),
    });
  },

  async updateNotification(id: string, updates: Partial<AppNotification>) {
    return apiFetch<AppNotification>(`/api/notifications/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteNotification(id: string) {
    return apiFetch<{ success: boolean }>(`/api/notifications/${id}`, {
      method: "DELETE",
    });
  },

  async clearAllNotifications() {
    return apiFetch<{ success: boolean }>("/api/notifications", {
      method: "DELETE",
    });
  },
};