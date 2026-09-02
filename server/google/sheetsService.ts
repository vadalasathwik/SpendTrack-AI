import { Expense, CategoryItem, RecurringExpense, MonthlyItem } from '../../src/types.js';
import {
  ExpenseRepository,
  CategoryRepository,
  RecurringExpenseRepository,
  MonthlyItemRepository,
} from '../services/interfaces.js';
import { DEFAULT_CATEGORIES, DEFAULT_MONTHLY_ITEMS } from '../../src/data/defaults.js';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

export class GoogleSheetsService
  implements ExpenseRepository, CategoryRepository, RecurringExpenseRepository, MonthlyItemRepository {
  private async fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Google Sheets API Error (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    return res.json();
  }

  /**
   * Locates or creates a dedicated "SpendTrack" Spreadsheet in the user's Google Drive.
   */
  async getOrCreateSpendTrackSpreadsheet(token: string): Promise<string> {
    // 1. Search for existing spreadsheet titled "SpendTrack"
    const query = `name = 'SpendTrack' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
    const searchUrl = `${DRIVE_API}?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,name)`;
    const searchRes = await this.fetchWithAuth(searchUrl, token);

    if (searchRes.files && searchRes.files.length > 0) {
      return searchRes.files[0].id;
    }

    // 2. Create the Spreadsheet with required sheets
    const createUrl = SHEETS_API;
    const body = {
      properties: {
        title: 'SpendTrack',
      },
      sheets: [
        { properties: { title: 'Expenses', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Categories', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Items', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Recurring Expenses', gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: 'Settings', gridProperties: { frozenRowCount: 1 } } },
      ],
    };

    const spreadsheet = await this.fetchWithAuth(createUrl, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const spreadsheetId = spreadsheet.spreadsheetId;

    // 3. Initialize headers for each sheet
    const expenseHeaders = [
      'id',
      'purchaseDate',
      'itemName',
      'category',
      'subcategory',
      'quantity',
      'unit',
      'totalPrice',
      'usageStartDate',
      'usageEndDate',
      'durationDays',
      'pricePerUnit',
      'dailyCost',
      'dailyQuantity',
      'notes',
      'receiptDriveFileId',
      'receiptFileName',
      'receiptViewLink',
      'calendarEventId',
      'createdAt',
      'updatedAt',
    ];

    const categoryHeaders = ['categoryName', 'color', 'subcategoriesJson'];
    const recurringHeaders = [
      'id',
      'name',
      'category',
      'subcategory',
      'amount',
      'frequency',
      'dueDay',
      'dueDate',
      'notes',
      'calendarReminderEnabled',
      'calendarEventId',
      'lastRecordedDate',
      'createdAt',
      'updatedAt',
    ];
    const settingsHeaders = ['key', 'value'];
    const itemHeaders = [
      'id',
      'name',
      'category',
      'subcategory',
      'typicalPrice',
      'typicalQuantity',
      'unit',
      'usageTrackingEnabled',
      'notes',
      'isEnabled',
      'createdAt',
      'updatedAt',
    ];

    const defaultCategoryRows = DEFAULT_CATEGORIES.map((c) => [
      c.name,
      c.color,
      JSON.stringify(c.subcategories),
    ]);

    const defaultItemRows = DEFAULT_MONTHLY_ITEMS.map((m) => [
      m.id,
      m.name,
      m.category,
      m.subcategory || '',
      m.typicalPrice !== undefined ? m.typicalPrice : '',
      m.typicalQuantity !== undefined ? m.typicalQuantity : '',
      m.unit,
      m.usageTrackingEnabled ? 'TRUE' : 'FALSE',
      m.notes || '',
      m.isEnabled ? 'TRUE' : 'FALSE',
      m.createdAt,
      m.updatedAt,
    ]);

    const batchData = [
      { range: 'Expenses!A1:U1', values: [expenseHeaders] },
      { range: 'Categories!A1:C1', values: [categoryHeaders] },
      { range: `Categories!A2:C${1 + defaultCategoryRows.length}`, values: defaultCategoryRows },
      { range: 'Items!A1:L1', values: [itemHeaders] },
      { range: `Items!A2:L${1 + defaultItemRows.length}`, values: defaultItemRows },
      { range: 'Recurring Expenses!A1:N1', values: [recurringHeaders] },
      { range: 'Settings!A1:B1', values: [settingsHeaders] },
      {
        range: 'Settings!A2:B3',
        values: [
          ['currencySymbol', '₹'],
          ['initializedAt', new Date().toISOString()],
        ],
      },
    ];

    await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values:batchUpdate`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    });

    return spreadsheetId;
  }

  // ==================== EXPENSES ====================

  async getExpenses(token: string): Promise<Expense[]> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const range = 'Expenses!A2:U';
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/${range}`, token);

    const rows = res.values || [];
    return rows.map((row: any[]) => ({
      id: row[0] || '',
      purchaseDate: row[1] || '',
      itemName: row[2] || '',
      category: row[3] || 'Other',
      subcategory: row[4] || '',
      quantity: row[5] !== '' && row[5] !== undefined ? Number(row[5]) : undefined,
      unit: row[6] || '',
      totalPrice: Number(row[7]) || 0,
      usageStartDate: row[8] || '',
      usageEndDate: row[9] || '',
      durationDays: row[10] !== '' && row[10] !== undefined ? Number(row[10]) : undefined,
      pricePerUnit: row[11] !== '' && row[11] !== undefined ? Number(row[11]) : undefined,
      dailyCost: row[12] !== '' && row[12] !== undefined ? Number(row[12]) : undefined,
      dailyQuantity: row[13] !== '' && row[13] !== undefined ? Number(row[13]) : undefined,
      notes: row[14] || '',
      receiptDriveFileId: row[15] || '',
      receiptFileName: row[16] || '',
      receiptViewLink: row[17] || '',
      calendarEventId: row[18] || '',
      createdAt: row[19] || new Date().toISOString(),
      updatedAt: row[20] || new Date().toISOString(),
    })).filter((e: Expense) => e.id && e.itemName);
  }

  async getExpense(token: string, id: string): Promise<Expense | null> {
    const expenses = await this.getExpenses(token);
    return expenses.find((e) => e.id === id) || null;
  }

  async createExpense(
    token: string,
    data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newExpense: Expense = {
      id,
      createdAt: now,
      updatedAt: now,
      ...data,
    };

    const row = [
      newExpense.id,
      newExpense.purchaseDate || '',
      newExpense.itemName || '',
      newExpense.category || 'Other',
      newExpense.subcategory || '',
      newExpense.quantity !== undefined ? newExpense.quantity : '',
      newExpense.unit || '',
      newExpense.totalPrice !== undefined ? newExpense.totalPrice : 0,
      newExpense.usageStartDate || '',
      newExpense.usageEndDate || '',
      newExpense.durationDays !== undefined ? newExpense.durationDays : '',
      newExpense.pricePerUnit !== undefined ? newExpense.pricePerUnit : '',
      newExpense.dailyCost !== undefined ? newExpense.dailyCost : '',
      newExpense.dailyQuantity !== undefined ? newExpense.dailyQuantity : '',
      newExpense.notes || '',
      newExpense.receiptDriveFileId || '',
      newExpense.receiptFileName || '',
      newExpense.receiptViewLink || '',
      newExpense.calendarEventId || '',
      newExpense.createdAt,
      newExpense.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/Expenses!A:U:append?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    );

    return newExpense;
  }

  async updateExpense(token: string, id: string, expenseUpdate: Partial<Expense>): Promise<Expense> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const expenses = await this.getExpenses(token);
    const index = expenses.findIndex((e) => e.id === id);

    if (index === -1) {
      throw new Error(`Expense with ID ${id} not found.`);
    }

    const updatedExpense: Expense = {
      ...expenses[index],
      ...expenseUpdate,
      updatedAt: new Date().toISOString(),
    };

    const rowNumber = index + 2; // header is row 1
    const row = [
      updatedExpense.id,
      updatedExpense.purchaseDate || '',
      updatedExpense.itemName || '',
      updatedExpense.category || 'Other',
      updatedExpense.subcategory || '',
      updatedExpense.quantity !== undefined ? updatedExpense.quantity : '',
      updatedExpense.unit || '',
      updatedExpense.totalPrice !== undefined ? updatedExpense.totalPrice : 0,
      updatedExpense.usageStartDate || '',
      updatedExpense.usageEndDate || '',
      updatedExpense.durationDays !== undefined ? updatedExpense.durationDays : '',
      updatedExpense.pricePerUnit !== undefined ? updatedExpense.pricePerUnit : '',
      updatedExpense.dailyCost !== undefined ? updatedExpense.dailyCost : '',
      updatedExpense.dailyQuantity !== undefined ? updatedExpense.dailyQuantity : '',
      updatedExpense.notes || '',
      updatedExpense.receiptDriveFileId || '',
      updatedExpense.receiptFileName || '',
      updatedExpense.receiptViewLink || '',
      updatedExpense.calendarEventId || '',
      updatedExpense.createdAt,
      updatedExpense.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/Expenses!A${rowNumber}:U${rowNumber}?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    );

    return updatedExpense;
  }

  async deleteExpense(token: string, id: string): Promise<boolean> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const expenses = await this.getExpenses(token);
    const index = expenses.findIndex((e) => e.id === id);

    if (index === -1) {
      return false;
    }

    // Get the sheetId of 'Expenses' tab
    const meta = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`, token);
    const expenseSheet = meta.sheets.find((s: any) => s.properties.title === 'Expenses');
    const sheetId = expenseSheet ? expenseSheet.properties.sheetId : 0;

    const rowNumber = index + 1; // 0-indexed for batchUpdate deleteDimension
    await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowNumber,
                endIndex: rowNumber + 1,
              },
            },
          },
        ],
      }),
    });

    return true;
  }

  // ==================== CATEGORIES ====================

  async getCategories(token: string): Promise<CategoryItem[]> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/Categories!A2:C`, token);

    if (!res.values || res.values.length === 0) {
      return DEFAULT_CATEGORIES;
    }

    return res.values.map((row: any[]) => {
      let subcategories: string[] = [];
      try {
        subcategories = JSON.parse(row[2] || '[]');
      } catch {
        subcategories = (row[2] || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      return {
        name: row[0] || 'General',
        color: row[1] || '#10B981',
        subcategories,
      };
    });
  }

  async saveCategories(token: string, categories: CategoryItem[]): Promise<CategoryItem[]> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    
    // Clear old values
    await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/Categories!A2:C:clear`, token, {
      method: 'POST',
    });

    const rows = categories.map((c) => [c.name, c.color, JSON.stringify(c.subcategories)]);

    if (rows.length > 0) {
      await this.fetchWithAuth(
        `${SHEETS_API}/${spreadsheetId}/values/Categories!A2:C${1 + rows.length}?valueInputOption=USER_ENTERED`,
        token,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: rows }),
        }
      );
    }

    return categories;
  }

  // ==================== RECURRING EXPENSES ====================

  async getRecurringExpenses(token: string): Promise<RecurringExpense[]> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/Recurring Expenses!A2:N`, token);

    const rows = res.values || [];
    return rows.map((row: any[]) => ({
      id: row[0] || '',
      name: row[1] || '',
      category: row[2] || 'Utilities',
      subcategory: row[3] || '',
      amount: Number(row[4]) || 0,
      frequency: (row[5] || 'monthly') as any,
      dueDay: Number(row[6]) || 1,
      dueDate: row[7] || '',
      notes: row[8] || '',
      calendarReminderEnabled: row[9] === 'TRUE' || row[9] === true || row[9] === 'true',
      calendarEventId: row[10] || '',
      lastRecordedDate: row[11] || '',
      createdAt: row[12] || new Date().toISOString(),
      updatedAt: row[13] || new Date().toISOString(),
    })).filter((r: RecurringExpense) => r.id && r.name);
  }

  async createRecurringExpense(
    token: string,
    data: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RecurringExpense> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newRecurring: RecurringExpense = {
      id,
      createdAt: now,
      updatedAt: now,
      ...data,
    };

    const row = [
      newRecurring.id,
      newRecurring.name,
      newRecurring.category,
      newRecurring.subcategory || '',
      newRecurring.amount,
      newRecurring.frequency,
      newRecurring.dueDay,
      newRecurring.dueDate || '',
      newRecurring.notes || '',
      newRecurring.calendarReminderEnabled ? 'TRUE' : 'FALSE',
      newRecurring.calendarEventId || '',
      newRecurring.lastRecordedDate || '',
      newRecurring.createdAt,
      newRecurring.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/Recurring Expenses!A:N:append?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    );

    return newRecurring;
  }

  async updateRecurringExpense(
    token: string,
    id: string,
    data: Partial<RecurringExpense>
  ): Promise<RecurringExpense> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const list = await this.getRecurringExpenses(token);
    const index = list.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error(`Recurring expense with ID ${id} not found.`);
    }

    const updated: RecurringExpense = {
      ...list[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const rowNumber = index + 2;
    const row = [
      updated.id,
      updated.name,
      updated.category,
      updated.subcategory || '',
      updated.amount,
      updated.frequency,
      updated.dueDay,
      updated.dueDate || '',
      updated.notes || '',
      updated.calendarReminderEnabled ? 'TRUE' : 'FALSE',
      updated.calendarEventId || '',
      updated.lastRecordedDate || '',
      updated.createdAt,
      updated.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/Recurring Expenses!A${rowNumber}:N${rowNumber}?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    );

    return updated;
  }

  async deleteRecurringExpense(token: string, id: string): Promise<boolean> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const list = await this.getRecurringExpenses(token);
    const index = list.findIndex((r) => r.id === id);

    if (index === -1) {
      return false;
    }

    const meta = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`, token);
    const recurringSheet = meta.sheets.find((s: any) => s.properties.title === 'Recurring Expenses');
    const sheetId = recurringSheet ? recurringSheet.properties.sheetId : 0;

    const rowNumber = index + 1; // 0-indexed row deletion
    await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowNumber,
                endIndex: rowNumber + 1,
              },
            },
          },
        ],
      }),
    });

    return true;
  }

  // ==================== MONTHLY ITEMS ====================

  async getMonthlyItems(token: string): Promise<MonthlyItem[]> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/Items!A2:L`, token).catch(async () => {
      // If Items sheet doesn't exist yet in legacy spreadsheets, return defaults
      return { values: [] };
    });

    const rows = res.values || [];
    if (rows.length === 0) {
      return DEFAULT_MONTHLY_ITEMS;
    }

    return rows.map((row: any[]) => ({
      id: row[0] || '',
      name: row[1] || '',
      category: row[2] || 'Groceries',
      subcategory: row[3] || '',
      typicalPrice: row[4] !== '' && row[4] !== undefined ? Number(row[4]) : undefined,
      typicalQuantity: row[5] !== '' && row[5] !== undefined ? Number(row[5]) : undefined,
      unit: row[6] || 'unit',
      usageTrackingEnabled: row[7] === 'TRUE' || row[7] === true || row[7] === 'true',
      notes: row[8] || '',
      isEnabled: row[9] !== 'FALSE' && row[9] !== false && row[9] !== 'false',
      createdAt: row[10] || new Date().toISOString(),
      updatedAt: row[11] || new Date().toISOString(),
    })).filter((m: MonthlyItem) => m.id && m.name);
  }

  async createMonthlyItem(
    token: string,
    data: Omit<MonthlyItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MonthlyItem> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newItem: MonthlyItem = {
      id,
      createdAt: now,
      updatedAt: now,
      ...data,
    };

    const row = [
      newItem.id,
      newItem.name,
      newItem.category,
      newItem.subcategory || '',
      newItem.typicalPrice !== undefined ? newItem.typicalPrice : '',
      newItem.typicalQuantity !== undefined ? newItem.typicalQuantity : '',
      newItem.unit,
      newItem.usageTrackingEnabled ? 'TRUE' : 'FALSE',
      newItem.notes || '',
      newItem.isEnabled ? 'TRUE' : 'FALSE',
      newItem.createdAt,
      newItem.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/Items!A:L:append?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    );

    return newItem;
  }

  async updateMonthlyItem(
    token: string,
    id: string,
    data: Partial<MonthlyItem>
  ): Promise<MonthlyItem> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const list = await this.getMonthlyItems(token);
    const index = list.findIndex((m) => m.id === id);

    if (index === -1) {
      throw new Error(`Monthly item with ID ${id} not found.`);
    }

    const updated: MonthlyItem = {
      ...list[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const rowNumber = index + 2;
    const row = [
      updated.id,
      updated.name,
      updated.category,
      updated.subcategory || '',
      updated.typicalPrice !== undefined ? updated.typicalPrice : '',
      updated.typicalQuantity !== undefined ? updated.typicalQuantity : '',
      updated.unit,
      updated.usageTrackingEnabled ? 'TRUE' : 'FALSE',
      updated.notes || '',
      updated.isEnabled ? 'TRUE' : 'FALSE',
      updated.createdAt,
      updated.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/Items!A${rowNumber}:L${rowNumber}?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    );

    return updated;
  }

  async deleteMonthlyItem(token: string, id: string): Promise<boolean> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const list = await this.getMonthlyItems(token);
    const index = list.findIndex((m) => m.id === id);

    if (index === -1) {
      return false;
    }

    const meta = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`, token);
    const itemSheet = meta.sheets.find((s: any) => s.properties.title === 'Items');
    const sheetId = itemSheet ? itemSheet.properties.sheetId : 0;

    const rowNumber = index + 1; // 0-indexed row deletion
    await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowNumber,
                endIndex: rowNumber + 1,
              },
            },
          },
        ],
      }),
    });

    return true;
  }
}
