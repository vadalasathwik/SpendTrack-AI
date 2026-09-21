import {
  Expense,
  RecurringExpense,
  CategoryItem,
  MonthlyItem,
  ConsumptionLog,
  AppNotification,
  AIChatRecord,
} from "../types";
import { getStoredJWT, refreshAccessToken, clearAuthSession } from "./authService";

/* -------------------------------------------------------
   Universal authenticated fetch
-------------------------------------------------------- */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = getStoredJWT();

  if (!token) {
    token = await refreshAccessToken();
  }

  if (!token) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("spendtrack_401_unauthorized"));
    }
    throw new Error(
      "Not authenticated. Please sign in with Google."
    );
  }

  let res = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // Retry once after refreshing token
    token = await refreshAccessToken();
    if (token) {
      res = await fetch(endpoint, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });
    }
  }

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
  // Auth Sessions
  async getSessions() {
    return apiFetch<any[]>("/api/auth/sessions").catch(() => []);
  },

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

  async patchRecurringExpense(id: string, patch: any): Promise<any> {
    return apiFetch<any>(`/api/recurring/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async skipOnceRecurringExpense(id: string): Promise<any> {
    return apiFetch<any>(`/api/recurring/${id}/skip`, {
      method: "POST",
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

  async getNetWorthHistory(range: string = "6M"): Promise<any> {
    return apiFetch<any>(`/api/history/networth?range=${encodeURIComponent(range)}`);
  },

  async getAnalyticsSummary(): Promise<any> {
    return apiFetch<any>("/api/analytics");
  },

  async getMonthlyExecutiveReport(period: string = "monthly"): Promise<any> {
    return apiFetch<any>(`/api/reports/monthly?period=${encodeURIComponent(period)}`);
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
  async getLiveFinancialIntelligence() {
    return apiFetch<{
      netWorth: number;
      netWorthGrowthPct: number;
      totalAssets: number;
      totalLiabilities: number;
      income: number;
      expenses: number;
      freeCash: number;
      monthlyBurnRate: number;
      savingsRate: number;
      investmentRatio: number;
      emergencyFund: number;
      emergencyMonths: number;
      passiveIncome: number;
      investedAssets: number;
      targetFireNumber: number;
      fireProgressPct: number;
    }>("/api/analytics/financial-intelligence");
  },

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

  async checkAffordability(
    dataOrAmount:
      | number
      | {
          amount: number;
          category?: string;
          itemName?: string;
          cashback?: number;
          isEmi?: boolean;
          emiMonths?: number;
          interestRate?: number;
          downPayment?: number;
        },
    category?: string
  ) {
    const payload =
      typeof dataOrAmount === "number"
        ? { amount: dataOrAmount, category }
        : dataOrAmount;
    return apiFetch<any>("/api/cfo/affordability", {
      method: "POST",
      body: JSON.stringify(payload),
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

  // Phase 1 API Methods
  async getInbox() {
    return apiFetch<any[]>("/api/inbox");
  },

  async completeInboxItem(id: string, itemType: string) {
    return apiFetch<{ success: boolean }>(`/api/inbox/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify({ itemType }),
    });
  },

  async snoozeInboxItem(id: string, itemType: string, days: number = 3) {
    return apiFetch<{ success: boolean }>(`/api/inbox/${id}/snooze`, {
      method: "PATCH",
      body: JSON.stringify({ itemType, days }),
    });
  },

  async getSubscriptions() {
    return apiFetch<any[]>("/api/subscriptions");
  },

  async getCashflowForecast() {
    return apiFetch<any>("/api/cashflow/forecast");
  },

  async getDailyBrief() {
    return apiFetch<any>("/api/daily-brief");
  },

  // Phase 2 API Methods
  async getDynamicWealthAllocation() {
    return apiFetch<any>("/api/cfo/wealth-allocation");
  },

  async getCfoInsights() {
    return apiFetch<Record<string, any>>("/api/cfo/insights");
  },

  // TrackPay v4.2.0 Workspace API Methods
  async getPortfolioSummary() {
    return apiFetch<any>("/api/workspace/portfolio");
  },

  async addPortfolioHolding(data: any) {
    return apiFetch<any>("/api/workspace/portfolio", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deletePortfolioHolding(id: string) {
    return apiFetch<{ success: boolean }>(`/api/workspace/portfolio/${id}`, {
      method: "DELETE",
    });
  },

  async getGoldWorkspace() {
    return apiFetch<any>("/api/workspace/gold");
  },

  async addGoldHolding(data: any) {
    return apiFetch<any>("/api/workspace/gold", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteGoldHolding(id: string) {
    return apiFetch<{ success: boolean }>(`/api/workspace/gold/${id}`, {
      method: "DELETE",
    });
  },

  async getLoanIntelligence() {
    return apiFetch<any>("/api/workspace/loans/intelligence");
  },

  async simulateLoanPartPayment(data: {
    outstanding: number;
    interestRate: number;
    currentEmi: number;
    partPaymentAmount: number;
  }) {
    return apiFetch<any>("/api/workspace/loans/part-payment-sim", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getInsuranceVault() {
    return apiFetch<any>("/api/workspace/insurance");
  },

  async addInsurancePolicy(data: any) {
    return apiFetch<any>("/api/workspace/insurance", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteInsurancePolicy(id: string) {
    return apiFetch<{ success: boolean }>(`/api/workspace/insurance/${id}`, {
      method: "DELETE",
    });
  },

  async getDocuments(category?: string, query?: string) {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (query) params.append("q", query);
    const q = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<any>(`/api/workspace/documents${q}`);
  },

  async addDocument(data: any) {
    return apiFetch<any>("/api/workspace/documents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteDocument(id: string) {
    return apiFetch<{ success: boolean }>(`/api/workspace/documents/${id}`, {
      method: "DELETE",
    });
  },

  async getSalaryIntelligence() {
    return apiFetch<any>("/api/workspace/salary");
  },

  async saveSalaryRecord(data: any) {
    return apiFetch<any>("/api/workspace/salary", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getFamilyWorkspace() {
    return apiFetch<any>("/api/workspace/family");
  },

  async addFamilyMember(data: any) {
    return apiFetch<any>("/api/workspace/family", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteFamilyMember(id: string) {
    return apiFetch<{ success: boolean }>(`/api/workspace/family/${id}`, {
      method: "DELETE",
    });
  },

  async getTaxDashboard(fy: string = "FY 2025-26") {
    return apiFetch<any>(`/api/workspace/tax?fy=${encodeURIComponent(fy)}`);
  },

  async queryAiSpecialist(persona: string, query: string) {
    return apiFetch<any>("/api/workspace/ai-specialist", {
      method: "POST",
      body: JSON.stringify({ persona, query }),
    });
  },

  // v4.4.0 Banking Intelligence & Financial Ledger OS Methods
  async getAccounts() {
    return apiFetch<any>("/api/accounts");
  },

  async createAccount(data: any) {
    return apiFetch<any>("/api/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateAccount(id: string, data: any) {
    return apiFetch<any>(`/api/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async getLedger(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch<any>(`/api/ledger${query ? `?${query}` : ""}`);
  },

  async createLedgerEntry(data: any) {
    return apiFetch<any>("/api/ledger", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getReconciliationStatus() {
    return apiFetch<any>("/api/reconciliation");
  },

  async updateReconciliation(id: string, data: any) {
    return apiFetch<any>(`/api/reconciliation/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async getEnvelopes(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append("month", month.toString());
    if (year) params.append("year", year.toString());
    return apiFetch<any>(`/api/envelopes?${params.toString()}`);
  },

  async updateEnvelope(id: string, data: any) {
    return apiFetch<any>(`/api/envelopes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async createSpendingRule(data: any) {
    return apiFetch<any>("/api/envelopes/rules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getExecutiveCfoReport(period: string = "monthly") {
    return apiFetch<any>(`/api/reports/cfo?period=${encodeURIComponent(period)}`);
  },

  async getAuditLogs(limit: number = 50) {
    return apiFetch<any>(`/api/audit?limit=${limit}`);
  },

  // v4.5.0 Autonomous AI Finance OS Methods
  async getBankSyncStatus() {
    return apiFetch<any>("/api/accounts/sync");
  },

  async importTransactions(transactions: any[]) {
    return apiFetch<any>("/api/ledger/import", {
      method: "POST",
      body: JSON.stringify({ transactions }),
    });
  },

  async get90DayForecast() {
    return apiFetch<any>("/api/forecast/90days");
  },

  async getFinancialHealth3() {
    return apiFetch<any>("/api/health");
  },

  async getBoardroomReport(period: "weekly" | "monthly" | "quarterly" = "monthly") {
    return apiFetch<any>(`/api/reports/${period}`);
  },

  // v4.6.0 Enterprise Finance Intelligence & Wealth OS Methods
  async getRetirementPlan(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch<any>(`/api/retirement${query ? `?${query}` : ""}`);
  },

  async calculateRetirement(data: any) {
    return apiFetch<any>("/api/retirement", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getEstatePlanner() {
    return apiFetch<any>("/api/estate");
  },

  async getPassiveIncomeTracker() {
    return apiFetch<any>("/api/passive-income");
  },

  async getBusinessWorkspace() {
    return apiFetch<any>("/api/business");
  },

  async createInvoice(data: any) {
    return apiFetch<any>("/api/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async runDecisionSimulation(scenario: any) {
    return apiFetch<any>("/api/simulation", {
      method: "POST",
      body: JSON.stringify(scenario),
    });
  },

  async getAnnualBoardroomReport() {
    return apiFetch<any>("/api/reports/annual");
  },

  // v4.7.0 AI Life Finance Ecosystem Methods
  async getProperty() {
    return apiFetch<any>("/api/property");
  },

  async createProperty(data: any) {
    return apiFetch<any>("/api/property", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getVehicles() {
    return apiFetch<any>("/api/vehicles");
  },

  async createVehicle(data: any) {
    return apiFetch<any>("/api/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getEducation() {
    return apiFetch<any>("/api/education");
  },

  async getHealthcare() {
    return apiFetch<any>("/api/healthcare");
  },

  async getCredit() {
    return apiFetch<any>("/api/credit");
  },

  async simulatePrepayment(data: { outstanding: number; interestRate: number; currentEmi: number; partPaymentAmount: number }) {
    return apiFetch<any>("/api/loan/prepayment/simulate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getLegacy() {
    return apiFetch<any>("/api/legacy");
  },

  // v4.8.0 AI Financial Operating System Methods
  async getMarket() {
    return apiFetch<any>("/api/market");
  },

  async getWatchlist() {
    return apiFetch<any>("/api/watchlist");
  },

  async addToWatchlist(data: any) {
    return apiFetch<any>("/api/watchlist", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async processDocumentOcr(data: { title: string; category: string; fileUrl?: string; rawContentText?: string }) {
    return apiFetch<any>("/api/documents/ocr", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async importBankStatement(data: { fileName: string; rawContent?: string }) {
    return apiFetch<any>("/api/statements/import", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getAutomation() {
    return apiFetch<any>("/api/automation");
  },

  async getTaxPlanner(fy: string = "FY 2025-26") {
    return apiFetch<any>(`/api/tax/planner?fy=${encodeURIComponent(fy)}`);
  },

  async transferAccounts(data: { fromAccountId: string; toAccountId: string; amount: number; notes?: string }) {
    return apiFetch<any>("/api/accounts/transfer", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async exportBackup() {
    return apiFetch<any>("/api/backup/export");
  },

  async importBackup(data: any) {
    return apiFetch<any>("/api/backup/restore", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};