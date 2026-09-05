import {
  Expense,
  RecurringExpense,
  CategoryItem,
  MonthlyItem,
  ConsumptionLog,
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
  // Workspace
  async checkWorkspaceStatus() {
    return apiFetch<{
      success: boolean;
      spreadsheetId: string;
      driveFolders: any;
    }>("/api/workspace/status");
  },

  async createFamilyWorkspace() {
    return apiFetch<any>("/api/workspace/create", {
      method: "POST",
    });
  },

  async getWorkspaceMembers() {
    return apiFetch<{
      workspace: any;
      members: Array<{
        uid: string;
        email: string;
        name: string;
        photoURL?: string;
        role: string;
        joinedAt: string;
      }>;
      invites: Array<{
        id: string;
        email: string;
        role: string;
        token: string;
        createdAt: string;
        status: string;
      }>;
      currentRole: string;
    }>("/api/workspace/members");
  },

  async inviteWorkspaceMember(
    email: string,
    role: "editor" | "viewer"
  ) {
    return apiFetch<any>("/api/workspace/invite", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  },

  async acceptWorkspaceInvite(token: string) {
    return apiFetch<any>("/api/workspace/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  async removeWorkspaceMember(targetUid: string) {
    return apiFetch<{ success: boolean }>(
      "/api/workspace/member",
      {
        method: "DELETE",
        body: JSON.stringify({ targetUid }),
      }
    );
  },

  // Monthly Items
  async getMonthlyItems(): Promise<MonthlyItem[]> {
    return apiFetch<MonthlyItem[]>("/api/monthly-items");
  },

  async createMonthlyItem(
    item: Omit<
      MonthlyItem,
      "id" | "createdAt" | "updatedAt"
    >
  ): Promise<MonthlyItem> {
    return apiFetch<MonthlyItem>("/api/monthly-items", {
      method: "POST",
      body: JSON.stringify(item),
    });
  },

  async updateMonthlyItem(
    id: string,
    item: Partial<MonthlyItem>
  ): Promise<MonthlyItem> {
    return apiFetch<MonthlyItem>(
      `/api/monthly-items/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(item),
      }
    );
  },

  async deleteMonthlyItem(id: string) {
    return apiFetch<{ success: boolean }>(
      `/api/monthly-items/${id}`,
      {
        method: "DELETE",
      }
    );
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return apiFetch<Expense[]>("/api/expenses");
  },

  async createExpense(
    expense: Omit<
      Expense,
      "id" | "createdAt" | "updatedAt"
    >
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
    return apiFetch<{ success: boolean }>(
      `/api/expenses/${id}`,
      {
        method: "DELETE",
      }
    );
  },

  // Categories
  async getCategories(): Promise<CategoryItem[]> {
    return apiFetch<CategoryItem[]>("/api/categories");
  },

  async saveCategories(categories: CategoryItem[]) {
    return apiFetch<CategoryItem[]>("/api/categories", {
      method: "POST",
      body: JSON.stringify(categories),
    });
  },

  // Recurring Bills
  async getRecurringExpenses(): Promise<
    RecurringExpense[]
  > {
    return apiFetch<RecurringExpense[]>("/api/recurring");
  },

  async createRecurringExpense(
    item: Omit<
      RecurringExpense,
      "id" | "createdAt" | "updatedAt"
    >
  ) {
    return apiFetch<RecurringExpense>("/api/recurring", {
      method: "POST",
      body: JSON.stringify(item),
    });
  },

  async updateRecurringExpense(
    id: string,
    item: Partial<RecurringExpense>
  ) {
    return apiFetch<RecurringExpense>(
      `/api/recurring/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(item),
      }
    );
  },

  async deleteRecurringExpense(
    id: string,
    calendarEventId?: string
  ) {
    const url = calendarEventId
      ? `/api/recurring/${id}?calendarEventId=${encodeURIComponent(
          calendarEventId
        )}`
      : `/api/recurring/${id}`;

    return apiFetch<{ success: boolean }>(url, {
      method: "DELETE",
    });
  },

  async generateDueRecurringExpenses() {
    return apiFetch<{
      success: boolean;
      createdExpenses: Expense[];
      updatedBills: RecurringExpense[];
    }>("/api/recurring/generate-due", {
      method: "POST",
    });
  },

  // Consumption Log
  async getConsumptionLogs(): Promise<ConsumptionLog[]> {
    return apiFetch<ConsumptionLog[]>("/api/consumption-log");
  },

  async createConsumptionLog(
    log: Omit<ConsumptionLog, "id" | "createdAt" | "updatedAt">
  ) {
    return apiFetch<{ log: ConsumptionLog; updatedItem: MonthlyItem | null }>(
      "/api/consumption-log",
      {
        method: "POST",
        body: JSON.stringify(log),
      }
    );
  },

  async deleteConsumptionLog(id: string) {
    return apiFetch<{ success: boolean }>(`/api/consumption-log/${id}`, {
      method: "DELETE",
    });
  },

  // Google Drive
  async uploadReceipt(file: {
    name: string;
    type: string;
    base64Data: string;
  }) {
    return apiFetch<{
      fileId: string;
      fileName: string;
      webViewLink: string;
    }>("/api/drive/upload-receipt", {
      method: "POST",
      body: JSON.stringify(file),
    });
  },

  async getDriveFile(fileId: string) {
    return apiFetch<{
      fileId: string;
      name: string;
      mimeType: string;
      webViewLink: string;
      thumbnailLink?: string;
    }>(`/api/drive/file/${fileId}`);
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

  // Budget AI
  async getBudgetSummary() {
    return apiFetch<any>("/api/budget/summary");
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

  // User Settings (Google Sheets Settings Tab)
  async getSettings(): Promise<Record<string, string>> {
    return apiFetch<Record<string, string>>("/api/settings");
  },

  async saveSettings(settings: Record<string, string>): Promise<Record<string, string>> {
    return apiFetch<Record<string, string>>("/api/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  },
};