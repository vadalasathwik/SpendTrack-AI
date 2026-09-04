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

const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    itemName: 'Rice',
    category: 'Groceries',
    subcategory: 'Rice',
    quantity: 10,
    unit: 'kg',
    totalPrice: 650,
    purchaseDate: formatDate(25),
    usageStartDate: formatDate(25),
    usageEndDate: formatDate(1),
    durationDays: 24,
    pricePerUnit: 65,
    dailyCost: 27.08,
    dailyQuantity: 0.417,
    notes: 'Sona Masoori 10kg bag from supermarket',
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'exp-2',
    itemName: 'Rice',
    category: 'Groceries',
    subcategory: 'Rice',
    quantity: 10,
    unit: 'kg',
    totalPrice: 620,
    purchaseDate: formatDate(54),
    usageStartDate: formatDate(54),
    usageEndDate: formatDate(26),
    durationDays: 28,
    pricePerUnit: 62,
    dailyCost: 22.14,
    dailyQuantity: 0.357,
    notes: 'Previous bag purchase',
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'exp-3',
    itemName: 'Cooking Oil',
    category: 'Groceries',
    subcategory: 'Cooking Oil',
    quantity: 5,
    unit: 'litre',
    totalPrice: 750,
    purchaseDate: formatDate(20),
    usageStartDate: formatDate(20),
    usageEndDate: formatDate(2),
    durationDays: 18,
    pricePerUnit: 150,
    dailyCost: 41.67,
    dailyQuantity: 0.278,
    notes: 'Sunflower Oil 5L can',
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'exp-4',
    itemName: 'WiFi Bill',
    category: 'Communication',
    subcategory: 'WiFi',
    quantity: 1,
    unit: 'month',
    totalPrice: 799,
    purchaseDate: formatDate(10),
    usageStartDate: formatDate(10),
    usageEndDate: formatDate(-20),
    durationDays: 30,
    pricePerUnit: 799,
    dailyCost: 26.63,
    dailyQuantity: 0.033,
    notes: 'Monthly 200Mbps broadband',
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'exp-5',
    itemName: 'LPG Gas Cylinder',
    category: 'Utilities',
    subcategory: 'Cooking Gas',
    quantity: 1,
    unit: 'cylinder',
    totalPrice: 920,
    purchaseDate: formatDate(40),
    usageStartDate: formatDate(40),
    usageEndDate: formatDate(5),
    durationDays: 35,
    pricePerUnit: 920,
    dailyCost: 26.29,
    dailyQuantity: 0.029,
    notes: 'Indane 14.2kg refill',
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'exp-6',
    itemName: 'Electricity Bill',
    category: 'Utilities',
    subcategory: 'Electricity',
    quantity: 1,
    unit: 'bill',
    totalPrice: 1450,
    purchaseDate: formatDate(5),
    notes: 'Monthly state electricity board',
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'exp-7',
    itemName: 'Fresh Milk',
    category: 'Groceries',
    subcategory: 'Milk',
    quantity: 15,
    unit: 'litre',
    totalPrice: 480,
    purchaseDate: formatDate(8),
    usageStartDate: formatDate(8),
    usageEndDate: formatDate(0),
    durationDays: 8,
    pricePerUnit: 32,
    dailyCost: 60,
    dailyQuantity: 1.875,
    notes: 'Half-month dairy subscription',
    createdAt: nowIso,
    updatedAt: nowIso,
  },
];

const INITIAL_RECURRING: RecurringRecord[] = [
  {
    id: 'rec-1',
    name: 'WiFi Broadband Bill',
    category: 'Communication',
    subcategory: 'WiFi',
    amount: 799,
    frequency: 'monthly',
    dueDay: 15,
    dueDate: formatDate(-12),
    calendarReminderEnabled: true,
    notes: 'Airtel Fiber 200 Mbps',
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'rec-2',
    name: 'Maid Salary',
    category: 'Household',
    subcategory: 'Maid',
    amount: 2500,
    frequency: 'monthly',
    dueDay: 1,
    dueDate: formatDate(-25),
    calendarReminderEnabled: true,
    notes: 'Housekeeping and cleaning',
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'rec-3',
    name: 'Electricity Bill',
    category: 'Utilities',
    subcategory: 'Electricity',
    amount: 1400,
    frequency: 'monthly',
    dueDay: 22,
    dueDate: formatDate(-5),
    calendarReminderEnabled: true,
    notes: 'Due before 22nd of every month',
    createdAt: nowIso,
    updatedAt: nowIso,
  },
];

const INITIAL_MONTHLY: MonthlyItemRecord[] = [
  {
    id: 'm-item-1',
    name: 'Cooking Gas',
    category: 'Utilities',
    subcategory: 'Cooking Gas',
    typicalPrice: 1200,
    typicalQuantity: 1,
    unit: 'cylinder',
    usageTrackingEnabled: true,
    notes: 'LPG cylinder for home kitchen',
    isEnabled: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'm-item-2',
    name: 'Rice',
    category: 'Groceries',
    subcategory: 'Rice',
    typicalPrice: 650,
    typicalQuantity: 10,
    unit: 'kg',
    usageTrackingEnabled: true,
    notes: 'Sona Masoori / Basmati rice bag',
    isEnabled: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'm-item-3',
    name: 'Fresh Milk',
    category: 'Groceries',
    subcategory: 'Milk',
    typicalPrice: 480,
    typicalQuantity: 15,
    unit: 'litre',
    usageTrackingEnabled: true,
    notes: 'Daily dairy consumption',
    isEnabled: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'm-item-4',
    name: 'Cooking Oil',
    category: 'Groceries',
    subcategory: 'Cooking Oil',
    typicalPrice: 750,
    typicalQuantity: 5,
    unit: 'litre',
    usageTrackingEnabled: true,
    notes: 'Sunflower / Mustard oil can',
    isEnabled: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'm-item-5',
    name: 'WiFi Broadband',
    category: 'Communication',
    subcategory: 'WiFi',
    typicalPrice: 799,
    typicalQuantity: 1,
    unit: 'month',
    usageTrackingEnabled: true,
    notes: 'Monthly unlimited high-speed fiber',
    isEnabled: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'm-item-6',
    name: 'Electricity Bill',
    category: 'Utilities',
    subcategory: 'Electricity',
    typicalPrice: 1400,
    typicalQuantity: 1,
    unit: 'bill',
    usageTrackingEnabled: false,
    notes: 'Monthly power board utility',
    isEnabled: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
];

class DataStore {
  private state: DataState = {
    expenses: INITIAL_EXPENSES,
    monthlyItems: INITIAL_MONTHLY,
    categories: DEFAULT_CATEGORIES,
    recurringExpenses: INITIAL_RECURRING,
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
          expenses: parsed.expenses || INITIAL_EXPENSES,
          monthlyItems: parsed.monthlyItems || INITIAL_MONTHLY,
          categories: parsed.categories || DEFAULT_CATEGORIES,
          recurringExpenses: parsed.recurringExpenses || INITIAL_RECURRING,
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
