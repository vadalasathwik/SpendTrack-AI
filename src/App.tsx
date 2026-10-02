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
  Search,
  BookOpen,
  ArrowDownLeft,
  Wallet,
  Calendar,
  PieChart,
  Settings,
  LogOut,
  Layers,
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
import {
  signInWithGoogle,
  signOutApp,
  onAuthStateChange,
  clearAuthSession,
  getStoredJWT,
  refreshAccessToken,
  handleOAuthHashCallback,
  getStoredUserProfile,
} from './services/authService.js';
import { BRAND_NAME } from './constants/brand.js';

// UI Components
import { SpendTrackLogo } from './components/TrackPayLogo.js';
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
import { GlobalSearchModal } from './components/GlobalSearchModal.js';
import { FloatingAiCopilot } from './components/FloatingAiCopilot.js';
import { FinanceOnboardingWizard } from './components/FinanceOnboardingWizard.js';
import { HeaderLogo } from './components/ui/HeaderLogo.js';
import { SearchTrigger } from './components/ui/SearchTrigger.js';
import { MenuTrigger } from './components/ui/MenuTrigger.js';
import { MonthSelectorPill } from './components/ui/MonthSelectorPill.js';
import { FloatingDock } from './components/ui/FloatingDock.js';
import { BottomSheet } from './components/ui/BottomSheet.js';
import { ToastProvider, useToast } from './context/ToastContext.js';
import { ToastContainer } from './components/ui/ToastContainer.js';
import { AddIncomeModal } from './components/AddIncomeModal.js';
import { ConflictResolutionModal } from './components/ConflictResolutionModal.js';
import { offlineSyncManager } from './services/offlineSyncManager.js';
import { getCachedItems, saveAllCachedItems, OfflineMutation } from './services/offlineStore.js';
import { getStoredThemeMode, applyThemeMode } from './utils/theme.js';
import { OfflineBanner, SyncSuccessToast } from './components/ui/ErrorUI.js';
import { OfflineFallbackPage } from './pages/OfflineFallbackPage.js';
import { EmptyWorkspace } from './components/ui/EmptyWorkspace.js';


// Pages
import { DashboardPage } from './pages/DashboardPage.js';
import { ExpensesPage } from './pages/ExpensesPage.js';
import { MonthlyItemsPage } from './pages/MonthlyItemsPage.js';
import { ItemsAnalyticsPage } from './pages/ItemsAnalyticsPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { RecurringPage } from './pages/RecurringPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { CategoriesPage } from './pages/CategoriesPage.js';
import { AIAssistantPage } from './pages/AIAssistantPage.js';
import { WelcomePage } from './pages/WelcomePage.js';
import { BudgetAIPage } from './pages/BudgetAIPage.js';
import { BudgetDashboardPage } from './pages/BudgetDashboardPage.js';
import { ReceiptScannerPage } from './pages/ReceiptScannerPage.js';
import { Routes, Route } from 'react-router-dom';
import { PrivacyPolicy } from "./pages/PrivacyPolicy.js";
import { Terms } from "./pages/Terms.js";
import { FamilyWorkspacePage } from './pages/FamilyWorkspacePage.js';
import { FinancialNotebookPage } from './pages/FinancialNotebookPage.js';
import { MonthlyPlannerPage } from './pages/MonthlyPlannerPage.js';
import { WealthAllocationPage } from './pages/WealthAllocationPage.js';
import { EmisPage } from './pages/EmisPage.js';
import { InvestmentsPage } from './pages/InvestmentsPage.js';
import { SavingsPage } from './pages/SavingsPage.js';
import { FinanceHomePage } from './pages/FinanceHomePage.js';
import { NotificationCenterPage } from './pages/NotificationCenterPage.js';
import { FinanceHealthPage } from './pages/FinanceHealthPage.js';
import { NetWorthPage } from './pages/NetWorthPage.js';
import { GoalForecastPage } from './pages/GoalForecastPage.js';
import { AiCfoPage } from './pages/AiCfoPage.js';
import { FinancialInboxPage } from './pages/FinancialInboxPage.js';
import { PortfolioPage } from './pages/PortfolioPage.js';
import { GoldWorkspacePage } from './pages/GoldWorkspacePage.js';
import { InsuranceVaultPage } from './pages/InsuranceVaultPage.js';
import { DocumentVaultPage } from './pages/DocumentVaultPage.js';
import { SalaryIntelligencePage } from './pages/SalaryIntelligencePage.js';
import { TaxDashboardPage } from './pages/TaxDashboardPage.js';
import { AiExecutiveWorkspacePage } from './pages/AiExecutiveWorkspacePage.js';
import { QRVaultPage } from './pages/QRVaultPage.js';
import { WalletPage } from './pages/WalletPage.js';
import { ReceiptVaultPage } from './pages/ReceiptVaultPage.js';
import { ReceiptDetailPage } from './pages/ReceiptDetailPage.js';


const DATE_RANGE_STORAGE_KEY = 'spendtrack_date_range';
const ACTIVE_TAB_STORAGE_KEY = 'spendtrack_active_tab';

const VALID_TABS = new Set([
  'dashboard',
  'expenses',
  'planner',
  'wallet',
  'ai',
  'budget',
  'monthly-items',
  'items',
  'analytics',
  'notebook',
  'inbox',
  'notifications',
  'wealth',
  'emis',
  'investments',
  'savings',
  'recurring',
  'categories',
  'health',
  'networth',
  'goals',
  'aicfo',
  'portfolio',
  'gold',
  'insurance',
  'documents',
  'salary',
  'tax',
  'ai-executive',
  'qr-vault',
  'receipt-scanner',
  'settings',
  'family',
]);

const normalizeRoute = (rawStr?: string | null): string => {
  if (!rawStr) return 'dashboard';
  const clean = rawStr.replace(/^#/, '').replace(/^\//, '').trim().toLowerCase();

  // DANGER CHECK: Never treat OAuth parameters, tokens, query parameters, or errors as activeTab routes!
  if (
    clean.includes('access_token') ||
    clean.includes('token_type') ||
    clean.includes('error') ||
    clean.includes('=') ||
    clean.includes('&')
  ) {
    return 'dashboard';
  }

  // Canonical Primary Navigation Mappings
  if (clean === 'home' || clean === 'dashboard') return 'dashboard';
  if (clean === 'transactions' || clean === 'expenses') return 'expenses';
  if (clean === 'plan' || clean === 'planner') return 'planner';
  if (clean === 'vault' || clean === 'wallet') return 'wallet';
  if (clean === 'ai' || clean === 'copilot') return 'ai';

  // Check against valid module tabs set
  if (VALID_TABS.has(clean)) {
    return clean;
  }

  // Safe default fallback to Home (dashboard) for any unrecognized route or hash
  return 'dashboard';
};

const getModuleTitle = (tab: string): string => {
  switch (tab) {
    case 'dashboard':
      return 'Home';
    case 'expenses':
      return 'Transactions Ledger';
    case 'planner':
      return 'Monthly Plan & Reminders';
    case 'wallet':
      return 'Financial Vault';
    case 'ai':
      return 'AI Financial Copilot';
    case 'budget':
      return 'Monthly Budget';
    case 'monthly-items':
      return 'Monthly Catalog';
    case 'recurring':
      return 'Recurring Subscriptions';
    case 'notebook':
      return 'Financial Notebook';
    case 'inbox':
      return 'Financial Inbox';
    case 'wealth':
      return 'Wealth & Portfolio';
    case 'qr-vault':
      return 'QR & Payment Vault';
    case 'documents':
      return 'Document Vault';
    case 'family':
      return 'Family Workspace';
    case 'settings':
      return 'Account Settings';
    default:
      return tab.replace(/-/g, ' ').toUpperCase();
  }
};

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

const getInitialActiveTab = (): string => {
  try {
    const hash = window.location.hash;
    if (hash) {
      return normalizeRoute(hash);
    }
    const pathname = window.location.pathname;
    if (pathname && pathname !== '/') {
      return normalizeRoute(pathname);
    }
    const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (stored) {
      return normalizeRoute(stored);
    }
  } catch (err) {}
  return 'dashboard';
};

export function App() {
  const { showSuccess, showError } = useToast();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>(getInitialActiveTab());
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [lastSavedExpenseId, setLastSavedExpenseId] = useState<string | null>(null);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickAddSheetOpen, setIsQuickAddSheetOpen] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);

  // Collapsible Sidebar State with Persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('spendtrack-sidebar-collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('spendtrack-sidebar-collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const handleSelectTab = (tab: string, pushHistory = true) => {
    const normalized = normalizeRoute(tab);
    setActiveTab(normalized);
    try {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, normalized);

      let hashName = normalized;
      if (normalized === 'dashboard') hashName = 'home';
      if (normalized === 'expenses') hashName = 'transactions';
      if (normalized === 'planner') hashName = 'plan';
      if (normalized === 'wallet') hashName = 'vault';

      if (pushHistory && window.location.hash !== `#${hashName}`) {
        window.history.pushState({ tab: normalized }, '', `#${hashName}`);
      }
    } catch (err) {}
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const targetTab = normalizeRoute(hash);
        setActiveTab(targetTab);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Theme State with Persistence
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const saved = localStorage.getItem('trackpay_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch (e) {}
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    try {
      localStorage.setItem('trackpay_theme', theme);
    } catch (e) {}

    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

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
  const [incomes, setIncomes] = useState<any[]>([]);
  const [emis, setEmis] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [plannerSummary, setPlannerSummary] = useState<any>({
    income: 0,
    emi: 0,
    investments: 0,
    savings: 0,
    living: 0,
    buffer: 0,
  });
  const [cashFlow, setCashFlow] = useState<any>({
    income: 0,
    expenses: 0,
    emi: 0,
    investments: 0,
    savings: 0,
    freeCash: 0,
    savingRate: 0,
    emiRatio: 0,
  });
  const [upcomingTimeline, setUpcomingTimeline] = useState<any[]>([]);

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
  const [workspaceStatus, setWorkspaceStatus] = useState<any>(null);

  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Modals & Assistant State
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [addExpenseInitialMode, setAddExpenseInitialMode] = useState<'manual' | 'scan'>('manual');
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

  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [activeConflict, setActiveConflict] = useState<OfflineMutation | null>(null);

  // Load domain data from IndexedDB cache immediately on boot
  useEffect(() => {
    applyThemeMode(getStoredThemeMode());

    Promise.all([
      getCachedItems<Expense>('expenses'),
      getCachedItems<any>('incomes'),
      getCachedItems<any>('notes'),
      getCachedItems<any>('planner'),
    ]).then(([cachedExp, cachedInc, cachedNotes, cachedPlanner]) => {
      if (cachedExp && cachedExp.length > 0) setExpenses(cachedExp);
      if (cachedInc && cachedInc.length > 0) setIncomes(cachedInc);
      if (cachedNotes && cachedNotes.length > 0) setNotes(cachedNotes);
      if (cachedPlanner && cachedPlanner.length > 0) setReminders(cachedPlanner);
    }).catch(err => {
      console.warn('IndexedDB initial boot read notice:', err);
    });

    const unsubscribe = offlineSyncManager.subscribe((info) => {
      setIsOnline(offlineSyncManager.isOnline());
      if (info.activeConflict) {
        setActiveConflict(info.activeConflict);
      }
    });

    return unsubscribe;
  }, []);

  const handleOpenAIWithQuestion = (question: string) => {
    setAiInitialQuestion(question);
    setActiveTab('ai');
  };

  // Ref to prevent simultaneous workspace requests on startup
  const isWorkspaceLoadingRef = React.useRef(false);

  // Global Keyboard Shortcuts: Ctrl+K / Cmd+K (Search), Ctrl+J / Cmd+J (AI Copilot), Ctrl+N / Cmd+N (Notebook)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && key === 'j') {
        e.preventDefault();
        setActiveTab('ai');
      }
      if ((e.ctrlKey || e.metaKey) && key === 'n') {
        e.preventDefault();
        setActiveTab('notebook');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    let isMounted = true;

    const initAuth = async () => {
      try {
        // 1. Check for OAuth hash callback fragment (#access_token=...)
        const oauthUser = await handleOAuthHashCallback();
        if (oauthUser && isMounted) {
          setUser(oauthUser);
          setActiveTab('dashboard');
          setAuthLoading(false);
          return;
        }

        // 2. Otherwise attempt silent token refresh via HTTP-only cookie
        const token = await refreshAccessToken();
        if (token && isMounted) {
          setUser(getStoredUserProfile());
        } else if (isMounted) {
          setUser(null);
        }
      } catch (err) {
        console.warn('Auth init notice:', err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChange((currentUser) => {
      if (isMounted) {
        setUser(currentUser);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
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

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    try {
      setIsProvisioning(true);
      setProvisioningStep(0);
      setSyncStatus({ state: 'syncing' });
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      setSyncStatus({
        state: 'error',
        errorMessage: err.message || 'Google Sign-In failed',
      });
      setIsProvisioning(false);
    }
  };

  // Load all Workspace Data
  const loadDataFromWorkspace = async (force: boolean = false) => {
    if (authLoading || !user || !getStoredJWT()) {
      return;
    }
    if (isWorkspaceLoadingRef.current && !force) return;
    isWorkspaceLoadingRef.current = true;
    setSyncStatus({ state: 'syncing' });

    try {
      const status = await SpendTrackApi.checkWorkspaceStatus();
      setWorkspaceStatus(status);

      const [
        loadedExpenses,
        loadedRecurring,
        loadedCategories,
        loadedMonthly,
        loadedLogs,
        loadedSettings,
        loadedNotifs,
        loadedIncomes,
        loadedEmis,
        loadedInvestments,
        loadedSavings,
        loadedNotes,
        loadedReminders,
        loadedPlanner,
        loadedCashFlow,
        loadedUpcoming,
      ] = await Promise.all([
        SpendTrackApi.getExpenses(),
        SpendTrackApi.getRecurringExpenses(),
        SpendTrackApi.getCategories(),
        SpendTrackApi.getMonthlyItems(),
        SpendTrackApi.getConsumptionLogs(),
        SpendTrackApi.getSettings().catch(() => ({} as Record<string, string>)),
        SpendTrackApi.getNotifications().catch(() => []),
        SpendTrackApi.getIncomes().catch(() => []),
        SpendTrackApi.getEmis().catch(() => []),
        SpendTrackApi.getInvestments().catch(() => []),
        SpendTrackApi.getSavings().catch(() => []),
        SpendTrackApi.getNotes().catch(() => []),
        SpendTrackApi.getReminders().catch(() => []),
        SpendTrackApi.getPlannerSummary().catch(() => ({ income: 0, emi: 0, investments: 0, savings: 0, living: 0, buffer: 0 })),
        SpendTrackApi.getCashFlowCurrent().catch(() => ({ income: 0, expenses: 0, emi: 0, investments: 0, savings: 0, freeCash: 0, savingRate: 0, emiRatio: 0 })),
        SpendTrackApi.getUpcomingReminders().catch(() => []),
      ]);

      setExpenses(loadedExpenses || []);
      setRecurringExpenses(loadedRecurring || []);
      if (loadedCategories && loadedCategories.length > 0) {
        setCategories(loadedCategories);
      }
      setMonthlyItems(loadedMonthly || []);
      setConsumptionLogs(loadedLogs || []);
      setPersistedNotifications(loadedNotifs || []);
      setIncomes(loadedIncomes || []);
      setEmis(loadedEmis || []);
      setInvestments(loadedInvestments || []);
      setSavings(loadedSavings || []);
      setNotes(loadedNotes || []);
      setReminders(loadedReminders || []);
      setPlannerSummary(loadedPlanner || { income: 0, emi: 0, investments: 0, savings: 0, living: 0, buffer: 0 });
      setCashFlow(loadedCashFlow || { income: 0, expenses: 0, emi: 0, investments: 0, savings: 0, freeCash: 0, savingRate: 0, emiRatio: 0 });
      setUpcomingTimeline(loadedUpcoming || []);

      // Cache to IndexedDB for offline access
      saveAllCachedItems('expenses', loadedExpenses || []).catch(() => {});
      saveAllCachedItems('incomes', loadedIncomes || []).catch(() => {});
      saveAllCachedItems('notes', loadedNotes || []).catch(() => {});
      saveAllCachedItems('planner', loadedReminders || []).catch(() => {});


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
      let savedId = '';
      if (editingExpense) {
        const { result } = await offlineSyncManager.executeMutation<Expense>(
          'expenses',
          'UPDATE',
          expenseData,
          editingExpense.id,
          () => SpendTrackApi.updateExpense(editingExpense.id, expenseData)
        );
        setExpenses((prev) => prev.map((e) => (e.id === editingExpense.id ? result : e)));
        savedId = result.id;
        showSuccess('Expense Updated!', `Updated "${expenseData.itemName}" (₹${expenseData.totalPrice})`);
      } else {
        const tempId = `exp_${Date.now()}`;
        const { result } = await offlineSyncManager.executeMutation<Expense>(
          'expenses',
          'CREATE',
          expenseData,
          tempId,
          () => SpendTrackApi.createExpense(expenseData)
        );
        setExpenses((prev) => [result, ...prev]);
        savedId = result.id;
        showSuccess('Expense Saved!', `Recorded "${expenseData.itemName}" (₹${expenseData.totalPrice})`);
      }
      setLastSavedExpenseId(savedId);
      setActiveTab('expenses');
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      showError('Failed to Save Expense', err.message || 'Saving error');
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
        const tempId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        const { result } = await offlineSyncManager.executeMutation<Expense>(
          'expenses',
          'CREATE',
          exp,
          tempId,
          () => SpendTrackApi.createExpense(exp)
        );
        createdItems.push(result);
      }
      setExpenses((prev) => [...createdItems, ...prev]);
      if (createdItems.length > 0) {
        setLastSavedExpenseId(createdItems[0].id);
        showSuccess('Receipt Scanned!', `Recorded ${createdItems.length} expenses`);
        setActiveTab('expenses');
      }
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      showError('Failed to Save Scanned Expenses', err.message || 'Saving error');
      throw err;
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    setSyncStatus({ state: 'saving' });
    try {
      await offlineSyncManager.executeMutation(
        'expenses',
        'DELETE',
        {},
        expense.id,
        () => SpendTrackApi.deleteExpense(expense.id)
      );
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
      showSuccess('Expense Deleted', `Removed "${expense.itemName}"`);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      showError('Failed to Delete Expense', err.message || 'Delete error');
      throw err;
    }
  };

  // CRUD for Categories
  const handleCreateCategory = async (data: { name: string; color: string; icon: string }) => {
    setSyncStatus({ state: 'saving' });
    try {
      const created = await SpendTrackApi.createCategory(data);
      setCategories((prev) => [...prev.filter((c) => c.name !== created.name), created]);
      showSuccess('Category Created!', `Added "${created.name}"`);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      showError('Failed to Create Category', err.message);
      throw err;
    }
  };

  const handleUpdateCategory = async (id: string, data: { name: string; color: string; icon: string }) => {
    setSyncStatus({ state: 'saving' });
    try {
      const updated = await SpendTrackApi.updateCategory(id, data);
      setCategories((prev) =>
        prev.map((c) => ((c.id && c.id === id) || c.name === id ? updated : c))
      );
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setSyncStatus({ state: 'saving' });
    try {
      await SpendTrackApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id && c.name !== id));
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
      const savedPayment = await SpendTrackApi.createRecurringExpense(itemData);
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
      const updated = await SpendTrackApi.updateRecurringExpense(id, itemData);
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
      await SpendTrackApi.deleteRecurringExpense(item.id);
      setRecurringExpenses((prev) => prev.filter((r) => r.id !== item.id));
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      const cleanMsg = sanitizeErrorMessage(err.message);
      setSyncStatus({ state: 'error', errorMessage: cleanMsg });
      throw err;
    }
  };

  const handleProcessDueRecurring = async () => {
    setSyncStatus({ state: 'saving' });
    try {
      const result = await SpendTrackApi.processDueRecurringExpenses();
      if (result && (result as any).processedCount > 0) {
        const [freshExpenses, freshRecurring] = await Promise.all([
          SpendTrackApi.getExpenses(),
          SpendTrackApi.getRecurringExpenses(),
        ]);
        setExpenses(freshExpenses || []);
        setRecurringExpenses(freshRecurring || []);
      }
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  // Notebook & Planner Handlers
  const handleAddIncome = async (data: { title: string; amount: number; date?: string; paymentMethod?: string; notes?: string }) => {
    setSyncStatus({ state: 'saving' });
    try {
      const tempId = `inc_${Date.now()}`;
      const { result } = await offlineSyncManager.executeMutation(
        'incomes',
        'CREATE',
        data,
        tempId,
        () => SpendTrackApi.createIncome(data)
      );
      setIncomes((prev) => [result, ...prev]);
      const summary = await SpendTrackApi.getPlannerSummary().catch(() => ({ income: 0, emi: 0, investments: 0, savings: 0, living: 0, buffer: 0 }));
      setPlannerSummary(summary);
      showSuccess('Income Recorded!', `Saved "${data.title}" (+₹${data.amount})`);
      setLastSavedExpenseId(result?.id || tempId);
      setActiveTab('expenses');
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      showError('Failed to Save Income', err.message || 'Saving error');
      throw err;
    }
  };

  const handleDeleteIncome = async (id: string) => {
    setSyncStatus({ state: 'saving' });
    try {
      await offlineSyncManager.executeMutation(
        'incomes',
        'DELETE',
        {},
        id,
        () => SpendTrackApi.deleteIncome(id)
      );
      setIncomes((prev) => prev.filter((item) => item.id !== id));
      const summary = await SpendTrackApi.getPlannerSummary().catch(() => ({ income: 0, emi: 0, investments: 0, savings: 0, living: 0, buffer: 0 }));
      setPlannerSummary(summary);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleAddEmi = async (data: any) => {
    setSyncStatus({ state: 'saving' });
    try {
      const item = await SpendTrackApi.createEmi(data);
      setEmis((prev) => [...prev, item]);
      const summary = await SpendTrackApi.getPlannerSummary();
      setPlannerSummary(summary);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleUpdateEmi = async (id: string, data: any) => {
    setSyncStatus({ state: 'saving' });
    try {
      const updated = await SpendTrackApi.updateEmi(id, data);
      setEmis((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleDeleteEmi = async (id: string) => {
    setSyncStatus({ state: 'saving' });
    try {
      await SpendTrackApi.deleteEmi(id);
      setEmis((prev) => prev.filter((e) => e.id !== id));
      const summary = await SpendTrackApi.getPlannerSummary();
      setPlannerSummary(summary);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleAddInvestment = async (data: any) => {
    setSyncStatus({ state: 'saving' });
    try {
      const item = await SpendTrackApi.createInvestment(data);
      setInvestments((prev) => [...prev, item]);
      const summary = await SpendTrackApi.getPlannerSummary();
      setPlannerSummary(summary);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleUpdateInvestment = async (id: string, data: any) => {
    setSyncStatus({ state: 'saving' });
    try {
      const updated = await SpendTrackApi.updateInvestment(id, data);
      setInvestments((prev) => prev.map((i) => (i.id === id ? updated : i)));
      const summary = await SpendTrackApi.getPlannerSummary();
      setPlannerSummary(summary);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    setSyncStatus({ state: 'saving' });
    try {
      await SpendTrackApi.deleteInvestment(id);
      setInvestments((prev) => prev.filter((i) => i.id !== id));
      const summary = await SpendTrackApi.getPlannerSummary();
      setPlannerSummary(summary);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleAddSaving = async (data: any) => {
    setSyncStatus({ state: 'saving' });
    try {
      const item = await SpendTrackApi.createSaving(data);
      setSavings((prev) => [...prev, item]);
      const summary = await SpendTrackApi.getPlannerSummary();
      setPlannerSummary(summary);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleUpdateSaving = async (id: string, data: any) => {
    setSyncStatus({ state: 'saving' });
    try {
      const updated = await SpendTrackApi.updateSaving(id, data);
      setSavings((prev) => prev.map((s) => (s.id === id ? updated : s)));
      const summary = await SpendTrackApi.getPlannerSummary();
      setPlannerSummary(summary);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleDeleteSaving = async (id: string) => {
    setSyncStatus({ state: 'saving' });
    try {
      await SpendTrackApi.deleteSaving(id);
      setSavings((prev) => prev.filter((s) => s.id !== id));
      const summary = await SpendTrackApi.getPlannerSummary();
      setPlannerSummary(summary);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleSaveNote = async (content: string, title?: string, tags?: string, pinned?: boolean) => {
    setSyncStatus({ state: 'saving' });
    try {
      const tempId = `note_${Date.now()}`;
      const payload = { content, title, tags, pinned };
      const { result } = await offlineSyncManager.executeMutation(
        'notes',
        'CREATE',
        payload,
        tempId,
        () => SpendTrackApi.saveNote(content, title, tags, pinned)
      );
      setNotes([result]);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleAddReminder = async (data: { title: string; description?: string; dueDate: string; priority?: string }) => {
    setSyncStatus({ state: 'saving' });
    try {
      const tempId = `rem_${Date.now()}`;
      const { result } = await offlineSyncManager.executeMutation(
        'planner',
        'CREATE',
        data,
        tempId,
        () => SpendTrackApi.createReminder(data)
      );
      setReminders((prev) => [...prev, result]);
      const upcoming = await SpendTrackApi.getUpcomingReminders().catch(() => []);
      setUpcomingTimeline(upcoming);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleUpdateReminder = async (id: string, data: any) => {
    setSyncStatus({ state: 'saving' });
    try {
      const { result } = await offlineSyncManager.executeMutation(
        'planner',
        'UPDATE',
        data,
        id,
        () => SpendTrackApi.updateReminder(id, data)
      );
      setReminders((prev) => prev.map((r) => (r.id === id ? result : r)));
      const upcoming = await SpendTrackApi.getUpcomingReminders().catch(() => []);
      setUpcomingTimeline(upcoming);
      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      setSyncStatus({ state: 'error', errorMessage: err.message });
      throw err;
    }
  };

  const handleDeleteReminder = async (id: string) => {
    setSyncStatus({ state: 'saving' });
    try {
      await offlineSyncManager.executeMutation(
        'planner',
        'DELETE',
        {},
        id,
        () => SpendTrackApi.deleteReminder(id)
      );
      setReminders((prev) => prev.filter((r) => r.id !== id));
      const upcoming = await SpendTrackApi.getUpcomingReminders().catch(() => []);
      setUpcomingTimeline(upcoming);
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

  const handleMarkRecurringAsPaid = async (targetRecurring: RecurringExpense) => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonthStr = today.slice(0, 7);

    const activeBill = findMatchingRecurringBill(targetRecurring, recurringExpenses) || targetRecurring;

    if (activeBill.lastGeneratedMonth === currentMonthStr) {
      return;
    }

    const prevExpenses = [...expenses];
    const prevRecurring = [...recurringExpenses];

    const billCategoryStr =
      typeof activeBill.category === 'string'
        ? activeBill.category
        : activeBill.category?.name || 'Recurring Payment';

    const tempExpenseId = `exp-rec-${Date.now()}`;
    const optimisticExpense: Expense = {
      id: tempExpenseId,
      itemName: activeBill.name || activeBill.title || 'Recurring Bill',
      category: billCategoryStr,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

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
      const expensePayload = {
        itemName: activeBill.name || activeBill.title || 'Recurring Bill',
        category: billCategoryStr,
        subcategory: activeBill.subcategory,
        totalPrice: activeBill.amount,
        purchaseDate: today,
        notes: activeBill.notes ? `Recurring Bill: ${activeBill.notes}` : 'Recurring Bill Payment',
        source: 'recurring' as const,
        recurringId: activeBill.id,
      };

      const createdExpense = await SpendTrackApi.createExpense(expensePayload);

      setExpenses((prev) =>
        prev.map((e) => (e.id === tempExpenseId ? createdExpense : e))
      );

      const updatedBill = await SpendTrackApi.updateRecurringExpense(activeBill.id, {
        lastGeneratedMonth: currentMonthStr,
        isPaid: true,
        paidDate: today,
      });

      setRecurringExpenses((prev) =>
        prev.map((r) => (r.id === activeBill.id ? updatedBill : r))
      );

      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      console.error('Failed to mark bill as paid:', err);
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
      <Route path="/offline" element={<OfflineFallbackPage />} />
      <Route
        path="*"
        element={
          authLoading ? (
            <SplashScreen onFinish={() => {}} durationMs={1200} />
          ) : !user ? (
            <WelcomePage
              onSignIn={handleGoogleSignIn}
              isSigningIn={syncStatus.state === 'syncing'}
              errorMessage={syncStatus.state === 'error' ? syncStatus.errorMessage : null}
            />
          ) : (
            <div className="min-h-screen bg-[var(--bg)] flex flex-col lg:flex-row font-sans text-[var(--text-primary)] transition-colors duration-200" id="spendtrack-root">
              {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} durationMs={1200} />}
              <OfflineBanner isOffline={!isOnline} />

              {/* DESKTOP SIDEBAR NAVIGATION (>= 1024px / lg) */}
              <aside
                className={`hidden lg:flex flex-col justify-between ${
                  isSidebarCollapsed ? 'w-[72px]' : 'w-60 xl:w-64'
                } bg-slate-900 border-r border-slate-800 p-3 sticky top-0 h-screen select-none shrink-0 z-30 transition-[width] duration-300 ease-in-out`}
              >
                {/* Fixed Top Section: Brand & Primary Core Nav */}
                <div className="space-y-4 shrink-0">
                  {/* Brand Header — Single Expand/Collapse Toggle Button */}
                  <div className="px-1 py-1 min-h-[40px]">
                    <button
                      type="button"
                      onClick={toggleSidebar}
                      aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                      aria-expanded={!isSidebarCollapsed}
                      title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                      className={`w-full flex items-center ${
                        isSidebarCollapsed ? 'justify-center py-1' : 'justify-start gap-3 p-1.5'
                      } rounded-2xl hover:bg-slate-800/60 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none group shrink-0 min-h-[44px]`}
                    >
                      {isSidebarCollapsed ? (
                        <SpendTrackLogo size="sm" className="group-hover:scale-105 transition-transform shrink-0" />
                      ) : (
                        <>
                          <SpendTrackLogo size="md" className="group-hover:scale-105 transition-transform shrink-0" />
                          <div className="flex flex-col text-left min-w-0">
                            <span className="text-base font-black text-white tracking-tight leading-none group-hover:text-emerald-400 transition-colors truncate">
                              SpendTrack <span className="text-emerald-400">AI</span>
                            </span>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400/90 mt-0.5 truncate">
                              Finance OS
                            </span>
                          </div>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Primary Core Navigation */}
                  <div className="space-y-1">
                    {!isSidebarCollapsed && (
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 block mb-1">
                        Main Core
                      </span>
                    )}

                    {[
                      { id: 'dashboard', label: 'Home', icon: Home },
                      { id: 'expenses', label: 'Transactions', icon: Receipt },
                      { id: 'planner', label: 'Plan & Reminders', icon: Calendar },
                      { id: 'wallet', label: 'Financial Vault', icon: Wallet },
                      { id: 'ai', label: 'AI Copilot', icon: Sparkles, badge: 'AI' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectTab(item.id)}
                          title={item.label}
                          aria-label={item.label}
                          className={`w-full flex items-center ${
                            isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2.5'
                          } rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                            {!isSidebarCollapsed && <span>{item.label}</span>}
                          </div>
                          {!isSidebarCollapsed && item.badge && (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Middle Workspace Modules (Scrollable if needed, hidden visual scrollbars) */}
                <div className="flex-1 overflow-y-auto min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-3 space-y-1 border-t border-slate-800/80 my-2">
                  {!isSidebarCollapsed && (
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 block mb-1">
                      WORKSPACE
                    </span>
                  )}

                  {[
                    { id: 'budget', label: 'Monthly Budget', icon: PieChart },
                    { id: 'monthly-items', label: 'Monthly Catalog', icon: Layers },
                    { id: 'recurring', label: 'Recurring Subscriptions', icon: BookOpen },
                    { id: 'notebook', label: 'Financial Notebook', icon: BookOpen },
                    { id: 'inbox', label: 'Financial Inbox', icon: Bell },
                    { id: 'wealth', label: 'Wealth & Portfolio', icon: TrendingUp },
                    { id: 'qr-vault', label: 'QR & Payment Vault', icon: CreditCard },
                    { id: 'family', label: 'Family Workspace', icon: User },
                  ].map((mod) => {
                    const Icon = mod.icon;
                    const isActive = activeTab === mod.id;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleSelectTab(mod.id)}
                        title={mod.label}
                        aria-label={mod.label}
                        className={`w-full flex items-center ${
                          isSidebarCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2'
                        } rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-800 text-emerald-400 font-extrabold'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        {!isSidebarCollapsed && <span className="truncate">{mod.label}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Profile & Settings (Fixed) */}
                <div className="pt-2 border-t border-slate-800 shrink-0 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTab('settings')}
                    title="Settings"
                    aria-label="Settings"
                    className={`w-full flex items-center ${
                      isSidebarCollapsed ? 'justify-center px-0 py-2' : 'justify-between px-3 py-2'
                    } rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-slate-800 text-emerald-400'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                      <Settings className="w-4 h-4 shrink-0" />
                      {!isSidebarCollapsed && <span>Settings</span>}
                    </div>
                  </button>

                  <div className={`p-1.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center ${
                    isSidebarCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between gap-2'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setIsProfileSheetOpen(true)}
                      title="Account profile"
                      aria-label="Account profile"
                      className={`flex items-center ${
                        isSidebarCollapsed ? 'justify-center' : 'gap-2.5 min-w-0 flex-1'
                      } text-left cursor-pointer group`}
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs border border-emerald-400 flex items-center justify-center shrink-0 overflow-hidden">
                        {(user?.photoUrl || user?.photoURL) ? (
                          <img src={user.photoUrl || user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          user?.name ? user.name.substring(0, 2).toUpperCase() : (user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : (user?.email ? user.email.substring(0, 2).toUpperCase() : 'ST'))
                        )}
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-white truncate block group-hover:text-emerald-400 transition-colors">
                            {user?.displayName || user?.name || 'Member Account'}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {user?.email || 'Logged In'}
                          </span>
                        </div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      title="Sign Out"
                      aria-label="Sign Out"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </aside>

              {/* MAIN WORKSPACE CONTENT CONTAINER */}
              <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                {/* Top Application Header */}
                <header className="sticky top-0 z-40 h-[68px] sm:h-[76px] bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/90 px-4 sm:px-6 flex items-center justify-between shadow-xs transition-colors">
                  <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-0">
                    {/* Left: SpendTrack AI Branding (Consistent across mobile & desktop) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <HeaderLogo onClick={() => handleSelectTab('dashboard')} />
                    </div>

                    {/* Center: Month Selector Pill */}
                    <div className="flex-1 justify-center flex min-w-0 px-2">
                      <MonthSelectorPill
                        dateRange={dateRange}
                        onChangeDateRange={handleDateRangeChange}
                      />
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsQuickAddSheetOpen(true)}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Quick Add</span>
                      </button>
                      <SyncStatusBadge onOpenConflictModal={() => setIsConflictModalOpen(true)} />
                      <SearchTrigger onOpenSearch={() => setIsSearchOpen(true)} />
                      <button
                        type="button"
                        id="google-profile-header-avatar"
                        onClick={() => setIsProfileSheetOpen(true)}
                        className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black text-xs border-2 border-emerald-400 flex items-center justify-center shrink-0 overflow-hidden shadow-sm cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-transform"
                        title="Open profile"
                        aria-label="Open profile"
                      >
                        {(user?.photoUrl || user?.photoURL) ? (
                          <img src={user.photoUrl || user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          user?.name ? user.name.substring(0, 2).toUpperCase() : (user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : (user?.email ? user.email.substring(0, 2).toUpperCase() : 'ST'))
                        )}
                      </button>
                    </div>
                  </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] lg:pb-10">
                  {activeTab === 'dashboard' && (
          <FinanceHomePage
            user={user}
            cashFlow={cashFlow}
            upcomingTimeline={upcomingTimeline}
            expenses={expenses}
            dateRange={dateRange}
            userSettings={userSettings}
            incomes={incomes}
            emis={emis}
            investments={investments}
            savings={savings}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setAddExpenseInitialMode('manual');
              setIsAddExpenseOpen(true);
            }}
            onOpenAddIncome={() => setIsAddIncomeOpen(true)}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
            onOpenScanReceipt={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setAddExpenseInitialMode('scan');
              setIsAddExpenseOpen(true);
            }}
            onOpenWizard={() => setIsWizardOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onAddIncome={handleAddIncome}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletPage />
        )}

        {activeTab === 'receipts' && !selectedReceiptId && (
          <ReceiptVaultPage
            onSelectReceipt={(id) => setSelectedReceiptId(id)}
            onOpenScanner={() => {
              setAddExpenseInitialMode('scan');
              setIsAddExpenseOpen(true);
            }}
          />
        )}

        {activeTab === 'receipts' && selectedReceiptId && (
          <ReceiptDetailPage
            receiptId={selectedReceiptId}
            onBack={() => setSelectedReceiptId(null)}
          />
        )}

        {activeTab === 'inbox' && (
          <FinancialInboxPage
            emis={emis}
            investments={investments}
            savings={savings}
            recurringExpenses={recurringExpenses}
            reminders={reminders}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
            onSaveNote={handleSaveNote}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationCenterPage
            reminders={reminders}
            upcomingTimeline={upcomingTimeline}
            onAddReminder={handleAddReminder}
            onUpdateReminder={handleUpdateReminder}
            onDeleteReminder={handleDeleteReminder}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetDashboardPage
            expenses={expenses}
            userSettings={userSettings}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setIsAddExpenseOpen(true);
            }}
          />
        )}

        {activeTab === 'family' && (
          <FamilyWorkspacePage />
        )}

        {activeTab === 'expenses' && (
          <ExpensesPage
            expenses={expenses}
            incomes={incomes}
            categories={categories}
            dateRange={dateRange}
            lastSavedExpenseId={lastSavedExpenseId}
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

        {activeTab === 'notebook' && (
          <FinancialNotebookPage
            incomes={incomes}
            emis={emis}
            investments={investments}
            savings={savings}
            notes={notes}
            onAddIncome={handleAddIncome}
            onDeleteIncome={handleDeleteIncome}
            onAddEmi={handleAddEmi}
            onUpdateEmi={handleUpdateEmi}
            onDeleteEmi={handleDeleteEmi}
            onAddInvestment={handleAddInvestment}
            onUpdateInvestment={handleUpdateInvestment}
            onDeleteInvestment={handleDeleteInvestment}
            onAddSaving={handleAddSaving}
            onUpdateSaving={handleUpdateSaving}
            onDeleteSaving={handleDeleteSaving}
            onSaveNote={handleSaveNote}
          />
        )}

        {activeTab === 'planner' && (
          <MonthlyPlannerPage
            incomes={incomes}
            emis={emis}
            investments={investments}
            savings={savings}
            recurringExpenses={recurringExpenses}
            expenses={expenses}
            onOpenBudgets={() => setActiveTab('budget')}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setIsAddExpenseOpen(true);
            }}
          />
        )}

        {activeTab === 'wealth' && (
          <WealthAllocationPage plannerSummary={plannerSummary} />
        )}

        {activeTab === 'emis' && (
          <EmisPage
            incomes={incomes}
            emis={emis}
            investments={investments}
            savings={savings}
            notes={notes}
            onAddIncome={handleAddIncome}
            onDeleteIncome={handleDeleteIncome}
            onAddEmi={handleAddEmi}
            onUpdateEmi={handleUpdateEmi}
            onDeleteEmi={handleDeleteEmi}
            onAddInvestment={handleAddInvestment}
            onUpdateInvestment={handleUpdateInvestment}
            onDeleteInvestment={handleDeleteInvestment}
            onAddSaving={handleAddSaving}
            onUpdateSaving={handleUpdateSaving}
            onDeleteSaving={handleDeleteSaving}
            onSaveNote={handleSaveNote}
          />
        )}

        {activeTab === 'investments' && (
          <InvestmentsPage
            incomes={incomes}
            emis={emis}
            investments={investments}
            savings={savings}
            notes={notes}
            onAddIncome={handleAddIncome}
            onDeleteIncome={handleDeleteIncome}
            onAddEmi={handleAddEmi}
            onUpdateEmi={handleUpdateEmi}
            onDeleteEmi={handleDeleteEmi}
            onAddInvestment={handleAddInvestment}
            onUpdateInvestment={handleUpdateInvestment}
            onDeleteInvestment={handleDeleteInvestment}
            onAddSaving={handleAddSaving}
            onUpdateSaving={handleUpdateSaving}
            onDeleteSaving={handleDeleteSaving}
            onSaveNote={handleSaveNote}
          />
        )}

        {activeTab === 'savings' && (
          <SavingsPage
            incomes={incomes}
            emis={emis}
            investments={investments}
            savings={savings}
            notes={notes}
            onAddIncome={handleAddIncome}
            onDeleteIncome={handleDeleteIncome}
            onAddEmi={handleAddEmi}
            onUpdateEmi={handleUpdateEmi}
            onDeleteEmi={handleDeleteEmi}
            onAddInvestment={handleAddInvestment}
            onUpdateInvestment={handleUpdateInvestment}
            onDeleteInvestment={handleDeleteInvestment}
            onAddSaving={handleAddSaving}
            onUpdateSaving={handleUpdateSaving}
            onDeleteSaving={handleDeleteSaving}
            onSaveNote={handleSaveNote}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringPage
            recurringExpenses={recurringExpenses}
            categories={categories}
            onAddRecurring={handleAddRecurring}
            onUpdateRecurring={handleUpdateRecurring}
            onDeleteRecurring={handleDeleteRecurring}
            onProcessDue={handleProcessDueRecurring}
            onGenerateDueBills={handleProcessDueRecurring}
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
            onRefreshData={() => {
              getCachedItems<Expense>('expenses').then(exp => exp && setExpenses(exp));
              getCachedItems<any>('incomes').then(inc => inc && setIncomes(inc));
            }}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesPage
            categories={categories}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'health' && (
          <FinanceHealthPage onNavigateToTab={(tab) => setActiveTab(tab as any)} />
        )}

        {activeTab === 'networth' && (
          <NetWorthPage />
        )}

        {activeTab === 'goals' && (
          <GoalForecastPage />
        )}

        {activeTab === 'aicfo' && (
          <AiCfoPage />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioPage />
        )}

        {activeTab === 'gold' && (
          <GoldWorkspacePage />
        )}

        {activeTab === 'insurance' && (
          <InsuranceVaultPage />
        )}

        {activeTab === 'documents' && (
          <DocumentVaultPage />
        )}

        {activeTab === 'salary' && (
          <SalaryIntelligencePage />
        )}

        {activeTab === 'tax' && (
          <TaxDashboardPage />
        )}

        {activeTab === 'ai-executive' && (
          <AiExecutiveWorkspacePage />
        )}

        {activeTab === 'qr-vault' && (
          <QRVaultPage />
        )}

        {activeTab === 'receipt-scanner' && (
          <ReceiptScannerPage
            categories={categories}
            onSaveExpense={handleSaveExpense}
            onNavigateToExpenses={() => setActiveTab('expenses')}
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
            onNavigateToCategories={() => setActiveTab('categories')}
            onSignOut={handleSignOut}
            onGoogleSignIn={handleGoogleSignIn}
            userEmail={user?.email}
            workspaceStatus={workspaceStatus}
            onRefreshWorkspace={loadDataFromWorkspace}
            themeMode={theme}
            onChangeThemeMode={(mode) => setTheme(mode)}
          />
        )}

        {!VALID_TABS.has(activeTab) && (
          <FinanceHomePage
            user={user}
            cashFlow={cashFlow}
            upcomingTimeline={upcomingTimeline}
            expenses={expenses}
            dateRange={dateRange}
            userSettings={userSettings}
            incomes={incomes}
            emis={emis}
            investments={investments}
            savings={savings}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setAddExpenseInitialMode('manual');
              setIsAddExpenseOpen(true);
            }}
            onOpenAddIncome={() => setIsAddIncomeOpen(true)}
            onNavigateToTab={(tab) => handleSelectTab(tab)}
            onOpenScanReceipt={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setAddExpenseInitialMode('scan');
              setIsAddExpenseOpen(true);
            }}
            onOpenWizard={() => setIsWizardOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onAddIncome={handleAddIncome}
          />
        )}
      </main>

      {/* FLOATING DOCK NAVIGATION */}
      <FloatingDock
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        onOpenQuickAdd={() => setIsQuickAddSheetOpen(true)}
      />

      {/* QUICK ADD ACTION BOTTOM SHEET */}
      <BottomSheet
        isOpen={isQuickAddSheetOpen}
        onClose={() => setIsQuickAddSheetOpen(false)}
        title="Quick Add Action"
        subtitle="Create a record across SpendTrack AI Finance OS"
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setIsQuickAddSheetOpen(false);
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setIsAddExpenseOpen(true);
            }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 font-extrabold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-6 h-6 text-emerald-400" />
            <span>Add Expense</span>
          </button>

          <button
            onClick={() => {
              setIsQuickAddSheetOpen(false);
              setIsAddIncomeOpen(true);
            }}
            className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500 text-cyan-400 font-extrabold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <ArrowDownLeft className="w-6 h-6 text-cyan-400" />
            <span>Add Income</span>
          </button>

          <button
            onClick={() => {
              setIsQuickAddSheetOpen(false);
              setAddExpenseInitialMode('scan');
              setIsAddExpenseOpen(true);
            }}
            className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500 text-purple-400 font-extrabold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Receipt className="w-6 h-6 text-purple-400" />
            <span>Scan Receipt</span>
          </button>

          <button
            onClick={() => {
              setIsQuickAddSheetOpen(false);
              setActiveTab('notebook');
            }}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500 text-amber-400 font-extrabold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <BookOpen className="w-6 h-6 text-amber-400" />
            <span>Add Note</span>
          </button>

          <button
            onClick={() => {
              setIsQuickAddSheetOpen(false);
              setActiveTab('notifications');
            }}
            className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:border-blue-500 text-blue-400 font-extrabold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Bell className="w-6 h-6 text-blue-400" />
            <span>Add Reminder</span>
          </button>
        </div>
      </BottomSheet>

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
        userName={user?.displayName || user?.name || undefined}
        userPhotoUrl={user?.photoUrl || user?.photoURL || undefined}
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
          setAddExpenseInitialMode('manual');
        }}
        onSave={handleSaveExpense}
        categories={categories}
        editExpense={editingExpense}
        initialMode={addExpenseInitialMode}
        expenses={expenses}
      />

      {/* Add Income Modal */}
      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
        onSave={handleAddIncome}
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
        expenses={expenses}
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
        onClose={() => setIsOnboardingOpen(false)}
        onSave={handleSaveUserSettings}
      />

      {/* PWA Install Banner */}
      <PWAInstallPrompt />

      {/* Floating AI CFO Copilot */}
      <FloatingAiCopilot activeTab={activeTab} />

      {/* 6-Step Setup Wizard Modal */}
      <FinanceOnboardingWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={async (homeMode) => {
          setIsWizardOpen(false);
          setUserSettings((prev) => ({ ...prev, homeMode: homeMode as any }));
          await loadDataFromWorkspace(true);
          if (process.env.NODE_ENV !== 'production') {
            console.log('✓ Workspace refreshed');
            console.log('✓ Dashboard recalculated');
          }
        }}
      />

      {/* Global Toast Container */}
      <ToastContainer />

      {/* Global Search Overlay Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        expenses={expenses}
        notes={notes}
        emis={emis}
        investments={investments}
        goals={goals}
        reminders={reminders}
        onSelectTab={(tab) => setActiveTab(tab as any)}
      />
      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={isConflictModalOpen || activeConflict !== null}
        onClose={() => setIsConflictModalOpen(false)}
        conflict={activeConflict}
        onResolve={async (mutationId, resolution) => {
          await offlineSyncManager.resolveConflict(mutationId, resolution);
          setActiveConflict(null);
        }}
      />
    </div>
    </div>
          )
        }
      />
    </Routes>
  );
}

export default function AppWithProviders() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}
