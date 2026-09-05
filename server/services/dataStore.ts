import fs from 'fs';
import path from 'path';

export interface ExpenseRecord {
  id: string;
  itemName: string;
  category: string;
  subcategory?: string;
  quantity?: number;
  unit?: string;
  totalPrice: number;
  purchaseDate: string;
  usageStartDate?: string;
  usageEndDate?: string;
  durationDays?: number;
  pricePerUnit?: number;
  dailyCost?: number;
  dailyQuantity?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyItemRecord {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  typicalPrice?: number;
  typicalQuantity?: number;
  unit?: string;
  usageTrackingEnabled?: boolean;
  notes?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRecord {
  name: string;
  color: string;
  subcategories: string[];
}

export interface RecurringRecord {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  dueDay?: number;
  dueDate?: string;
  calendarReminderEnabled?: boolean;
  calendarEventId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DataState {
  expenses: ExpenseRecord[];
  monthlyItems: MonthlyItemRecord[];
  categories: CategoryRecord[];
  recurringExpenses: RecurringRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const today = new Date();
const nowIso = today.toISOString();
const formatDate = (daysAgo: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const DEFAULT_CATEGORIES: CategoryRecord[] = [
  {
    name: 'Groceries',
    color: '#10B981',
    subcategories: ['Rice', 'Wheat', 'Dal', 'Milk', 'Vegetables', 'Fruits', 'Cooking Oil', 'Sugar', 'Eggs', 'Snacks', 'Spices', 'Other'],
  },
  {
    name: 'Utilities',
    color: '#3B82F6',
    subcategories: ['Electricity', 'Cooking Gas', 'Water', 'Garbage/Maintenance', 'Other'],
  },
  {
    name: 'Communication',
    color: '#6366F1',
    subcategories: ['WiFi', 'Mobile Recharge', 'Broadband', 'Cable TV', 'Other'],
  },
  {
    name: 'Household',
    color: '#F59E0B',
    subcategories: ['Maid', 'Cleaning', 'Repairs', 'Household Supplies', 'Laundry', 'Other'],
  },
  {
    name: 'Transport',
    color: '#EC4899',
    subcategories: ['Fuel', 'Public Transit', 'Taxi/Cab', 'Vehicle Service', 'Parking', 'Other'],
  },
  {
    name: 'Health',
    color: '#EF4444',
    subcategories: ['Medicines', "Doctor's Visit", 'Lab Tests', 'Fitness/Gym', 'Insurance', 'Other'],
  },
  {
    name: 'Entertainment',
    color: '#8B5CF6',
    subcategories: ['Streaming (Netflix/Prime)', 'Movies', 'Dining Out', 'Games', 'Hobby', 'Other'],
  },
  {
    name: 'Education',
    color: '#06B6D4',
    subcategories: ['School/College Fees', 'Books/Stationery', 'Online Courses', 'Tuition', 'Other'],
  },
  {
    name: 'Shopping',
    color: '#F97316',
    subcategories: ['Clothing', 'Electronics', 'Footwear', 'Personal Care', 'Home Decor', 'Other'],
  },
  {
    name: 'Other',
    color: '#64748B',
    subcategories: ['Gifts/Donations', 'Taxes', 'Miscellaneous'],
  },
];

class DataStore {
  private state: DataState = {
    expenses: [],
    monthlyItems: [],
    categories: DEFAULT_CATEGORIES,
    recurringExpenses: [],
  };
  private isLoaded = false;

  private load() {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.state = {
          expenses: parsed.expenses || [],
          monthlyItems: parsed.monthlyItems || [],
          categories: parsed.categories || DEFAULT_CATEGORIES,
          recurringExpenses: parsed.recurringExpenses || [],
        };
      } else {
        this.save();
      }
    } catch (e) {
      console.warn('DataStore load notice:', e);
    }
    this.isLoaded = true;
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.warn('DataStore save notice:', e);
    }
  }

  // Expenses
  getExpenses(): ExpenseRecord[] {
    this.load();
    return this.state.expenses;
  }

  createExpense(data: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'>): ExpenseRecord {
    this.load();
    const now = new Date().toISOString();
    const newRecord: ExpenseRecord = {
      ...data,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.state.expenses.unshift(newRecord);
    this.save();
    return newRecord;
  }

  updateExpense(id: string, data: Partial<ExpenseRecord>): ExpenseRecord {
    this.load();
    const idx = this.state.expenses.findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new Error(`Expense with id ${id} not found`);
    }
    const updated: ExpenseRecord = {
      ...this.state.expenses[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.state.expenses[idx] = updated;
    this.save();
    return updated;
  }

  deleteExpense(id: string): boolean {
    this.load();
    const initLen = this.state.expenses.length;
    this.state.expenses = this.state.expenses.filter((e) => e.id !== id);
    this.save();
    return this.state.expenses.length < initLen;
  }

  saveExpenseRecord(record: ExpenseRecord): ExpenseRecord {
    this.load();
    const idx = this.state.expenses.findIndex((e) => e.id === record.id);
    if (idx !== -1) {
      this.state.expenses[idx] = record;
    } else {
      this.state.expenses.unshift(record);
    }
    this.save();
    return record;
  }

  saveMonthlyItemRecord(record: MonthlyItemRecord): MonthlyItemRecord {
    this.load();
    const idx = this.state.monthlyItems.findIndex((m) => m.id === record.id);
    if (idx !== -1) {
      this.state.monthlyItems[idx] = record;
    } else {
      this.state.monthlyItems.push(record);
    }
    this.save();
    return record;
  }

  // Monthly Items
  getMonthlyItems(): MonthlyItemRecord[] {
    this.load();
    return this.state.monthlyItems;
  }

  createMonthlyItem(data: Omit<MonthlyItemRecord, 'id' | 'createdAt' | 'updatedAt'>): MonthlyItemRecord {
    this.load();
    const now = new Date().toISOString();
    const newRecord: MonthlyItemRecord = {
      ...data,
      id: `m-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.state.monthlyItems.push(newRecord);
    this.save();
    return newRecord;
  }

  updateMonthlyItem(id: string, data: Partial<MonthlyItemRecord>): MonthlyItemRecord {
    this.load();
    const idx = this.state.monthlyItems.findIndex((m) => m.id === id);
    if (idx === -1) {
      throw new Error(`Monthly item with id ${id} not found`);
    }
    const updated: MonthlyItemRecord = {
      ...this.state.monthlyItems[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.state.monthlyItems[idx] = updated;
    this.save();
    return updated;
  }

  deleteMonthlyItem(id: string): boolean {
    this.load();
    const initLen = this.state.monthlyItems.length;
    this.state.monthlyItems = this.state.monthlyItems.filter((m) => m.id !== id);
    this.save();
    return this.state.monthlyItems.length < initLen;
  }

  // Categories
  getCategories(): CategoryRecord[] {
    this.load();
    return this.state.categories;
  }

  saveCategories(cats: CategoryRecord[]): CategoryRecord[] {
    this.load();
    this.state.categories = cats;
    this.save();
    return this.state.categories;
  }

  // Recurring Expenses
  getRecurringExpenses(): RecurringRecord[] {
    this.load();
    return this.state.recurringExpenses;
  }

  createRecurringExpense(data: Omit<RecurringRecord, 'id' | 'createdAt' | 'updatedAt'>): RecurringRecord {
    this.load();
    const now = new Date().toISOString();
    const newRecord: RecurringRecord = {
      ...data,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.state.recurringExpenses.push(newRecord);
    this.save();
    return newRecord;
  }

  updateRecurringExpense(id: string, data: Partial<RecurringRecord>): RecurringRecord {
    this.load();
    const idx = this.state.recurringExpenses.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error(`Recurring expense with id ${id} not found`);
    }
    const updated: RecurringRecord = {
      ...this.state.recurringExpenses[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.state.recurringExpenses[idx] = updated;
    this.save();
    return updated;
  }

  deleteRecurringExpense(id: string): boolean {
    this.load();
    const initLen = this.state.recurringExpenses.length;
    this.state.recurringExpenses = this.state.recurringExpenses.filter((r) => r.id !== id);
    this.save();
    return this.state.recurringExpenses.length < initLen;
  }
}

export const dataStore = new DataStore();
