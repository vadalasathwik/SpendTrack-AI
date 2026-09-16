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

  // Recurring Expenses (Prisma Backend)
  async getRecurringExpenses(): Promise<any[]> {
    return apiFetch<any[]>("/api/recurring");
  },

  async createRecurringExpense(item: any): Promise<any> {
    return apiFetch<any>("/api/recurring", {
      method: "POST",
      body: JSON.stringify(item),
    });
  },

  async updateRecurringExpense(id: string, item: any): Promise<any> {
    return apiFetch<any>(`/api/recurring/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    });
  },

  async deleteRecurringExpense(id: string) {
    return apiFetch<{ success: boolean }>(`/api/recurring/${id}`, {
      method: "DELETE",
    });
  },

  async processDueRecurringExpenses() {
    return apiFetch<{
      success: boolean;
      processedCount: number;
      createdExpenses: any[];
    }>("/api/recurring/process", {
      method: "POST",
    });
  },

  async generateDueRecurringExpenses() {
    return this.processDueRecurringExpenses();
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

  // Analytics Dashboard
  async getAnalyticsStats() {
    return apiFetch<{
      totalExpenses: number;
      transactionCount: number;
      averageExpense: number;
      highestExpense: number;
    }>("/api/analytics/stats");
  },

  async getMonthlyTrend() {
    return apiFetch<
      Array<{
        month: string;
        label: string;
        totalAmount: number;
      }>
    >("/api/analytics/monthly");
  },

  async getCategoryBreakdown(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month !== undefined) params.append("month", String(month));
    if (year !== undefined) params.append("year", String(year));
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<
      Array<{
        categoryId: string;
        categoryName: string;
        color: string;
        totalAmount: number;
        count: number;
      }>
    >(`/api/analytics/categories${query}`);
  },

  async getWeeklySpending() {
    return apiFetch<
      Array<{
        date: string;
        day: string;
        amount: number;
      }>
    >("/api/analytics/weekly");
  },

  async getTopMerchants() {
    return apiFetch<
      Array<{
        merchant: string;
        totalAmount: number;
        count: number;
      }>
    >("/api/analytics/merchants");
  },

  // Income API
  async getIncomes() {
    return apiFetch<any[]>("/api/income");
  },

  async createIncome(data: { title: string; amount: number }) {
    return apiFetch<any>("/api/income", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteIncome(id: string) {
    return apiFetch<{ success: boolean }>(`/api/income/${id}`, {
      method: "DELETE",
    });
  },

  // Reminders API
  async getReminders() {
    return apiFetch<any[]>("/api/reminders");
  },

  async createReminder(data: { title: string; description?: string; dueDate: string; priority?: string }) {
    return apiFetch<any>("/api/reminders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateReminder(id: string, data: any) {
    return apiFetch<any>(`/api/reminders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteReminder(id: string) {
    return apiFetch<{ success: boolean }>(`/api/reminders/${id}`, {
      method: "DELETE",
    });
  },

  // Investments API
  async getInvestments() {
    return apiFetch<any[]>("/api/investments");
  },

  async createInvestment(data: { title: string; provider: string; amount: number; type: string; frequency?: string; nextDate?: string; isActive?: boolean }) {
    return apiFetch<any>("/api/investments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateInvestment(id: string, data: any) {
    return apiFetch<any>(`/api/investments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteInvestment(id: string) {
    return apiFetch<{ success: boolean }>(`/api/investments/${id}`, {
      method: "DELETE",
    });
  },

  // Savings API
  async getSavings() {
    return apiFetch<any[]>("/api/savings");
  },

  async createSaving(data: { title: string; type: string; targetAmount: number; currentAmount: number; monthlyContribution: number; interestRate?: number; maturityDate?: string }) {
    return apiFetch<any>("/api/savings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateSaving(id: string, data: any) {
    return apiFetch<any>(`/api/savings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteSaving(id: string) {
    return apiFetch<{ success: boolean }>(`/api/savings/${id}`, {
      method: "DELETE",
    });
  },

  // EMI API
  async getEmis() {
    return apiFetch<any[]>("/api/emis");
  },

  async createEmi(data: { title: string; bank: string; amount: number; dueDay: number; interestRate?: number; outstanding?: number; reminder?: boolean }) {
    return apiFetch<any>("/api/emis", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateEmi(id: string, data: any) {
    return apiFetch<any>(`/api/emis/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteEmi(id: string) {
    return apiFetch<{ success: boolean }>(`/api/emis/${id}`, {
      method: "DELETE",
    });
  },

  // Notes API
  async getNotes() {
    return apiFetch<any[]>("/api/notes");
  },

  async saveNote(content: string, title?: string, tags?: string, pinned?: boolean) {
    return apiFetch<any>("/api/notes", {
      method: "POST",
      body: JSON.stringify({ content, title, tags, pinned }),
    });
  },

  async createNote(data: { title?: string; content: string; tags?: string; pinned?: boolean }) {
    return apiFetch<any>("/api/notes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateNote(id: string, data: { title?: string; content?: string; tags?: string; pinned?: boolean }) {
    return apiFetch<any>(`/api/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteNote(id: string) {
    return apiFetch<{ success: boolean }>(`/api/notes/${id}`, {
      method: "DELETE",
    });
  },

  // Planner API
  async getPlannerSummary() {
    return apiFetch<{
      income: number;
      emi: number;
      investments: number;
      savings: number;
      living: number;
      buffer: number;
    }>("/api/planner");
  },

  // Smart Reminders API
  async getUpcomingReminders() {
    return apiFetch<any[]>("/api/reminders/upcoming");
  },

  // Cashflow Current API
  async getCashFlowCurrent() {
    return apiFetch<{
      income: number;
      expenses: number;
      emi: number;
      investments: number;
      savings: number;
      freeCash: number;
      savingRate: number;
      emiRatio: number;
    }>("/api/cashflow/current");
  },

  // AI CFO & Financial Intelligence API
  async getCfoHealth() {
    return apiFetch<any>("/api/cfo/health");
  },

  async getCfoCashflow() {
    return apiFetch<any>("/api/cfo/cashflow");
  },

  async checkAffordability(amount: number, category?: string) {
    return apiFetch<any>("/api/cfo/can-afford", {
      method: "POST",
      body: JSON.stringify({ amount, category }),
    });
  },

  async getMonthlyClosingReport(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append("month", String(month));
    if (year) params.append("year", String(year));
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<any>(`/api/cfo/monthly-report${query}`);
  },

  async getSmartCfoNotifications() {
    return apiFetch<any[]>("/api/cfo/smart-notifications");
  },

  // Goals API
  async getGoals() {
    return apiFetch<any[]>("/api/goals");
  },

  async createGoal(data: { title: string; targetAmount: number; currentAmount?: number; targetDate: string; monthlyContribution?: number; category?: string }) {
    return apiFetch<any>("/api/goals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateGoal(id: string, data: any) {
    return apiFetch<any>(`/api/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteGoal(id: string) {
    return apiFetch<{ success: boolean }>(`/api/goals/${id}`, {
      method: "DELETE",
    });
  },

  // Net Worth API
  async getNetWorth() {
    return apiFetch<any>("/api/networth");
  },

  async createAsset(data: { name: string; category: string; amount: number }) {
    return apiFetch<any>("/api/networth/assets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteAsset(id: string) {
    return apiFetch<{ success: boolean }>(`/api/networth/assets/${id}`, {
      method: "DELETE",
    });
  },

  async createLiability(data: { name: string; category: string; amount: number }) {
    return apiFetch<any>("/api/networth/liabilities", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteLiability(id: string) {
    return apiFetch<{ success: boolean }>(`/api/networth/liabilities/${id}`, {
      method: "DELETE",
    });
  },
};