import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Repeat,
  Settings,
  Plus,
  TrendingUp,
  Sparkles,
  Layers,
  LogOut,
  LogIn,
  RefreshCw,
  ShoppingCart,
  Bot,
  Menu,
  Users,
  Bell,
  User,
} from 'lucide-react';
import {
  Expense,
  RecurringExpense,
  CategoryItem,
  DateRange,
  SyncStatus,
  MonthlyItem,
  ConsumptionLog,
  AppNotification,
  UserSettings,
} from './types.js';
import {
  DEFAULT_CATEGORIES,
} from './data/defaults.js';
import { getDateRangeFromPreset } from './utils/dateRanges.js';
import { calculateMonthlyItemIntelligence } from './utils/calculations.js';
import { SpendTrackApi } from './services/api.js';
import { signInWithGoogle, signOutApp, onAuthStateChange } from './services/authService.js';
import { BRAND_NAME } from './constants/brand.js';

// UI Components
import { SyncStatusBadge } from './components/SyncStatusBadge.js';
import { DateRangePicker } from './components/DateRangePicker.js';
import { AddExpenseModal } from './components/AddExpenseModal.js';
import { MobileMoreDrawer } from './components/MobileMoreDrawer.js';
import { ProvisioningProgressModal } from './components/ProvisioningProgressModal.js';
import { ReceiptScannerModal } from './components/ReceiptScannerModal.js';
import { PWAInstallPrompt } from './components/PWAInstallPrompt.js';
import { NotificationDrawer } from './components/NotificationDrawer.js';
import { ConsumeQuantityModal } from './components/ConsumeQuantityModal.js';
import { BudgetOnboardingModal } from './components/BudgetOnboardingModal.js';

// Pages
import { DashboardPage } from './pages/DashboardPage.js';
import { ExpensesPage } from './pages/ExpensesPage.js';
import { MonthlyItemsPage } from './pages/MonthlyItemsPage.js';
import { ItemsAnalyticsPage } from './pages/ItemsAnalyticsPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { RecurringPage } from './pages/RecurringPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { AIAssistantPage } from './pages/AIAssistantPage.js';
import { WelcomePage } from './pages/WelcomePage.js';
import { BudgetAIPage } from './pages/BudgetAIPage.js';
import { Routes, Route } from 'react-router-dom';
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import { FamilyWorkspacePage } from './pages/FamilyWorkspacePage.js';

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'budget' | 'expenses' | 'monthly-items' | 'items' | 'analytics' | 'recurring' | 'ai' | 'family' | 'settings'
  >('dashboard');
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Auth & Workspace Provisioning State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioningStep, setProvisioningStep] = useState(0);

  // Date Range State
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('currentMonth'));

  // Data Store
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [monthlyItems, setMonthlyItems] = useState<MonthlyItem[]>([]);
  const [consumptionLogs, setConsumptionLogs] = useState<ConsumptionLog[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [persistedNotifications, setPersistedNotifications] = useState<AppNotification[]>([]);

  // User & Budget Settings Store
  const [userSettings, setUserSettings] = useState<UserSettings>({
    currencySymbol: '₹',
    currency: 'INR',
    dateFormat: 'YYYY-MM-DD',
    monthlyBudget: undefined,
    budgetStartDay: 1,
  });

  // Sync / Workspace status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'idle' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [workspaceStatus, setWorkspaceStatus] = useState<{ spreadsheetId: string; driveFolders: any } | null>(null);

  // Modals & Assistant State
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isScanReceiptOpen, setIsScanReceiptOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedConsumeItem, setSelectedConsumeItem] = useState<MonthlyItem | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [initialMonthlyItem, setInitialMonthlyItem] = useState<MonthlyItem | null>(null);
  const [selectedAnalyticsItem, setSelectedAnalyticsItem] = useState<string | null>(null);
  const [aiInitialQuestion, setAiInitialQuestion] = useState<string | null>(null);

  const handleOpenAIWithQuestion = (question: string) => {
    setAiInitialQuestion(question);
    setActiveTab('ai');
  };

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser) {
        loadDataFromWorkspace();
      } else {
        setExpenses([]);
        setRecurringExpenses([]);
        setMonthlyItems([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Google Sign-In & Workspace Provisioning Handler
  const handleGoogleSignIn = async () => {
    try {
      setIsProvisioning(true);
      setProvisioningStep(0);
      setSyncStatus({ state: 'syncing' });

      const res = await signInWithGoogle((stepIndex) => {
        setProvisioningStep(stepIndex);
      });

      if (res?.user) {
        setUser(res.user);
        await loadDataFromWorkspace();
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      setSyncStatus({
        state: 'error',
        errorMessage: err.message || 'Google Sign-In failed',
      });
    } finally {
      setTimeout(() => {
        setIsProvisioning(false);
      }, 500);
    }
  };

  // Load all Workspace Data
  const loadDataFromWorkspace = async () => {
    setSyncStatus({ state: 'syncing' });
    try {
      const status = await SpendTrackApi.checkWorkspaceStatus();
      setWorkspaceStatus(status);

      const [loadedExpenses, loadedRecurring, loadedCategories, loadedMonthly, loadedLogs, loadedSettings, loadedNotifs] = await Promise.all([
        SpendTrackApi.getExpenses(),
        SpendTrackApi.getRecurringExpenses(),
        SpendTrackApi.getCategories(),
        SpendTrackApi.getMonthlyItems(),
        SpendTrackApi.getConsumptionLogs(),
        SpendTrackApi.getSettings().catch(() => ({} as Record<string, string>)),
        SpendTrackApi.getNotifications().catch(() => []),
      ]);

      setExpenses(loadedExpenses || []);
      setRecurringExpenses(loadedRecurring || []);
      if (loadedCategories && loadedCategories.length > 0) {
        setCategories(loadedCategories);
      }
      setMonthlyItems(loadedMonthly || []);
      setConsumptionLogs(loadedLogs || []);
      setPersistedNotifications(loadedNotifs || []);

      const parsedSettings: UserSettings = {
        currencySymbol: loadedSettings.currencySymbol || '₹',
        currency: loadedSettings.currency || 'INR',
        dateFormat: loadedSettings.dateFormat || 'YYYY-MM-DD',
        monthlyBudget: loadedSettings.monthlyBudget ? parseFloat(loadedSettings.monthlyBudget) : undefined,
        budgetStartDay: loadedSettings.budgetStartDay ? parseInt(loadedSettings.budgetStartDay, 10) : 1,
      };

      setUserSettings(parsedSettings);

      if (!parsedSettings.monthlyBudget || parsedSettings.monthlyBudget <= 0) {
        setIsOnboardingOpen(true);
      }

      // Trigger auto expense generation for due recurring bills on workspace load
      try {
        const autoResult = await SpendTrackApi.generateDueRecurringExpenses();
        if (autoResult && autoResult.createdExpenses && autoResult.createdExpenses.length > 0) {
          setExpenses((prev) => [...autoResult.createdExpenses, ...prev]);
          if (autoResult.updatedBills) {
            setRecurringExpenses(autoResult.updatedBills);
          }
        }
      } catch (autoErr) {
        console.warn('Auto recurring generation notice:', autoErr);
      }

      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      console.warn('Workspace sync notice:', err.message);
      setSyncStatus({
        state: 'error',
        errorMessage: err.message || 'Running in local mode',
      });
    }
  };

  // Save User / Budget Settings
  const handleSaveUserSettings = async (newSettings: Partial<UserSettings>) => {
    setSyncStatus({ state: 'saving' });
    try {
      const payload: Record<string, string> = {};
      if (newSettings.monthlyBudget !== undefined) payload.monthlyBudget = String(newSettings.monthlyBudget);
      if (newSettings.budgetStartDay !== undefined) payload.budgetStartDay = String(newSettings.budgetStartDay);
      if (newSettings.currency !== undefined) payload.currency = newSettings.currency;
      if (newSettings.currencySymbol !== undefined) payload.currencySymbol = newSettings.currencySymbol;

      const updatedMap = await SpendTrackApi.saveSettings(payload);
      setUserSettings((prev) => ({
        ...prev,
        currencySymbol: updatedMap.currencySymbol || prev?.currencySymbol || '₹',
        currency: updatedMap.currency || prev?.currency || 'INR',
        monthlyBudget: updatedMap.monthlyBudget ? parseFloat(updatedMap.monthlyBudget) : prev?.monthlyBudget,
        budgetStartDay: updatedMap.budgetStartDay ? parseInt(updatedMap.budgetStartDay, 10) : prev?.budgetStartDay,
      }));

      setIsOnboardingOpen(false);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  // Consumption Log Handlers
  const handleSaveConsumptionLog = async (payload: {
    itemId: string;
    itemName: string;
    consumedQuantity: number;
    unit: string;
    consumedDate: string;
    notes?: string;
  }) => {
    setSyncStatus({ state: 'saving' });
    try {
      const createdLog = await SpendTrackApi.createConsumptionLog(payload);
      setConsumptionLogs((prev) => [createdLog, ...prev]);

      const matchedItem = monthlyItems.find((m) => m.id === payload.itemId);
      if (matchedItem) {
        const currentQty = matchedItem.remainingQuantity !== undefined
          ? matchedItem.remainingQuantity
          : (matchedItem.openingStock || matchedItem.quantityPurchased || 0);
        const newQty = Math.max(0, Number((currentQty - payload.consumedQuantity).toFixed(2)));

        const updatedItem = await SpendTrackApi.updateMonthlyItem(matchedItem.id, {
          remainingQuantity: newQty,
        });
        setMonthlyItems((prev) => prev.map((m) => (m.id === matchedItem.id ? updatedItem : m)));
      }

      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  // Sync live bill & inventory alerts into persistedNotifications
  useEffect(() => {
    const liveAlerts: AppNotification[] = [];
    const today = new Date();
    const currentDay = today.getDate();
    const nowISO = new Date().toISOString();

    for (const bill of recurringExpenses) {
      if (bill.isActive === false) continue;
      const diff = bill.dueDay - currentDay;
      const title = bill.name || bill.title || 'Recurring Bill';

      if (diff < 0 && Math.abs(diff) <= 5) {
        liveAlerts.push({
          id: `notif-overdue-${bill.id}`,
          type: 'bill_overdue',
          title: `Overdue: ${title}`,
          message: `${title} was due on the ${bill.dueDay}th of this month. Amount: ₹${bill.amount}`,
          state: 'Overdue',
          billId: bill.id,
          createdAt: nowISO,
          read: false,
        });
      } else if (diff === 0) {
        liveAlerts.push({
          id: `notif-due-${bill.id}`,
          type: 'bill_due',
          title: `Due Today: ${title}`,
          message: `${title} is due today! Amount: ₹${bill.amount}`,
          state: 'Due Today',
          billId: bill.id,
          createdAt: nowISO,
          read: false,
        });
      } else if (diff > 0 && diff <= (bill.reminderDays || 3)) {
        liveAlerts.push({
          id: `notif-up-${bill.id}`,
          type: 'bill_upcoming',
          title: `Upcoming: ${title}`,
          message: `${title} is due in ${diff} day${diff > 1 ? 's' : ''} (on the ${bill.dueDay}th). Amount: ₹${bill.amount}`,
          state: 'Upcoming',
          billId: bill.id,
          createdAt: nowISO,
          read: false,
        });
      }
    }

    for (const item of monthlyItems) {
      const intel = calculateMonthlyItemIntelligence(item, consumptionLogs);
      if (intel.isLowStock) {
        liveAlerts.push({
          id: `notif-stock-${item.id}`,
          type: 'stock_low',
          title: `Low Stock: ${item.name}`,
          message: `Remaining stock is ${intel.remainingQuantity} ${item.unit} (Threshold: ${intel.minimumThreshold} ${item.unit}).`,
          state: 'Low Stock',
          itemId: item.id,
          createdAt: nowISO,
          read: false,
        });
      }
    }

    if (liveAlerts.length > 0) {
      setPersistedNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newItems = liveAlerts.filter((n) => !existingIds.has(n.id));
        if (newItems.length > 0) {
          newItems.forEach((n) => SpendTrackApi.saveNotification(n).catch(() => {}));
          return [...newItems, ...prev];
        }
        return prev;
      });
    }
  }, [recurringExpenses, monthlyItems, consumptionLogs]);

  // Notification Actions
  const handleMarkNotifAsRead = async (id: string) => {
    setPersistedNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    SpendTrackApi.updateNotification(id, { read: true }).catch(() => {});
  };

  const handleMarkAllNotifsAsRead = async () => {
    setPersistedNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    persistedNotifications.forEach((n) => {
      if (!n.read) {
        SpendTrackApi.updateNotification(n.id, { read: true }).catch(() => {});
      }
    });
  };

  const handleClearNotif = async (id: string) => {
    setPersistedNotifications((prev) => prev.filter((n) => n.id !== id));
    SpendTrackApi.deleteNotification(id).catch(() => {});
  };

  const handleClearAllNotifs = async () => {
    setPersistedNotifications([]);
    SpendTrackApi.clearAllNotifications().catch(() => {});
  };

  // CRUD for Expenses
  const handleSaveExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSyncStatus({ state: 'saving' });
    try {
      if (editingExpense) {
        const updated = await SpendTrackApi.updateExpense(editingExpense.id, expenseData);
        setExpenses((prev) => prev.map((e) => (e.id === editingExpense.id ? updated : e)));
      } else {
        const created = await SpendTrackApi.createExpense(expenseData);
        setExpenses((prev) => [created, ...prev]);
      }
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleSaveMultipleExpenses = async (
    expenseList: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[]
  ) => {
    setSyncStatus({ state: 'saving' });
    try {
      const createdItems: Expense[] = [];
      for (const exp of expenseList) {
        const created = await SpendTrackApi.createExpense(exp);
        createdItems.push(created);
      }
      setExpenses((prev) => [...createdItems, ...prev]);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    setSyncStatus({ state: 'saving' });
    try {
      await SpendTrackApi.deleteExpense(expense.id);
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  // Monthly Items Catalog Handlers
  const handleSaveMonthlyItem = async (
    itemData: Omit<MonthlyItem, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    setSyncStatus({ state: 'saving' });
    try {
      if (id) {
        const updated = await SpendTrackApi.updateMonthlyItem(id, itemData);
        setMonthlyItems((prev) => prev.map((m) => (m.id === id ? updated : m)));
      } else {
        const created = await SpendTrackApi.createMonthlyItem(itemData);
        setMonthlyItems((prev) => [...prev, created]);
      }
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleDeleteMonthlyItem = async (id: string) => {
    setSyncStatus({ state: 'saving' });
    try {
      await SpendTrackApi.deleteMonthlyItem(id);
      setMonthlyItems((prev) => prev.filter((m) => m.id !== id));
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleToggleMonthlyItem = async (item: MonthlyItem) => {
    await handleSaveMonthlyItem({ ...item, isEnabled: !item.isEnabled }, item.id);
  };

  const handleQuickAddPurchaseFromTemplate = (template: MonthlyItem) => {
    setEditingExpense(null);
    setInitialMonthlyItem(template);
    setIsAddExpenseOpen(true);
  };

  // Recurring Expenses CRUD
  const handleAddRecurring = async (
    itemData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setSyncStatus({ state: 'saving' });
    try {
      const created = await SpendTrackApi.createRecurringExpense(itemData);
      setRecurringExpenses((prev) => [...prev, created]);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleUpdateRecurring = async (id: string, itemData: Partial<RecurringExpense>) => {
    setSyncStatus({ state: 'saving' });
    try {
      const updated = await SpendTrackApi.updateRecurringExpense(id, itemData);
      setRecurringExpenses((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleDeleteRecurring = async (item: RecurringExpense) => {
    setSyncStatus({ state: 'saving' });
    try {
      await SpendTrackApi.deleteRecurringExpense(item.id, item.calendarEventId);
      setRecurringExpenses((prev) => prev.filter((r) => r.id !== item.id));
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleRecordRecurringAsExpense = (recurring: RecurringExpense) => {
    setEditingExpense(null);
    setInitialMonthlyItem({
      id: 'recurring-temp',
      name: recurring.name,
      category: recurring.category,
      subcategory: recurring.subcategory,
      typicalPrice: recurring.amount,
      unit: 'month',
      isEnabled: true,
      createdAt: '',
      updatedAt: '',
    });
    setIsAddExpenseOpen(true);
  };

  // Export / Import CSV
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'ItemName',
      'Category',
      'Subcategory',
      'Quantity',
      'Unit',
      'TotalPrice',
      'PurchaseDate',
      'UsageStartDate',
      'UsageEndDate',
      'DurationDays',
      'PricePerUnit',
      'DailyCost',
      'DailyQuantity',
      'Notes',
    ];
    const rows = expenses.map((e) => [
      e.id,
      `"${e.itemName.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${e.subcategory || ''}"`,
      e.quantity ?? '',
      e.unit ?? '',
      e.totalPrice,
      e.purchaseDate,
      e.usageStartDate || '',
      e.usageEndDate || '',
      e.durationDays ?? '',
      e.pricePerUnit ?? '',
      e.dailyCost ?? '',
      e.dailyQuantity ?? '',
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SpendTrack_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length <= 1) return;

        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 7 && cols[1] && cols[6]) {
            const expenseData: any = {
              itemName: cols[1],
              category: cols[2] || 'Groceries',
              subcategory: cols[3] || undefined,
              quantity: cols[4] ? parseFloat(cols[4]) : undefined,
              unit: cols[5] || 'unit',
              totalPrice: parseFloat(cols[6]) || 0,
              purchaseDate: cols[7] || new Date().toISOString().split('T')[0],
              usageStartDate: cols[8] || undefined,
              usageEndDate: cols[9] || undefined,
              notes: cols[14] || undefined,
            };
            await SpendTrackApi.createExpense(expenseData);
            importedCount++;
          }
        }
        alert(`Successfully imported ${importedCount} expenses!`);
        loadDataFromWorkspace();
      } catch (err) {
        alert('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route
        path="*"
        element={
          authLoading ? (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30 animate-bounce mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm font-semibold text-slate-500">Initializing {BRAND_NAME} Workspace...</p>
            </div>
          ) : !user && !isDemoMode ? (
            <WelcomePage
              onSignIn={handleGoogleSignIn}
              onExploreDemo={() => setIsDemoMode(true)}
              isSigningIn={syncStatus.state === 'syncing'}
              errorMessage={syncStatus.state === 'error' ? syncStatus.errorMessage : null}
            />
          ) : (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="spendtrack-root">
      {!user && isDemoMode && (
        <div className="bg-emerald-900 text-emerald-100 text-xs sm:text-sm py-2 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-inner z-50">
          <span>💡 Previewing {BRAND_NAME} in Demo Mode. Connect your own Google Workspace for live sync.</span>
          <button
            onClick={handleGoogleSignIn}
            className="underline font-bold hover:text-white cursor-pointer ml-1"
          >
            Continue with Google &rarr;
          </button>
          <button
            onClick={() => setIsDemoMode(false)}
            className="ml-3 text-emerald-300 hover:text-white text-xs underline cursor-pointer"
          >
            Back to Welcome Page
          </button>
        </div>
      )}
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        {/* Desktop Header (>= 768px) */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900">{BRAND_NAME}</span>
                <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Consumption Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none hidden md:block">
                Understand where your money goes.
              </p>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <DateRangePicker value={dateRange} onChange={setDateRange} />

            <SyncStatusBadge
              status={syncStatus}
              isOnline={isOnline}
              onRetry={loadDataFromWorkspace}
              compact={true}
            />

            {/* Notification Bell Button */}
            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 relative cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center border border-slate-200"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {persistedNotifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black ring-2 ring-white">
                  {persistedNotifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {!user || syncStatus.state === 'error' ? (
              <button
                id="header-sign-in-btn"
                onClick={handleGoogleSignIn}
                className="px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>
            ) : null}

            {/* Quick Add Expense Action Button */}
            <button
              id="header-quick-add-btn"
              onClick={() => {
                setEditingExpense(null);
                setInitialMonthlyItem(null);
                setIsAddExpenseOpen(true);
              }}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Expense</span>
            </button>
          </div>
        </div>

        {/* Mobile Header (< 768px) */}
        <div className="flex md:hidden max-w-7xl mx-auto px-4 h-16 items-center justify-between">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900">{BRAND_NAME}</span>
          </div>

          <div className="flex items-center gap-2">
            <SyncStatusBadge
              status={syncStatus}
              isOnline={isOnline}
              onRetry={loadDataFromWorkspace}
              compact={true}
            />

            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 relative cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {persistedNotifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black ring-2 ring-white">
                  {persistedNotifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold border-2 border-emerald-500 flex items-center justify-center text-xs cursor-pointer shadow-xs overflow-hidden"
              aria-label="Profile"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : user?.email ? (
                user.email.substring(0, 2).toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
          <nav className="flex space-x-6 overflow-x-auto scrollbar-none">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { key: 'budget', label: 'Budget AI', icon: TrendingUp, highlight: true },
              { key: 'family', label: 'Family Workspace', icon: Users, highlight: true },
              { key: 'expenses', label: 'Expenses', icon: Receipt },
              { key: 'monthly-items', label: 'Monthly Items', icon: ShoppingCart },
              { key: 'items', label: 'Item Intelligence', icon: Sparkles },
              { key: 'recurring', label: 'Recurring Bills', icon: Repeat },
              { key: 'ai', label: BRAND_NAME, icon: Bot, highlight: true },
              { key: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`nav-tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-emerald-600 text-emerald-700'
                      : tab.highlight
                      ? 'border-transparent text-emerald-600 hover:text-emerald-800'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.highlight && !isActive ? 'text-emerald-500' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardPage
            expenses={expenses}
            dateRange={dateRange}
            monthlyItems={monthlyItems}
            recurringExpenses={recurringExpenses}
            consumptionLogs={consumptionLogs}
            userSettings={userSettings}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setIsAddExpenseOpen(true);
            }}
            onOpenScanReceipt={() => setIsScanReceiptOpen(true)}
            onViewExpenseHistory={() => setActiveTab('expenses')}
            onViewMonthlyItems={() => setActiveTab('monthly-items')}
            onViewRecurringBills={() => setActiveTab('recurring')}
            onSelectItemAnalytics={(itemName) => {
              setSelectedAnalyticsItem(itemName);
              setActiveTab('items');
            }}
            onOpenAIWithQuestion={handleOpenAIWithQuestion}
            onQuickAddFromItem={handleQuickAddPurchaseFromTemplate}
            onOpenConsumeModal={(item) => {
              setSelectedConsumeItem(item);
              setIsConsumeModalOpen(true);
            }}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetAIPage
            expenses={expenses}
            recurringExpenses={recurringExpenses}
            dateRange={dateRange}
          />
        )}

        {activeTab === 'family' && (
          <FamilyWorkspacePage />
        )}

        {activeTab === 'expenses' && (
          <ExpensesPage
            expenses={expenses}
            categories={categories}
            dateRange={dateRange}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setIsAddExpenseOpen(true);
            }}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setInitialMonthlyItem(null);
              setIsAddExpenseOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
            onSelectItemAnalytics={(itemName) => {
              setSelectedAnalyticsItem(itemName);
              setActiveTab('items');
            }}
          />
        )}

        {activeTab === 'monthly-items' && (
          <MonthlyItemsPage
            monthlyItems={monthlyItems}
            categories={categories}
            expenses={expenses}
            consumptionLogs={consumptionLogs}
            onSaveMonthlyItem={handleSaveMonthlyItem}
            onDeleteMonthlyItem={handleDeleteMonthlyItem}
            onToggleMonthlyItem={handleToggleMonthlyItem}
            onQuickAddPurchase={handleQuickAddPurchaseFromTemplate}
            onConsumeQuantity={(item) => {
              setSelectedConsumeItem(item);
              setIsConsumeModalOpen(true);
            }}
            onViewItemHistory={(itemName) => {
              setSelectedAnalyticsItem(itemName);
              setActiveTab('items');
            }}
          />
        )}

        {activeTab === 'items' && (
          <ItemsAnalyticsPage
            expenses={expenses}
            selectedItemName={selectedAnalyticsItem}
            onSelectItem={(name) => setSelectedAnalyticsItem(name)}
            onQuickAddExpense={(name, cat, unt) => {
              const matchedTemplate = monthlyItems.find((m) => m.name.toLowerCase() === name.toLowerCase());
              if (matchedTemplate) {
                handleQuickAddPurchaseFromTemplate(matchedTemplate);
              } else {
                setEditingExpense(null);
                setInitialMonthlyItem({
                  id: 'temp',
                  name,
                  category: cat,
                  unit: unt,
                  isEnabled: true,
                  createdAt: '',
                  updatedAt: '',
                });
                setIsAddExpenseOpen(true);
              }
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage expenses={expenses} currentDateRange={dateRange} />
        )}

        {activeTab === 'recurring' && (
          <RecurringPage
            recurringExpenses={recurringExpenses}
            categories={categories}
            onAddRecurring={handleAddRecurring}
            onUpdateRecurring={handleUpdateRecurring}
            onDeleteRecurring={handleDeleteRecurring}
            onRecordAsExpense={handleRecordRecurringAsExpense}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistantPage
            expenses={expenses}
            recurringExpenses={recurringExpenses}
            categories={categories}
            dateRange={dateRange}
            initialQuestion={aiInitialQuestion}
            onClearInitialQuestion={() => setAiInitialQuestion(null)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            categories={categories}
            userSettings={userSettings}
            onSaveCategories={async (cats) => {
              setCategories(cats);
              await SpendTrackApi.saveCategories(cats);
            }}
            onSaveUserSettings={handleSaveUserSettings}
            onExportCsv={handleExportCsv}
            onImportCsv={handleImportCsv}
            onSignOut={signOutApp}
            onGoogleSignIn={handleGoogleSignIn}
            userEmail={user?.email}
            workspaceStatus={workspaceStatus}
            onRefreshWorkspace={loadDataFromWorkspace}
          />
        )}
      </main>

      {/* STREAMLINED MOBILE BOTTOM NAVIGATION */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 px-2 py-1.5 shadow-xl flex justify-around items-center"
      >
        {/* 1. Home */}
        <button
          id="mobile-nav-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold transition-all cursor-pointer min-w-[44px] min-h-[44px] ${
            activeTab === 'dashboard' ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        {/* 2. Expenses */}
        <button
          id="mobile-nav-expenses"
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold transition-all cursor-pointer min-w-[44px] min-h-[44px] ${
            activeTab === 'expenses' ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span>Expenses</span>
        </button>

        {/* 3. Center Elevated Quick Add Button */}
        <div className="flex justify-center -mt-6">
          <button
            id="mobile-nav-add-btn"
            onClick={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setIsAddExpenseOpen(true);
            }}
            className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 border-4 border-slate-50 active:scale-95 transition-all cursor-pointer"
            title="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. AI */}
        <button
          id="mobile-nav-ai"
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold transition-all cursor-pointer min-w-[44px] min-h-[44px] ${
            activeTab === 'ai' ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="w-5 h-5 mb-0.5" />
          <span>AI</span>
        </button>

        {/* 5. Receipts / Monthly Items */}
        <button
          id="mobile-nav-receipts"
          onClick={() => setActiveTab('monthly-items')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold transition-all cursor-pointer min-w-[44px] min-h-[44px] ${
            activeTab === 'monthly-items' ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          <span>Receipts</span>
        </button>

        {/* 6. Profile / Settings */}
        <button
          id="mobile-nav-profile"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold transition-all cursor-pointer min-w-[44px] min-h-[44px] ${
            activeTab === 'settings' ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </button>
      </nav>

      {/* Mobile More Features Drawer */}
      <MobileMoreDrawer
        isOpen={isMoreDrawerOpen}
        onClose={() => setIsMoreDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        userEmail={user?.email}
      />

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
          setInitialMonthlyItem(null);
        }}
        onSave={handleSaveExpense}
        categories={categories}
        editExpense={editingExpense}
        monthlyItems={monthlyItems}
        initialMonthlyItem={initialMonthlyItem}
      />

      {/* Workspace Provisioning Progress Modal */}
      <ProvisioningProgressModal
        isOpen={isProvisioning}
        currentStepIndex={provisioningStep}
      />

      {/* AI Receipt Scanner Modal (Gemini Vision) */}
      <ReceiptScannerModal
        isOpen={isScanReceiptOpen}
        onClose={() => setIsScanReceiptOpen(false)}
        categories={categories}
        onSaveExpenses={handleSaveMultipleExpenses}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={persistedNotifications}
        onMarkAsRead={handleMarkNotifAsRead}
        onMarkAllAsRead={handleMarkAllNotifsAsRead}
        onClearNotification={handleClearNotif}
        onClearAllNotifications={handleClearAllNotifs}
        onSelectNotification={(notif) => {
          if (notif.type === 'stock_low') {
            setActiveTab('monthly-items');
          } else {
            setActiveTab('recurring');
          }
        }}
      />

      {/* Consume Quantity Modal */}
      <ConsumeQuantityModal
        isOpen={isConsumeModalOpen}
        onClose={() => {
          setIsConsumeModalOpen(false);
          setSelectedConsumeItem(null);
        }}
        monthlyItems={monthlyItems}
        initialItem={selectedConsumeItem}
        onSaveConsumption={handleSaveConsumptionLog}
      />

      {/* Monthly Budget Onboarding Modal */}
      <BudgetOnboardingModal
        isOpen={isOnboardingOpen}
        onSave={handleSaveUserSettings}
      />

      {/* PWA Install Banner */}
      <PWAInstallPrompt />
            </div>
          )
        }
      />
    </Routes>
  );
}

export default App;
