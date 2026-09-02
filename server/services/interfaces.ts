import { Expense, RecurringExpense, CategoryItem, UserSettings, MonthlyItem } from '../../src/types';

export interface ExpenseRepository {
  getExpenses(token: string): Promise<Expense[]>;
  getExpense(token: string, id: string): Promise<Expense | null>;
  createExpense(token: string, expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense>;
  updateExpense(token: string, id: string, expense: Partial<Expense>): Promise<Expense>;
  deleteExpense(token: string, id: string): Promise<boolean>;
}

export interface MonthlyItemRepository {
  getMonthlyItems(token: string): Promise<MonthlyItem[]>;
  createMonthlyItem(token: string, item: Omit<MonthlyItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MonthlyItem>;
  updateMonthlyItem(token: string, id: string, item: Partial<MonthlyItem>): Promise<MonthlyItem>;
  deleteMonthlyItem(token: string, id: string): Promise<boolean>;
}

export interface CategoryRepository {
  getCategories(token: string): Promise<CategoryItem[]>;
  saveCategories(token: string, categories: CategoryItem[]): Promise<CategoryItem[]>;
}

export interface RecurringExpenseRepository {
  getRecurringExpenses(token: string): Promise<RecurringExpense[]>;
  createRecurringExpense(token: string, item: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringExpense>;
  updateRecurringExpense(token: string, id: string, item: Partial<RecurringExpense>): Promise<RecurringExpense>;
  deleteRecurringExpense(token: string, id: string): Promise<boolean>;
}

export interface DriveStorageRepository {
  ensureFolders(token: string): Promise<{
    rootFolderId: string;
    receiptsFolderId: string;
    backupsFolderId: string;
    exportsFolderId: string;
  }>;
  uploadReceipt(token: string, file: { name: string; type: string; base64Data: string }): Promise<{
    fileId: string;
    fileName: string;
    webViewLink: string;
  }>;
  getReceiptFile(token: string, fileId: string): Promise<{
    fileId: string;
    name: string;
    mimeType: string;
    webViewLink: string;
    thumbnailLink?: string;
  }>;
}

export interface CalendarRepository {
  createReminder(token: string, reminder: {
    summary: string;
    description?: string;
    dueDate: string; // YYYY-MM-DD
    frequency: string;
  }): Promise<{ eventId: string; htmlLink?: string }>;
  updateReminder(token: string, eventId: string, reminder: {
    summary: string;
    description?: string;
    dueDate: string;
    frequency: string;
  }): Promise<{ eventId: string }>;
  deleteReminder(token: string, eventId: string): Promise<boolean>;
}
