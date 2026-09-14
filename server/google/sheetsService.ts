import { Expense, CategoryItem, RecurringExpense, MonthlyItem, ConsumptionLog } from '../../src/types.js';
import {
  ExpenseRepository,
  CategoryRepository,
  RecurringExpenseRepository,
  MonthlyItemRepository,
  ConsumptionLogRepository,
} from '../services/interfaces.js';
import { DEFAULT_CATEGORIES } from '../../src/data/defaults.js';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

export class GoogleSheetsService
  implements ExpenseRepository, CategoryRepository, RecurringExpenseRepository, MonthlyItemRepository, ConsumptionLogRepository {
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
      const err: any = new Error(msg);
      err.status = res.status;
      throw err;
    }

    return res.json();
  }

  /**
   * Locates or creates a dedicated "TrackPay Database" Spreadsheet in the user's Google Drive.
   */
  async getOrCreateSpendTrackSpreadsheet(token: string): Promise<string> {
    // 1. Search for existing spreadsheet titled "TrackPay Database", "SpendTrack Database", or legacy names
    const query = `(name = 'TrackPay Database' or name = 'SpendTrack Database' or name = 'TrackPay' or name = 'SpendTrack') and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
    const searchUrl = `${DRIVE_API}?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,name)`;
    const searchRes = await this.fetchWithAuth(searchUrl, token);

    let spreadsheetId = '';

    if (searchRes.files && searchRes.files.length > 0) {
      spreadsheetId = searchRes.files[0].id;
    } else {
      // Create the Spreadsheet with required sheets
      const createUrl = SHEETS_API;
      const body = {
        properties: {
          title: 'TrackPay Database',
        },
        sheets: [
          { properties: { title: 'Expenses', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'Categories', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'Monthly Items', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'Recurring Bills', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'ConsumptionLog', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'Settings', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'AIChatHistory', gridProperties: { frozenRowCount: 1 } } },
          { properties: { title: 'Notifications', gridProperties: { frozenRowCount: 1 } } },
        ],
      };

      const spreadsheet = await this.fetchWithAuth(createUrl, token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      spreadsheetId = spreadsheet.spreadsheetId;

      // Initialize headers for new spreadsheet
      const defaultCategoryRows = DEFAULT_CATEGORIES.map((c) => [
        c.name,
        c.color,
        JSON.stringify(c.subcategories),
      ]);

      const batchData = [
        {
          range: 'Expenses!A1:W1',
          values: [
            [
              'id', 'purchaseDate', 'itemName', 'category', 'subcategory', 'quantity', 'unit',
              'totalPrice', 'usageStartDate', 'usageEndDate', 'durationDays', 'pricePerUnit',
              'dailyCost', 'dailyQuantity', 'notes', 'receiptDriveFileId', 'receiptFileName',
              'receiptViewLink', 'calendarEventId', 'source', 'recurringId', 'createdAt', 'updatedAt',
            ],
          ],
        },
        { range: 'Categories!A1:C1', values: [['categoryName', 'color', 'subcategoriesJson']] },
        { range: `Categories!A2:C${1 + defaultCategoryRows.length}`, values: defaultCategoryRows },
        {
          range: '\'Monthly Items\'!A1:R1',
          values: [
            [
              'id', 'name', 'category', 'subcategory', 'typicalPrice', 'typicalQuantity',
              'unit', 'usageTrackingEnabled', 'purchasedDate', 'startUsingDate',
              'quantityPurchased', 'openingStock', 'remainingQuantity', 'minimumThreshold',
              'notes', 'isEnabled', 'createdAt', 'updatedAt',
            ],
          ],
        },
        {
          range: '\'Recurring Bills\'!A1:R1',
          values: [
            [
              'id', 'name', 'category', 'subcategory', 'amount', 'frequency', 'dueDay',
              'dueDate', 'autopost', 'reminderDays', 'isActive', 'lastGeneratedMonth',
              'notes', 'calendarReminderEnabled', 'calendarEventId', 'lastRecordedDate',
              'createdAt', 'updatedAt',
            ],
          ],
        },
        {
          range: 'ConsumptionLog!A1:I1',
          values: [
            ['id', 'itemId', 'itemName', 'consumedQuantity', 'unit', 'consumedDate', 'notes', 'createdAt', 'updatedAt'],
          ],
        },
        {
          range: 'AIChatHistory!A1:E1',
          values: [['chatId', 'messageId', 'role', 'message', 'timestamp']],
        },
        {
          range: 'Notifications!A1:F1',
          values: [['id', 'type', 'title', 'message', 'createdAt', 'read']],
        },
        { range: 'Settings!A1:B1', values: [['key', 'value']] },
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

    // Ensure ConsumptionLog & Settings tabs exist in existing spreadsheet
    try {
      const meta = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}?fields=sheets.properties.title`, token);
      const existingTitles = (meta.sheets || []).map((s: any) => s.properties.title);
      if (!existingTitles.includes('ConsumptionLog')) {
        await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: 'ConsumptionLog', gridProperties: { frozenRowCount: 1 } } } }],
          }),
        });
        await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/ConsumptionLog!A1:I1?valueInputOption=USER_ENTERED`, token, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            values: [['id', 'itemId', 'itemName', 'consumedQuantity', 'unit', 'consumedDate', 'notes', 'createdAt', 'updatedAt']],
          }),
        });
      }

      if (!existingTitles.includes('Settings')) {
        await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: 'Settings', gridProperties: { frozenRowCount: 1 } } } }],
          }),
        });
        await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/Settings!A1:B1?valueInputOption=USER_ENTERED`, token, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            values: [['key', 'value']],
          }),
        });
      }

      if (!existingTitles.includes('AIChatHistory')) {
        await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: 'AIChatHistory', gridProperties: { frozenRowCount: 1 } } } }],
          }),
        });
        await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/AIChatHistory!A1:E1?valueInputOption=USER_ENTERED`, token, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            values: [['chatId', 'messageId', 'role', 'message', 'timestamp']],
          }),
        });
      }

      if (!existingTitles.includes('Notifications')) {
        await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: 'Notifications', gridProperties: { frozenRowCount: 1 } } } }],
          }),
        });
        await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/Notifications!A1:F1?valueInputOption=USER_ENTERED`, token, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            values: [['id', 'type', 'title', 'message', 'createdAt', 'read']],
          }),
        });
      }
    } catch (e) {
      console.warn('Tab verification notice:', e);
    }

    return spreadsheetId;
  }

  // ==================== EXPENSES ====================

  async getExpenses(token: string): Promise<Expense[]> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const range = 'Expenses!A2:W';
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
      source: row[19] || undefined,
      recurringId: row[20] || undefined,
      createdAt: row[21] || new Date().toISOString(),
      updatedAt: row[22] || new Date().toISOString(),
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
      newExpense.source || '',
      newExpense.recurringId || '',
      newExpense.createdAt,
      newExpense.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/Expenses!A:W:append?valueInputOption=USER_ENTERED`,
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
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/Expenses!A2:W`, token);
    const rawRows = res.values || [];
    const rowIndex = rawRows.findIndex((r: any[]) => r && r[0] === id);

    if (rowIndex === -1) {
      throw new Error(`Expense with ID ${id} not found.`);
    }

    const currentExpense = (await this.getExpenses(token)).find((e) => e.id === id) || { id };

    const updatedExpense: Expense = {
      ...currentExpense as Expense,
      ...expenseUpdate,
      updatedAt: new Date().toISOString(),
    };

    const rowNumber = rowIndex + 2;
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
      updatedExpense.source || '',
      updatedExpense.recurringId || '',
      updatedExpense.createdAt,
      updatedExpense.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/Expenses!A${rowNumber}:W${rowNumber}?valueInputOption=USER_ENTERED`,
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
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/Expenses!A2:W`, token);
    const rawRows = res.values || [];
    const rowIndex = rawRows.findIndex((r: any[]) => r && r[0] === id);

    if (rowIndex === -1) {
      return false;
    }

    const meta = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`, token);
    const expenseSheet = meta.sheets.find((s: any) => s.properties.title === 'Expenses');
    const sheetId = expenseSheet ? expenseSheet.properties.sheetId : 0;

    const rowNumber = rowIndex + 1;
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

  // ==================== RECURRING EXPENSES / BILLS ====================

  async getRecurringExpenses(token: string): Promise<RecurringExpense[]> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/'Recurring Bills'!A2:R`, token).catch(async () => {
      return this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/'Recurring Expenses'!A2:R`, token);
    });

    const rows = res.values || [];
    return rows.map((row: any[], index: number) => ({
      id: row[0] || `rec_${index + 1}`,
      rowIndex: index + 2,
      name: row[1] || '',
      title: row[1] || '',
      category: row[2] || 'Utilities',
      subcategory: row[3] || '',
      amount: Number(row[4]) || 0,
      frequency: (row[5] || 'monthly') as any,
      dueDay: Number(row[6]) || 1,
      dueDate: row[7] || '',
      autopost: row[8] === 'TRUE' || row[8] === true || row[8] === 'true',
      reminderDays: row[9] !== '' && row[9] !== undefined ? Number(row[9]) : 3,
      isActive: row[10] !== 'FALSE' && row[10] !== false && row[10] !== 'false',
      lastGeneratedMonth: row[11] || '',
      notes: row[12] || '',
      calendarReminderEnabled: row[13] === 'TRUE' || row[13] === true || row[13] === 'true',
      calendarEventId: row[14] || '',
      lastRecordedDate: row[15] || '',
      createdAt: row[16] || new Date().toISOString(),
      updatedAt: row[17] || new Date().toISOString(),
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
      autopost: true,
      isActive: true,
      reminderDays: 3,
      ...data,
    };

    const row = [
      newRecurring.id,
      newRecurring.name || newRecurring.title || '',
      newRecurring.category,
      newRecurring.subcategory || '',
      newRecurring.amount,
      newRecurring.frequency,
      newRecurring.dueDay,
      newRecurring.dueDate || '',
      newRecurring.autopost ? 'TRUE' : 'FALSE',
      newRecurring.reminderDays !== undefined ? newRecurring.reminderDays : 3,
      newRecurring.isActive ? 'TRUE' : 'FALSE',
      newRecurring.lastGeneratedMonth || '',
      newRecurring.notes || '',
      newRecurring.calendarReminderEnabled ? 'TRUE' : 'FALSE',
      newRecurring.calendarEventId || '',
      newRecurring.lastRecordedDate || '',
      newRecurring.createdAt,
      newRecurring.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/'Recurring Bills'!A:R:append?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    ).catch(async () => {
      return this.fetchWithAuth(
        `${SHEETS_API}/${spreadsheetId}/values/'Recurring Expenses'!A:R:append?valueInputOption=USER_ENTERED`,
        token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [row] }),
        }
      );
    });

    return newRecurring;
  }

  async updateRecurringExpense(
    token: string,
    id: string,
    data: Partial<RecurringExpense>
  ): Promise<RecurringExpense> {
    try {
      const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
      let sheetName = 'Recurring Bills';
      const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/'Recurring Bills'!A2:R`, token).catch(async () => {
        sheetName = 'Recurring Expenses';
        return this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/'Recurring Expenses'!A2:R`, token);
      });
      const rawRows = res.values || [];

      // 1. Determine target rowIndex
      let targetRowIndex = -1;

      // Check provided rowIndex
      if (data.rowIndex && data.rowIndex >= 2 && data.rowIndex <= rawRows.length + 1) {
        targetRowIndex = data.rowIndex - 2;
      }

      // Check ID match
      if (targetRowIndex === -1 && id) {
        targetRowIndex = rawRows.findIndex((r: any[]) => r && (r[0] === id || `rec_${id}` === r[0]));
      }

      // Check 4-way attribute match (Name + Category + DueDay + Amount)
      if (targetRowIndex === -1 && (data.name || data.title)) {
        const targetName = (data.name || data.title || '').trim().toLowerCase();
        const targetCategory = (data.category || '').trim().toLowerCase();

        targetRowIndex = rawRows.findIndex((r: any[]) => {
          if (!r || !r[1]) return false;
          const rName = (r[1] || '').trim().toLowerCase();
          const rCategory = (r[2] || '').trim().toLowerCase();
          const rAmount = Number(r[4]) || 0;
          const rDueDay = Number(r[6]) || 1;

          const sameName = rName === targetName;
          const sameCategory = !targetCategory || rCategory === targetCategory;
          const sameDue = !data.dueDay || rDueDay === Number(data.dueDay);
          const sameAmt = !data.amount || Math.abs(rAmount - Number(data.amount)) < 0.01;

          return sameName && sameCategory && sameDue && sameAmt;
        });

        // Fallback to Name + Category match
        if (targetRowIndex === -1) {
          targetRowIndex = rawRows.findIndex((r: any[]) => {
            if (!r || !r[1]) return false;
            const rName = (r[1] || '').trim().toLowerCase();
            const rCategory = (r[2] || '').trim().toLowerCase();
            return rName === targetName && (!targetCategory || rCategory === targetCategory);
          });
        }

        // Fallback to Name only
        if (targetRowIndex === -1) {
          targetRowIndex = rawRows.findIndex((r: any[]) => {
            if (!r || !r[1]) return false;
            return (r[1] || '').trim().toLowerCase() === targetName;
          });
        }
      }

      // Default to first row if rows exist
      if (targetRowIndex === -1) {
        if (rawRows.length > 0) {
          targetRowIndex = 0;
        } else {
          throw new Error('Unable to update recurring bill.');
        }
      }

      const rowNumber = targetRowIndex + 2;
      const existingRow = [...(rawRows[targetRowIndex] || [])];
      while (existingRow.length < 18) existingRow.push('');

      // Modify only specified fields & preserve every other column
      const updatedRow = [...existingRow];
      if (data.id) updatedRow[0] = data.id;
      if (data.name || data.title) updatedRow[1] = data.name || data.title;
      if (data.category) updatedRow[2] = data.category;
      if (data.subcategory !== undefined) updatedRow[3] = data.subcategory;
      if (data.amount !== undefined) updatedRow[4] = data.amount;
      if (data.frequency) updatedRow[5] = data.frequency;
      if (data.dueDay !== undefined) updatedRow[6] = data.dueDay;
      if (data.dueDate !== undefined) updatedRow[7] = data.dueDate;
      if (data.autopost !== undefined) updatedRow[8] = data.autopost ? 'TRUE' : 'FALSE';
      if (data.reminderDays !== undefined) updatedRow[9] = data.reminderDays;
      if (data.isActive !== undefined) updatedRow[10] = data.isActive ? 'TRUE' : 'FALSE';
      if (data.lastGeneratedMonth !== undefined) updatedRow[11] = data.lastGeneratedMonth;
      if (data.notes !== undefined) updatedRow[12] = data.notes;
      if (data.calendarReminderEnabled !== undefined) updatedRow[13] = data.calendarReminderEnabled ? 'TRUE' : 'FALSE';
      if (data.calendarEventId !== undefined) updatedRow[14] = data.calendarEventId;
      if (data.lastRecordedDate !== undefined) updatedRow[15] = data.lastRecordedDate;
      if (!updatedRow[16]) updatedRow[16] = new Date().toISOString();
      updatedRow[17] = new Date().toISOString();

      await this.fetchWithAuth(
        `${SHEETS_API}/${spreadsheetId}/values/'${sheetName}'!A${rowNumber}:R${rowNumber}?valueInputOption=USER_ENTERED`,
        token,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [updatedRow] }),
        }
      ).catch(async () => {
        return this.fetchWithAuth(
          `${SHEETS_API}/${spreadsheetId}/values/'Recurring Expenses'!A${rowNumber}:R${rowNumber}?valueInputOption=USER_ENTERED`,
          token,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [updatedRow] }),
          }
        );
      });

      const updatedBill: RecurringExpense = {
        id: String(updatedRow[0] || id),
        rowIndex: rowNumber,
        name: String(updatedRow[1] || data.name || 'Recurring Bill'),
        title: String(updatedRow[1] || data.name || 'Recurring Bill'),
        category: String(updatedRow[2] || 'Utilities'),
        subcategory: String(updatedRow[3] || ''),
        amount: Number(updatedRow[4]) || 0,
        frequency: (updatedRow[5] || 'monthly') as any,
        dueDay: Number(updatedRow[6]) || 1,
        dueDate: String(updatedRow[7] || ''),
        autopost: updatedRow[8] === 'TRUE' || updatedRow[8] === true,
        reminderDays: Number(updatedRow[9]) || 3,
        isActive: updatedRow[10] !== 'FALSE' && updatedRow[10] !== false,
        lastGeneratedMonth: String(updatedRow[11] || ''),
        notes: String(updatedRow[12] || ''),
        calendarReminderEnabled: updatedRow[13] === 'TRUE' || updatedRow[13] === true,
        calendarEventId: String(updatedRow[14] || ''),
        lastRecordedDate: String(updatedRow[15] || ''),
        createdAt: String(updatedRow[16] || new Date().toISOString()),
        updatedAt: String(updatedRow[17] || new Date().toISOString()),
        isPaid: data.isPaid !== undefined ? data.isPaid : true,
        paidDate: data.paidDate || new Date().toISOString().split('T')[0],
      };

      return updatedBill;
    } catch (err: any) {
      console.error('Error in updateRecurringExpense:', err);
      throw new Error('Unable to update recurring bill.');
    }
  }

  async deleteRecurringExpense(token: string, id: string): Promise<boolean> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/'Recurring Bills'!A2:R`, token).catch(async () => {
      return this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/'Recurring Expenses'!A2:R`, token);
    });
    const rawRows = res.values || [];
    const rowIndex = rawRows.findIndex((r: any[]) => r && r[0] === id);

    if (rowIndex === -1) {
      return false;
    }

    const meta = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`, token);
    const recurringSheet = meta.sheets.find((s: any) => s.properties.title === 'Recurring Bills' || s.properties.title === 'Recurring Expenses');
    const sheetId = recurringSheet ? recurringSheet.properties.sheetId : 0;

    const rowNumber = rowIndex + 1;
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
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/'Monthly Items'!A2:R`, token).catch(async () => {
      return this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/Items!A2:R`, token).catch(async () => ({ values: [] }));
    });

    const rows = res.values || [];
    return rows.map((row: any[]) => ({
      id: row[0] || '',
      name: row[1] || '',
      category: row[2] || 'Groceries',
      subcategory: row[3] || '',
      typicalPrice: row[4] !== '' && row[4] !== undefined ? Number(row[4]) : undefined,
      typicalQuantity: row[5] !== '' && row[5] !== undefined ? Number(row[5]) : undefined,
      unit: row[6] || 'unit',
      usageTrackingEnabled: row[7] === 'TRUE' || row[7] === true || row[7] === 'true',
      purchasedDate: row[8] || '',
      startUsingDate: row[9] || '',
      quantityPurchased: row[10] !== '' && row[10] !== undefined ? Number(row[10]) : undefined,
      openingStock: row[11] !== '' && row[11] !== undefined ? Number(row[11]) : undefined,
      remainingQuantity: row[12] !== '' && row[12] !== undefined ? Number(row[12]) : undefined,
      minimumThreshold: row[13] !== '' && row[13] !== undefined ? Number(row[13]) : undefined,
      notes: row[14] || '',
      isEnabled: row[15] !== 'FALSE' && row[15] !== false && row[15] !== 'false',
      createdAt: row[16] || new Date().toISOString(),
      updatedAt: row[17] || new Date().toISOString(),
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
      isEnabled: true,
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
      newItem.purchasedDate || '',
      newItem.startUsingDate || '',
      newItem.quantityPurchased !== undefined ? newItem.quantityPurchased : '',
      newItem.openingStock !== undefined ? newItem.openingStock : '',
      newItem.remainingQuantity !== undefined ? newItem.remainingQuantity : '',
      newItem.minimumThreshold !== undefined ? newItem.minimumThreshold : '',
      newItem.notes || '',
      newItem.isEnabled ? 'TRUE' : 'FALSE',
      newItem.createdAt,
      newItem.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/'Monthly Items'!A:R:append?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    ).catch(async () => {
      return this.fetchWithAuth(
        `${SHEETS_API}/${spreadsheetId}/values/Items!A:R:append?valueInputOption=USER_ENTERED`,
        token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [row] }),
        }
      );
    });

    return newItem;
  }

  async updateMonthlyItem(
    token: string,
    id: string,
    data: Partial<MonthlyItem>
  ): Promise<MonthlyItem> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/'Monthly Items'!A2:R`, token).catch(async () => {
      return this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/Items!A2:R`, token);
    });
    const rawRows = res.values || [];
    const rowIndex = rawRows.findIndex((r: any[]) => r && r[0] === id);

    if (rowIndex === -1) {
      throw new Error(`Monthly item with ID ${id} not found.`);
    }

    const current = (await this.getMonthlyItems(token)).find((m) => m.id === id) || { id };

    const updated: MonthlyItem = {
      ...current as MonthlyItem,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const rowNumber = rowIndex + 2;
    const row = [
      updated.id,
      updated.name,
      updated.category,
      updated.subcategory || '',
      updated.typicalPrice !== undefined ? updated.typicalPrice : '',
      updated.typicalQuantity !== undefined ? updated.typicalQuantity : '',
      updated.unit,
      updated.usageTrackingEnabled ? 'TRUE' : 'FALSE',
      updated.purchasedDate || '',
      updated.startUsingDate || '',
      updated.quantityPurchased !== undefined ? updated.quantityPurchased : '',
      updated.openingStock !== undefined ? updated.openingStock : '',
      updated.remainingQuantity !== undefined ? updated.remainingQuantity : '',
      updated.minimumThreshold !== undefined ? updated.minimumThreshold : '',
      updated.notes || '',
      updated.isEnabled ? 'TRUE' : 'FALSE',
      updated.createdAt,
      updated.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/'Monthly Items'!A${rowNumber}:R${rowNumber}?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    ).catch(async () => {
      return this.fetchWithAuth(
        `${SHEETS_API}/${spreadsheetId}/values/Items!A${rowNumber}:R${rowNumber}?valueInputOption=USER_ENTERED`,
        token,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [row] }),
        }
      );
    });

    return updated;
  }

  async deleteMonthlyItem(token: string, id: string): Promise<boolean> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/'Monthly Items'!A2:R`, token).catch(async () => {
      return this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/Items!A2:R`, token);
    });
    const rawRows = res.values || [];
    const rowIndex = rawRows.findIndex((r: any[]) => r && r[0] === id);

    if (rowIndex === -1) {
      return false;
    }

    const meta = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`, token);
    const itemSheet = meta.sheets.find((s: any) => s.properties.title === 'Monthly Items' || s.properties.title === 'Items');
    const sheetId = itemSheet ? itemSheet.properties.sheetId : 0;

    const rowNumber = rowIndex + 1;
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

  // ==================== CONSUMPTION LOG ====================

  async getConsumptionLogs(token: string): Promise<ConsumptionLog[]> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/ConsumptionLog!A2:I`, token).catch(() => ({ values: [] }));

    const rows = res.values || [];
    return rows.map((row: any[]) => ({
      id: row[0] || '',
      itemId: row[1] || '',
      itemName: row[2] || '',
      consumedQuantity: Number(row[3]) || 0,
      unit: row[4] || '',
      consumedDate: row[5] || '',
      notes: row[6] || '',
      createdAt: row[7] || new Date().toISOString(),
      updatedAt: row[8] || new Date().toISOString(),
    })).filter((c: ConsumptionLog) => c.id && c.itemName);
  }

  async createConsumptionLog(
    token: string,
    data: Omit<ConsumptionLog, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ConsumptionLog> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const id = `clog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newLog: ConsumptionLog = {
      id,
      createdAt: now,
      updatedAt: now,
      ...data,
    };

    const row = [
      newLog.id,
      newLog.itemId || '',
      newLog.itemName || '',
      newLog.consumedQuantity,
      newLog.unit || '',
      newLog.consumedDate || '',
      newLog.notes || '',
      newLog.createdAt,
      newLog.updatedAt,
    ];

    await this.fetchWithAuth(
      `${SHEETS_API}/${spreadsheetId}/values/ConsumptionLog!A:I:append?valueInputOption=USER_ENTERED`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    );

    return newLog;
  }

  async deleteConsumptionLog(token: string, id: string): Promise<boolean> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const res = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}/values/ConsumptionLog!A2:I`, token);
    const rawRows = res.values || [];
    const rowIndex = rawRows.findIndex((r: any[]) => r && r[0] === id);

    if (rowIndex === -1) {
      return false;
    }

    const meta = await this.fetchWithAuth(`${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`, token);
    const sheetObj = meta.sheets.find((s: any) => s.properties.title === 'ConsumptionLog');
    const sheetId = sheetObj ? sheetObj.properties.sheetId : 0;

    const rowNumber = rowIndex + 1;
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

  // ==================== SETTINGS ====================

  async getSettings(token: string): Promise<Record<string, string>> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const url = `${SHEETS_API}/${spreadsheetId}/values/Settings!A2:B`;
    try {
      const res = await this.fetchWithAuth(url, token);
      const rows = res.values || [];
      const settings: Record<string, string> = {};
      for (const row of rows) {
        if (row && row[0]) {
          settings[row[0].trim()] = (row[1] || '').trim();
        }
      }
      return settings;
    } catch (err) {
      console.warn('Failed to read Settings tab from Google Sheets:', err);
      return {};
    }
  }

  async saveSettings(token: string, settings: Record<string, string>): Promise<Record<string, string>> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const current = await this.getSettings(token);
    const updatedMap = { ...current, ...settings };

    const rows: string[][] = Object.entries(updatedMap).map(([k, v]) => [k, String(v)]);

    // Clear existing Settings!A2:B rows
    const clearUrl = `${SHEETS_API}/${spreadsheetId}/values/Settings!A2:B:clear`;
    try {
      await this.fetchWithAuth(clearUrl, token, { method: 'POST' });
    } catch (e) {
      console.warn('Clear settings notice:', e);
    }

    if (rows.length > 0) {
      const updateUrl = `${SHEETS_API}/${spreadsheetId}/values/Settings!A2:B${rows.length + 1}?valueInputOption=USER_ENTERED`;
      await this.fetchWithAuth(updateUrl, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rows }),
      });
    }

    return updatedMap;
  }

  // ==================== AI CHAT HISTORY ====================

  async getAIChatHistory(token: string): Promise<Array<{ chatId: string; messageId: string; role: string; message: string; timestamp: string }>> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const url = `${SHEETS_API}/${spreadsheetId}/values/AIChatHistory!A2:E`;
    try {
      const res = await this.fetchWithAuth(url, token);
      const rows = res.values || [];
      return rows.map((row: any[]) => ({
        chatId: row[0] || '',
        messageId: row[1] || '',
        role: row[2] || 'user',
        message: row[3] || '',
        timestamp: row[4] || new Date().toISOString(),
      })).filter((r) => r.chatId && r.message);
    } catch (err) {
      console.warn('Failed to read AIChatHistory tab from Google Sheets:', err);
      return [];
    }
  }

  async saveAIChatMessage(
    token: string,
    data: { chatId: string; messageId?: string; role: string; message: string; timestamp?: string }
  ): Promise<{ chatId: string; messageId: string; role: string; message: string; timestamp: string }> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const messageId = data.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = data.timestamp || new Date().toISOString();
    const row = [data.chatId, messageId, data.role, data.message, timestamp];

    const appendUrl = `${SHEETS_API}/${spreadsheetId}/values/AIChatHistory!A2:E:append?valueInputOption=USER_ENTERED`;
    await this.fetchWithAuth(appendUrl, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    });

    return { chatId: data.chatId, messageId, role: data.role, message: data.message, timestamp };
  }

  async deleteAIChat(token: string, chatId: string): Promise<void> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const history = await this.getAIChatHistory(token);
    const remaining = history.filter((h) => h.chatId !== chatId);

    const clearUrl = `${SHEETS_API}/${spreadsheetId}/values/AIChatHistory!A2:E:clear`;
    try {
      await this.fetchWithAuth(clearUrl, token, { method: 'POST' });
    } catch (e) {
      console.warn('Clear chat history notice:', e);
    }

    if (remaining.length > 0) {
      const rows = remaining.map((r) => [r.chatId, r.messageId, r.role, r.message, r.timestamp]);
      const updateUrl = `${SHEETS_API}/${spreadsheetId}/values/AIChatHistory!A2:E${rows.length + 1}?valueInputOption=USER_ENTERED`;
      await this.fetchWithAuth(updateUrl, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rows }),
      });
    }
  }

  // ==================== NOTIFICATIONS ====================

  async getNotifications(token: string): Promise<Array<{ id: string; type: string; title: string; message: string; createdAt: string; read: boolean }>> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const url = `${SHEETS_API}/${spreadsheetId}/values/Notifications!A2:F`;
    try {
      const res = await this.fetchWithAuth(url, token);
      const rows = res.values || [];
      return rows.map((row: any[]) => ({
        id: row[0] || '',
        type: row[1] || 'bill_upcoming',
        title: row[2] || '',
        message: row[3] || '',
        createdAt: row[4] || new Date().toISOString(),
        read: row[5] === 'true',
      })).filter((n) => n.id && n.title);
    } catch (err) {
      console.warn('Failed to read Notifications tab from Google Sheets:', err);
      return [];
    }
  }

  async saveNotification(
    token: string,
    notif: { id?: string; type: string; title: string; message: string; createdAt?: string; read?: boolean }
  ): Promise<{ id: string; type: string; title: string; message: string; createdAt: string; read: boolean }> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const id = notif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = notif.createdAt || new Date().toISOString();
    const read = notif.read ?? false;

    // Check if notification with same ID already exists
    const existing = await this.getNotifications(token);
    if (existing.some((n) => n.id === id)) {
      return this.updateNotification(token, id, { read });
    }

    const row = [id, notif.type, notif.title, notif.message, createdAt, read ? 'true' : 'false'];
    const appendUrl = `${SHEETS_API}/${spreadsheetId}/values/Notifications!A2:F:append?valueInputOption=USER_ENTERED`;
    await this.fetchWithAuth(appendUrl, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    });

    return { id, type: notif.type, title: notif.title, message: notif.message, createdAt, read };
  }

  async updateNotification(
    token: string,
    id: string,
    updates: Partial<{ read: boolean }>
  ): Promise<{ id: string; type: string; title: string; message: string; createdAt: string; read: boolean }> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const list = await this.getNotifications(token);
    let updatedNotif = list.find((n) => n.id === id);

    if (updatedNotif) {
      if (updates.read !== undefined) updatedNotif.read = updates.read;
      const rows = list.map((n) => [n.id, n.type, n.title, n.message, n.createdAt, n.read ? 'true' : 'false']);
      const clearUrl = `${SHEETS_API}/${spreadsheetId}/values/Notifications!A2:F:clear`;
      try {
        await this.fetchWithAuth(clearUrl, token, { method: 'POST' });
      } catch (e) {
        console.warn('Clear notifications notice:', e);
      }
      const updateUrl = `${SHEETS_API}/${spreadsheetId}/values/Notifications!A2:F${rows.length + 1}?valueInputOption=USER_ENTERED`;
      await this.fetchWithAuth(updateUrl, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rows }),
      });
    }

    return updatedNotif || { id, type: 'bill_upcoming', title: '', message: '', createdAt: new Date().toISOString(), read: !!updates.read };
  }

  async deleteNotification(token: string, id: string): Promise<void> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const list = await this.getNotifications(token);
    const remaining = list.filter((n) => n.id !== id);

    const clearUrl = `${SHEETS_API}/${spreadsheetId}/values/Notifications!A2:F:clear`;
    try {
      await this.fetchWithAuth(clearUrl, token, { method: 'POST' });
    } catch (e) {
      console.warn('Clear notifications notice:', e);
    }

    if (remaining.length > 0) {
      const rows = remaining.map((n) => [n.id, n.type, n.title, n.message, n.createdAt, n.read ? 'true' : 'false']);
      const updateUrl = `${SHEETS_API}/${spreadsheetId}/values/Notifications!A2:F${rows.length + 1}?valueInputOption=USER_ENTERED`;
      await this.fetchWithAuth(updateUrl, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rows }),
      });
    }
  }

  async clearAllNotifications(token: string): Promise<void> {
    const spreadsheetId = await this.getOrCreateSpendTrackSpreadsheet(token);
    const clearUrl = `${SHEETS_API}/${spreadsheetId}/values/Notifications!A2:F:clear`;
    try {
      await this.fetchWithAuth(clearUrl, token, { method: 'POST' });
    } catch (e) {
      console.warn('Clear all notifications notice:', e);
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
