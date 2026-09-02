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
} from 'lucide-react';
import {
  Expense,
  RecurringExpense,
  CategoryItem,
  DateRange,
  SyncStatus,
  MonthlyItem,
} from './types';
import {
  DEFAULT_CATEGORIES,
  INITIAL_SAMPLE_EXPENSES,
  INITIAL_RECURRING_EXPENSES,
  DEFAULT_MONTHLY_ITEMS,
} from './data/defaults';
import { getDateRangeFromPreset } from './utils/dateRanges';
import { SpendTrackApi } from './services/api';
import { signInWithGoogle, signOutApp, onAuthStateChange } from './services/authService';

// UI Components
import { SyncStatusBadge } from './components/SyncStatusBadge';
import { DateRangePicker } from './components/DateRangePicker';
import { AddExpenseModal } from './components/AddExpenseModal';
import { MobileMoreDrawer } from './components/MobileMoreDrawer';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { MonthlyItemsPage } from './pages/MonthlyItemsPage';
import { ItemsAnalyticsPage } from './pages/ItemsAnalyticsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RecurringPage } from './pages/RecurringPage';
import { SettingsPage } from './pages/SettingsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'expenses' | 'monthly-items' | 'items' | 'analytics' | 'recurring' | 'ai' | 'settings'
  >('dashboard');
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Date Range State
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('currentMonth'));

  // Data Store
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [monthlyItems, setMonthlyItems] = useState<MonthlyItem[]>(DEFAULT_MONTHLY_ITEMS);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);

  // Sync / Workspace status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'idle' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [workspaceStatus, setWorkspaceStatus] = useState<{ spreadsheetId: string; driveFolders: any } | null>(null);

  // Modals & Assistant State
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
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
        // Use initial demo data when offline / preview mode
        setExpenses(INITIAL_SAMPLE_EXPENSES);
        setRecurringExpenses(INITIAL_RECURRING_EXPENSES);
        setMonthlyItems(DEFAULT_MONTHLY_ITEMS);
      }
    });
    return () => unsubscribe();
  }, []);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    try {
      setSyncStatus({ state: 'syncing' });
      const res = await signInWithGoogle();
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
    }
  };

  // Load all Workspace Data
  const loadDataFromWorkspace = async () => {
    setSyncStatus({ state: 'syncing' });
    try {
      const status = await SpendTrackApi.checkWorkspaceStatus();
      setWorkspaceStatus(status);

      const [loadedExpenses, loadedRecurring, loadedCategories, loadedMonthly] = await Promise.all([
        SpendTrackApi.getExpenses(),
        SpendTrackApi.getRecurringExpenses(),
        SpendTrackApi.getCategories(),
        SpendTrackApi.getMonthlyItems(),
      ]);

      if (loadedExpenses.length > 0) {
        setExpenses(loadedExpenses);
      } else {
        setExpenses(INITIAL_SAMPLE_EXPENSES);
      }

      if (loadedRecurring.length > 0) {
        setRecurringExpenses(loadedRecurring);
      } else {
        setRecurringExpenses(INITIAL_RECURRING_EXPENSES);
      }

      if (loadedCategories.length > 0) {
        setCategories(loadedCategories);
      }

      if (loadedMonthly.length > 0) {
        setMonthlyItems(loadedMonthly);
      } else {
        setMonthlyItems(DEFAULT_MONTHLY_ITEMS);
      }

      setSyncStatus({ state: 'saved', lastSyncedAt: new Date() });
    } catch (err: any) {
      console.warn('Workspace sync notice:', err.message);
      setSyncStatus({
        state: 'error',
        errorMessage: err.message || 'Running in local preview mode',
      });
      // Fallback
      if (expenses.length === 0) setExpenses(INITIAL_SAMPLE_EXPENSES);
      if (recurringExpenses.length === 0) setRecurringExpenses(INITIAL_RECURRING_EXPENSES);
      if (monthlyItems.length === 0) setMonthlyItems(DEFAULT_MONTHLY_ITEMS);
    }
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="spendtrack-root">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
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
                <span className="font-black text-lg tracking-tight text-slate-900">SPENDTRACK</span>
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

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
          <nav className="flex space-x-6 overflow-x-auto scrollbar-none">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { key: 'expenses', label: 'Expenses', icon: Receipt },
              { key: 'monthly-items', label: 'Monthly Items', icon: ShoppingCart },
              { key: 'items', label: 'Item Intelligence', icon: Sparkles },
              { key: 'recurring', label: 'Recurring Bills', icon: Repeat },
              { key: 'ai', label: 'SpendTrack AI', icon: Bot, highlight: true },
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
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setIsAddExpenseOpen(true);
            }}
            onViewExpenseHistory={() => setActiveTab('expenses')}
            onViewMonthlyItems={() => setActiveTab('monthly-items')}
            onSelectItemAnalytics={(itemName) => {
              setSelectedAnalyticsItem(itemName);
              setActiveTab('items');
            }}
            onOpenAIWithQuestion={handleOpenAIWithQuestion}
            onQuickAddFromItem={handleQuickAddPurchaseFromTemplate}
          />
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
            onSaveMonthlyItem={handleSaveMonthlyItem}
            onDeleteMonthlyItem={handleDeleteMonthlyItem}
            onToggleMonthlyItem={handleToggleMonthlyItem}
            onQuickAddPurchase={handleQuickAddPurchaseFromTemplate}
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
            onSaveCategories={async (cats) => {
              setCategories(cats);
              await SpendTrackApi.saveCategories(cats);
            }}
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

      {/* STREAMLINED MOBILE BOTTOM NAVIGATION (5 High-Impact Actions) */}
      <div
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 px-3 py-2 shadow-xl flex justify-between items-center"
      >
        {/* 1. Dashboard */}
        <button
          id="mobile-nav-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer ${
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
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer ${
            activeTab === 'expenses' ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span>Expenses</span>
        </button>

        {/* 3. Center Elevated Quick Add Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            id="mobile-nav-add-btn"
            onClick={() => {
              setEditingExpense(null);
              setInitialMonthlyItem(null);
              setIsAddExpenseOpen(true);
            }}
            className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 border-4 border-slate-50 active:scale-95 transition-all cursor-pointer"
            title="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Analytics & Item Intelligence */}
        <button
          id="mobile-nav-items"
          onClick={() => setActiveTab('items')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer ${
            activeTab === 'items' ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span>Analytics</span>
        </button>

        {/* 5. More Drawer Trigger */}
        <button
          id="mobile-nav-more"
          onClick={() => setIsMoreDrawerOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer ${
            ['monthly-items', 'recurring', 'ai', 'settings'].includes(activeTab)
              ? 'text-emerald-600 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </div>

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
    </div>
  );
}

export default App;
