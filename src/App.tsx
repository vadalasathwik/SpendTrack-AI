import React, { useState, useEffect } from 'react';
import {
  Home,
  Receipt,
  CreditCard,
  Sparkles,
  Plus,
  TrendingUp,
  Menu,
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
import { calculateMonthlyItemIntelligence, sanitizeErrorMessage, findMatchingRecurringBill } from './utils/calculations.js';
import { SpendTrackApi } from './services/api.js';
import { signInWithGoogle, signOutApp, onAuthStateChange, clearAuthSession, getStoredJWT } from './services/authService.js';
import { isFirebaseConfigured } from './services/firebase.js';
import { BRAND_NAME } from './constants/brand.js';

// UI Components
import { TrackPayLogo } from './components/TrackPayLogo.js';
import { SplashScreen } from './components/SplashScreen.js';
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
import { QuickAddFAB } from './components/QuickAddFAB.js';
import { ProfileSheet } from './components/ProfileSheet.js';

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

const DATE_RANGE_STORAGE_KEY = 'spendtrack_date_range';
const ACTIVE_TAB_STORAGE_KEY = 'spendtrack_active_tab';

const getInitialDateRange = (): DateRange => {
  try {
    const stored = localStorage.getItem(DATE_RANGE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.preset) {
        if (parsed.preset === 'custom' && parsed.startDate && parsed.endDate) {
          return getDateRangeFromPreset('custom', parsed.startDate, parsed.endDate);
        }
        return getDateRangeFromPreset(parsed.preset);
      }
    }
  } catch (err) {
    console.warn('Failed to read saved date range:', err);
  }
  return getDateRangeFromPreset('currentMonth');
};

const getInitialActiveTab = (): any => {
  try {
    const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (stored) return stored;
  } catch (err) {}
  return 'dashboard';
};

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'budget' | 'expenses' | 'monthly-items' | 'items' | 'analytics' | 'recurring' | 'ai' | 'family' | 'settings'
  >(getInitialActiveTab);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab as any);
    try {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    } catch (err) {}
  };

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Auth & Workspace Provisioning State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioningStep, setProvisioningStep] = useState(0);

  // Date Range State with Persistence
  const [dateRange, setDateRange] = useState<DateRange>(getInitialDateRange);

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
    try {
      localStorage.setItem(
        DATE_RANGE_STORAGE_KEY,
        JSON.stringify({
          preset: newRange.preset,
          startDate: newRange.startDate,
          endDate: newRange.endDate,
        })
      );
    } catch (err) {
      console.warn('Failed to persist date range:', err);
    }
  };

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
  const [autoOpenRecurringModal, setAutoOpenRecurringModal] = useState(false);
  const [isScanReceiptOpen, setIsScanReceiptOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
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

  // Ref to prevent simultaneous workspace requests on startup
  const isWorkspaceLoadingRef = React.useRef(false);

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

  // Listen for 401 unauthorized session events across the app
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthSession();
      setUser(null);
      setSyncStatus({ state: 'idle' });
    };
    window.addEventListener('spendtrack_401_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('spendtrack_401_unauthorized', handleUnauthorized);
    };
  }, []);

  // Sign Out handler:Immediately clears local app state and executes signOutApp
  const handleSignOut = async () => {
    setIsMoreDrawerOpen(false);
    setIsProfileSheetOpen(false);
    setIsNotificationDrawerOpen(false);
    setIsAddExpenseOpen(false);
    setIsScanReceiptOpen(false);
    setIsConsumeModalOpen(false);

    setUser(null);
    setExpenses([]);
    setRecurringExpenses([]);
    setMonthlyItems([]);
    setConsumptionLogs([]);
    setPersistedNotifications([]);
    setSyncStatus({ state: 'idle' });
    setActiveTab('dashboard');

    await signOutApp();
  };

  // Auth Listener: Resolves auth state before triggering any workspace data loading
  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      const token = getStoredJWT();
      if (firebaseUser && token) {
        setUser(firebaseUser);
      } else {
        setUser(null);
        setExpenses([]);
        setRecurringExpenses([]);
        setMonthlyItems([]);
        setConsumptionLogs([]);
        setPersistedNotifications([]);
        setIsMoreDrawerOpen(false);
        setIsProfileSheetOpen(false);
        setIsNotificationDrawerOpen(false);
        setSyncStatus({ state: 'idle' });
        setActiveTab('dashboard');
        clearAuthSession();
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Loading Trigger: Only loads workspace data when auth state is resolved and authenticated
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !getStoredJWT()) {
      setExpenses([]);
      setRecurringExpenses([]);
      setMonthlyItems([]);
      setConsumptionLogs([]);
      setPersistedNotifications([]);
      return;
    }

    loadDataFromWorkspace();
  }, [authLoading, user]);

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
      } else {
        setSyncStatus({ state: 'idle' });
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      let errorMsg = err.message || 'Google Sign-In failed';
      if (errorMsg.includes('auth/api-key-not-valid') || errorMsg.includes('api-key-not-valid')) {
        errorMsg = 'Invalid Firebase API Key in .env.local. Please update VITE_FIREBASE_API_KEY with a valid Firebase Web API Key.';
      }
      setSyncStatus({
        state: 'error',
        errorMessage: errorMsg,
      });
    } finally {
      setTimeout(() => {
        setIsProvisioning(false);
      }, 500);
    }
  };

  // Load all Workspace Data
  const loadDataFromWorkspace = async () => {
    if (authLoading || !user || !getStoredJWT()) {
      return;
    }
    if (isWorkspaceLoadingRef.current) return;
    isWorkspaceLoadingRef.current = true;
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
      if (
        err.message?.includes('401') ||
        err.message?.includes('unauthorized') ||
        err.message?.includes('Unauthorized') ||
        err.message?.includes('Not authenticated')
      ) {
        clearAuthSession();
        setUser(null);
        setSyncStatus({ state: 'idle' });
        return;
      }
      setSyncStatus({
        state: 'error',
        errorMessage: err.message || 'Running in local mode',
      });
    } finally {
      isWorkspaceLoadingRef.current = false;
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
      // 1. Create recurring payment first
      const savedPayment = await SpendTrackApi.createRecurringExpense(itemData);

      // 2. Immediately after creating payment, if calendar sync is enabled, create calendar event
      if (itemData.calendarReminderEnabled !== false) {
        const reminderDate = itemData.reminderDate || itemData.dueDate || new Date().toISOString().split('T')[0];
        const reminderTime = itemData.reminderTime || '20:00';
        const dueDate = itemData.dueDate || reminderDate;
        const notifyBefore = itemData.notifyBefore || '1 day';

        console.log("Creating calendar for:", itemData.name);

        const calPayload = {
          title: `💳 Pay ${itemData.name}`,
          summary: `💳 Pay ${itemData.name}`,
          description: `Amount: ₹${itemData.amount}\nCategory: ${itemData.category}\nDue Date: ${dueDate}${itemData.notes ? '\nNotes: ' + itemData.notes : ''}\n\nCreated by TrackPay.`,
          startDate: reminderDate,
          startTime: reminderTime,
          date: reminderDate,
          time: reminderTime,
          dueDate: dueDate,
          notifyBefore,
          recurring: false,
          amount: itemData.amount,
          colorId: "5", // 🟡 Yellow / Upcoming
        };

        try {
          const cal = await SpendTrackApi.createCalendarEvent(calPayload);
          if (cal && cal.success && cal.eventId) {
            console.log("Calendar Event ID:", cal.eventId);
            savedPayment.calendarEventId = cal.eventId;
            savedPayment.calendarHtmlLink = cal.htmlLink;
            savedPayment.calendarSyncStatus = 'synced';

            // Persist calendar fields to Google Sheets
            await SpendTrackApi.updateRecurringExpense(savedPayment.id, {
              calendarEventId: cal.eventId,
              calendarHtmlLink: cal.htmlLink,
              calendarSyncStatus: 'synced',
            }).catch((err) => {
              console.warn('Non-fatal: Error updating calendar fields on payment:', err);
            });
          } else {
            savedPayment.calendarSyncStatus = 'error';
          }
        } catch (calErr) {
          console.error("Unable to create calendar reminder:", calErr);
          savedPayment.calendarSyncStatus = 'error';
        }
      }

      setRecurringExpenses((prev) => [...prev, savedPayment]);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleUpdateRecurring = async (id: string, itemData: Partial<RecurringExpense>) => {
    setSyncStatus({ state: 'saving' });
    try {
      const existing = recurringExpenses.find((r) => r.id === id);
      const updated = await SpendTrackApi.updateRecurringExpense(id, itemData);

      if (itemData.calendarReminderEnabled !== false && existing) {
        const targetCalId = itemData.calendarEventId || existing.calendarEventId || updated.calendarEventId;
        const name = itemData.name || existing.name || 'Bill';
        const amount = itemData.amount || existing.amount || 0;
        const category = itemData.category || existing.category || 'Utilities';
        const reminderDate = itemData.reminderDate || existing.reminderDate || itemData.dueDate || existing.dueDate || new Date().toISOString().split('T')[0];
        const reminderTime = itemData.reminderTime || existing.reminderTime || '20:00';
        const dueDate = itemData.dueDate || existing.dueDate || reminderDate;
        const notifyBefore = itemData.notifyBefore || existing.notifyBefore || '1 day';

        console.log("Updating calendar for:", name);

        const calPayload = {
          title: `💳 Pay ${name}`,
          summary: `💳 Pay ${name}`,
          description: `Amount: ₹${amount}\nCategory: ${category}\nDue Date: ${dueDate}${itemData.notes || existing.notes ? '\nNotes: ' + (itemData.notes || existing.notes) : ''}\n\nCreated by TrackPay.`,
          startDate: reminderDate,
          startTime: reminderTime,
          date: reminderDate,
          time: reminderTime,
          dueDate: dueDate,
          notifyBefore,
          recurring: false,
          amount,
          colorId: "5", // 🟡 Yellow / Upcoming
        };

        try {
          if (targetCalId) {
            const calRes = await SpendTrackApi.updateCalendarEvent(targetCalId, calPayload);
            updated.calendarEventId = targetCalId;
            if (calRes && calRes.htmlLink) {
              updated.calendarHtmlLink = calRes.htmlLink;
            }
            updated.calendarSyncStatus = 'synced';
            console.log("Updated Calendar Event ID:", targetCalId);
          } else {
            const cal = await SpendTrackApi.createCalendarEvent(calPayload);
            if (cal && cal.success && cal.eventId) {
              console.log("Calendar Event ID:", cal.eventId);
              updated.calendarEventId = cal.eventId;
              updated.calendarHtmlLink = cal.htmlLink;
              updated.calendarSyncStatus = 'synced';
              await SpendTrackApi.updateRecurringExpense(id, {
                calendarEventId: cal.eventId,
                calendarHtmlLink: cal.htmlLink,
                calendarSyncStatus: 'synced',
              }).catch(() => {});
            }
          }
        } catch (calErr) {
          console.error("Unable to update calendar reminder:", calErr);
          updated.calendarSyncStatus = 'error';
        }
      }

      setRecurringExpenses((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      const cleanMsg = sanitizeErrorMessage(err.message);
      setSyncStatus({ state: 'error', errorMessage: cleanMsg });
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
      const cleanMsg = sanitizeErrorMessage(err.message);
      setSyncStatus({ state: 'error', errorMessage: cleanMsg });
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

  const handleMarkRecurringAsPaid = async (targetRecurring: RecurringExpense) => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonthStr = today.slice(0, 7);

    // Match bill locally using priority order (ID -> Name + Category + Due Day + Amount -> Name + Category)
    const activeBill = findMatchingRecurringBill(targetRecurring, recurringExpenses) || targetRecurring;

    // Prevent duplicate payment for the same month
    if (activeBill.lastGeneratedMonth === currentMonthStr) {
      return;
    }

    // Capture previous state for rollback
    const prevExpenses = [...expenses];
    const prevRecurring = [...recurringExpenses];

    // 1. Optimistic UI updates
    const tempExpenseId = `exp-rec-${Date.now()}`;
    const optimisticExpense: Expense = {
      id: tempExpenseId,
      itemName: activeBill.name || activeBill.title || 'Recurring Bill',
      category: activeBill.category,
      subcategory: activeBill.subcategory,
      totalPrice: activeBill.amount,
      purchaseDate: today,
      usageStartDate: today,
      usageEndDate: today,
      durationDays: 30,
      dailyCost: Number((activeBill.amount / 30).toFixed(2)),
      dailyQuantity: 1,
      notes: activeBill.notes ? `Recurring Bill: ${activeBill.notes}` : 'Recurring Bill Payment',
      source: 'recurring',
      recurringId: activeBill.id,
      calendarEventId: activeBill.calendarEventId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update local React state immediately for instant feedback
    setExpenses((prev) => [optimisticExpense, ...prev]);
    setRecurringExpenses((prev) =>
      prev.map((r) =>
        r.id === activeBill.id ||
        (r.name === activeBill.name && r.category === activeBill.category)
          ? { ...r, lastGeneratedMonth: currentMonthStr, isPaid: true, paidDate: today }
          : r
      )
    );

    setSyncStatus({ state: 'syncing' });

    try {
      // 2. Create monthly expense on server
      const expensePayload = {
        itemName: activeBill.name || activeBill.title || 'Recurring Bill',
        category: activeBill.category,
        subcategory: activeBill.subcategory,
        totalPrice: activeBill.amount,
        purchaseDate: today,
        notes: activeBill.notes ? `Recurring Bill: ${activeBill.notes}` : 'Recurring Bill Payment',
        source: 'recurring' as const,
        recurringId: activeBill.id,
        calendarEventId: activeBill.calendarEventId,
      };

      const createdExpense = await SpendTrackApi.createExpense(expensePayload);

      setExpenses((prev) =>
        prev.map((e) => (e.id === tempExpenseId ? createdExpense : e))
      );

      // 3. Update existing row on Google Sheets (never create duplicate)
      let updateSuccess = false;
      let targetIdToUpdate = activeBill.id;

      try {
        const updatedBill = await SpendTrackApi.updateRecurringExpense(targetIdToUpdate, {
          rowIndex: activeBill.rowIndex,
          name: activeBill.name || activeBill.title,
          category: activeBill.category,
          dueDay: activeBill.dueDay,
          amount: activeBill.amount,
          lastGeneratedMonth: currentMonthStr,
          isPaid: true,
          paidDate: today,
        });
        setRecurringExpenses((prev) =>
          prev.map((r) => (r.id === targetIdToUpdate || r.id === updatedBill.id ? updatedBill : r))
        );
        updateSuccess = true;
      } catch (firstErr) {
        // Silent Recovery: fetch latest recurring bills & re-match using fallback strategy
        setSyncStatus({ state: 'syncing' });
        try {
          const freshBills = await SpendTrackApi.getRecurringExpenses();
          setRecurringExpenses(freshBills);

          const matchedFreshBill = findMatchingRecurringBill(activeBill, freshBills);

          if (matchedFreshBill) {
            targetIdToUpdate = matchedFreshBill.id;
            const retriedBill = await SpendTrackApi.updateRecurringExpense(targetIdToUpdate, {
              rowIndex: matchedFreshBill.rowIndex,
              name: matchedFreshBill.name || matchedFreshBill.title,
              category: matchedFreshBill.category,
              dueDay: matchedFreshBill.dueDay,
              amount: matchedFreshBill.amount,
              lastGeneratedMonth: currentMonthStr,
              isPaid: true,
              paidDate: today,
            });
            setRecurringExpenses((prev) =>
              prev.map((r) => (r.id === targetIdToUpdate || r.id === retriedBill.id ? retriedBill : r))
            );
            updateSuccess = true;
          }
        } catch (retryErr) {
          console.error('Silent recovery retry failed:', retryErr);
        }
      }

      if (!updateSuccess) {
        throw new Error("Couldn't sync changes. Tap Retry.");
      }

      // 4. Update Google Calendar event to "✅ Paid • WiFi" with Green color (colorId: "2")
      if (activeBill.calendarReminderEnabled !== false && activeBill.calendarEventId) {
        const paidDescription = `Amount: ₹${activeBill.amount}\nCategory: ${activeBill.category}\nDue Date: ${activeBill.dueDate || today}\nPaid Date: ${today}${activeBill.notes ? '\nNotes: ' + activeBill.notes : ''}\n\nCreated by TrackPay.`;
        const updatedPaidCal = await SpendTrackApi.updateCalendarEvent(activeBill.calendarEventId, {
          title: `✅ Paid • ${activeBill.name || activeBill.title}`,
          summary: `✅ Paid • ${activeBill.name || activeBill.title}`,
          description: paidDescription,
          date: today,
          startDate: today,
          amount: activeBill.amount,
          colorId: "2", // 🟢 Green / Paid
        }).catch((err) => {
          console.warn('Non-fatal: Failed to mark calendar event as paid:', err);
          return null;
        });
      }

      // Automatically calculate next cycle's due date & reminder date (+1 month for monthly)
      const baseDueDate = activeBill.dueDate ? new Date(activeBill.dueDate + 'T00:00:00') : new Date();
      if (isNaN(baseDueDate.getTime())) baseDueDate.setTime(Date.now());

      const nextDueDateObj = new Date(baseDueDate);
      if (activeBill.frequency === 'weekly') {
        nextDueDateObj.setDate(nextDueDateObj.getDate() + 7);
      } else if (activeBill.frequency === 'yearly') {
        nextDueDateObj.setFullYear(nextDueDateObj.getFullYear() + 1);
      } else {
        // monthly default
        nextDueDateObj.setMonth(nextDueDateObj.getMonth() + 1);
      }
      const nextDueDateStr = nextDueDateObj.toISOString().split('T')[0];
      const nextReminderDateObj = new Date(nextDueDateObj);
      nextReminderDateObj.setDate(nextReminderDateObj.getDate() - 1);
      const nextReminderDateStr = nextReminderDateObj.toISOString().split('T')[0];

      // Schedule next cycle's Google Calendar reminder automatically with Yellow color (colorId: "5")
      let nextCalEventId = activeBill.calendarEventId;
      let nextCalHtmlLink = activeBill.calendarHtmlLink;
      let calendarSyncStatus: 'synced' | 'error' = 'synced';

      if (activeBill.calendarReminderEnabled !== false) {
        try {
          const nextCalPayload = {
            title: `💳 Pay ${activeBill.name || activeBill.title}`,
            summary: `💳 Pay ${activeBill.name || activeBill.title}`,
            description: `Amount: ₹${activeBill.amount}\nCategory: ${activeBill.category}\nDue Date: ${nextDueDateStr}${activeBill.notes ? '\nNotes: ' + activeBill.notes : ''}\n\nCreated by TrackPay.`,
            startDate: nextReminderDateStr,
            startTime: activeBill.reminderTime || '20:00',
            date: nextReminderDateStr,
            time: activeBill.reminderTime || '20:00',
            dueDate: nextDueDateStr,
            notifyBefore: activeBill.notifyBefore || '1 day',
            recurring: false,
            amount: activeBill.amount,
            colorId: "5", // 🟡 Yellow / Upcoming
          };

          const nextCalResult = await SpendTrackApi.createCalendarEvent(nextCalPayload);
          if (nextCalResult && nextCalResult.success && nextCalResult.eventId) {
            nextCalEventId = nextCalResult.eventId;
            nextCalHtmlLink = nextCalResult.htmlLink;
            calendarSyncStatus = 'synced';
            console.log("Scheduled next cycle's Calendar Event ID:", nextCalEventId);
          }
        } catch (calErr) {
          console.warn('Auto next month calendar creation warning:', calErr);
          calendarSyncStatus = 'error';
        }
      }

      // Update recurring payment record in Google Sheets and React state for next cycle
      try {
        const finalUpdatedBill = await SpendTrackApi.updateRecurringExpense(targetIdToUpdate, {
          lastGeneratedMonth: currentMonthStr,
          isPaid: true,
          paidDate: today,
          dueDate: nextDueDateStr,
          reminderDate: nextReminderDateStr,
          dueDay: nextDueDateObj.getDate(),
          calendarEventId: nextCalEventId,
          calendarHtmlLink: nextCalHtmlLink,
          calendarSyncStatus,
        });

        setRecurringExpenses((prev) =>
          prev.map((r) =>
            r.id === targetIdToUpdate || r.id === finalUpdatedBill.id ? finalUpdatedBill : r
          )
        );
      } catch (nextCycleErr) {
        console.warn('Next cycle update warning:', nextCycleErr);
      }

      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      console.error('Failed to mark bill as paid:', err);
      // Rollback optimistic state if both attempts fail
      setExpenses(prevExpenses);
      setRecurringExpenses(prevRecurring);

      const cleanMessage = sanitizeErrorMessage(err?.message);
      setSyncStatus({ state: 'error', errorMessage: cleanMessage });
      throw new Error(cleanMessage);
    }
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
          ) : !isFirebaseConfigured ? (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-slate-800 p-4">
              <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                  !
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Firebase Configuration Required</h2>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {BRAND_NAME} requires valid Firebase Authentication configuration. Please ensure <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono text-xs">VITE_FIREBASE_API_KEY</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono text-xs">VITE_FIREBASE_AUTH_DOMAIN</code>, and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono text-xs">VITE_FIREBASE_PROJECT_ID</code> are configured.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Retry Configuration
                </button>
              </div>
            </div>
          ) : !user ? (
            <WelcomePage
              onSignIn={handleGoogleSignIn}
              isSigningIn={syncStatus.state === 'syncing'}
              errorMessage={syncStatus.state === 'error' ? syncStatus.errorMessage : null}
            />
          ) : (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="spendtrack-root">
              {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} durationMs={800} />}

      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-5 lg:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
          {/* Left: TrackPay Logo */}
          <div className="flex items-center shrink-0 select-none">
            <div
              onClick={() => setActiveTab('dashboard')}
              className="cursor-pointer"
            >
              <TrackPayLogo size="md" showText />
            </div>
          </div>

          {/* Center: Global Date Range Dropdown */}
          <div className="flex-1 flex justify-center min-w-0 px-1">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>

          {/* Center (Desktop): Exactly 4 Primary Navigation Tabs (Home, Expenses, Payments, AI) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-[16px] border border-slate-200/60 dark:border-slate-700/60 shrink-0">
            {[
              { key: 'dashboard', label: 'Home', icon: Home },
              { key: 'expenses', label: 'Expenses', icon: Receipt },
              { key: 'recurring', label: 'Payments', icon: CreditCard },
              { key: 'ai', label: 'AI', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`header-nav-${tab.key}`}
                  onClick={() => handleSelectTab(tab.key)}
                  className={`px-3.5 py-1.5 rounded-[12px] text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Sync Status + Bell + ☰ Hamburger Menu + Profile Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden xs:block">
              <SyncStatusBadge
                status={syncStatus}
                isOnline={isOnline}
                onRetry={loadDataFromWorkspace}
                compact={true}
              />
            </div>

            {/* Notification Bell Button */}
            <button
              onClick={() => setIsNotificationDrawerOpen(true)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-[14px] hover:bg-slate-100 dark:hover:bg-slate-800 relative cursor-pointer flex items-center justify-center border border-slate-200/80 dark:border-slate-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              {persistedNotifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black ring-2 ring-white dark:ring-slate-900">
                  {persistedNotifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {/* ☰ Hamburger Menu Button (Opens More Drawer) */}
            <button
              id="header-hamburger-menu-btn"
              onClick={() => setIsMoreDrawerOpen(true)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-[14px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center border border-slate-200/80 dark:border-slate-800 transition-colors"
              aria-label="More Features Menu"
              title="More Features (☰)"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* User Profile Avatar (Opens Profile Sheet) */}
            <button
              id="header-profile-avatar-btn"
              onClick={() => setIsProfileSheetOpen(true)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-[14px] bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-bold border-2 border-emerald-500 flex items-center justify-center text-xs cursor-pointer shadow-xs overflow-hidden transition-transform hover:scale-105 active:scale-95 shrink-0"
              aria-label="Profile and Account Settings"
              title="Profile & Account"
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
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
            onMarkAsPaid={handleMarkRecurringAsPaid}
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
            onRecordAsExpense={handleMarkRecurringAsPaid}
            onMarkAsPaid={handleMarkRecurringAsPaid}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            openAddModalOnMount={autoOpenRecurringModal}
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
            onSignOut={handleSignOut}
            onGoogleSignIn={handleGoogleSignIn}
            userEmail={user?.email}
            workspaceStatus={workspaceStatus}
            onRefreshWorkspace={loadDataFromWorkspace}
          />
        )}
      </main>

      {/* EXPANDABLE QUICK ADD FAB */}
      <QuickAddFAB
        onOpenExpense={() => {
          setEditingExpense(null);
          setInitialMonthlyItem(null);
          setIsAddExpenseOpen(true);
        }}
        onOpenStock={() => {
          setSelectedConsumeItem(null);
          setIsConsumeModalOpen(true);
        }}
        onOpenBill={() => {
          setAutoOpenRecurringModal(true);
          setActiveTab('recurring');
        }}
        onOpenScanReceipt={() => {
          setIsScanReceiptOpen(true);
        }}
      />

      {/* STREAMLINED 5-TAB MOBILE BOTTOM NAVIGATION */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 z-40 grid grid-cols-5 items-center h-16 pb-[env(safe-area-inset-bottom)] shadow-xl w-full max-w-[100vw]"
      >
        {/* 1. Home */}
        <button
          id="mobile-nav-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer w-full h-full min-h-[44px] ${
            activeTab === 'dashboard' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Home className="w-[22px] h-[22px] mb-0.5 stroke-[2]" />
          <span>Home</span>
        </button>

        {/* 2. Expenses */}
        <button
          id="mobile-nav-expenses"
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center justify-center py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer w-full h-full min-h-[44px] ${
            activeTab === 'expenses' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Receipt className="w-[22px] h-[22px] mb-0.5 stroke-[2]" />
          <span>Expenses</span>
        </button>

        {/* 3. Center Elevated + Add Button */}
        <div className="flex items-center justify-center w-full h-full">
          <button
            id="mobile-nav-add-btn"
            onClick={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setIsAddExpenseOpen(true);
            }}
            className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 border-4 border-slate-50 dark:border-slate-900 active:scale-95 transition-all duration-200 cursor-pointer -mt-5 shrink-0"
            title="Add Expense"
            aria-label="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Payments */}
        <button
          id="mobile-nav-payments"
          onClick={() => setActiveTab('recurring')}
          className={`flex flex-col items-center justify-center py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer w-full h-full min-h-[44px] ${
            activeTab === 'recurring' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CreditCard className="w-[22px] h-[22px] mb-0.5 stroke-[2]" />
          <span>Payments</span>
        </button>

        {/* 5. AI */}
        <button
          id="mobile-nav-ai"
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center justify-center py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer w-full h-full min-h-[44px] ${
            activeTab === 'ai' ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Sparkles className="w-[22px] h-[22px] mb-0.5 stroke-[2]" />
          <span>AI</span>
        </button>
      </nav>

      {/* Mobile More Features Drawer */}
      <MobileMoreDrawer
        isOpen={isMoreDrawerOpen}
        onClose={() => setIsMoreDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as any)}
      />

      {/* Profile & Account Sheet */}
      <ProfileSheet
        isOpen={isProfileSheetOpen}
        onClose={() => setIsProfileSheetOpen(false)}
        userEmail={user?.email}
        userName={user?.displayName || undefined}
        userPhotoUrl={user?.photoURL || undefined}
        onNavigateToSettings={() => setActiveTab('settings')}
        onSyncNow={loadDataFromWorkspace}
        onSignOut={handleSignOut}
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
