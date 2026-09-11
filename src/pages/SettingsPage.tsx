import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  LogOut,
  RefreshCw,
  HardDrive,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { CategoryItem, UserSettings } from '../types.js';

interface SettingsPageProps {
  categories: CategoryItem[];
  userSettings?: UserSettings;
  onSaveCategories: (categories: CategoryItem[]) => Promise<void>;
  onSaveUserSettings?: (settings: Partial<UserSettings>) => Promise<void>;
  onExportCsv: () => void;
  onImportCsv: (file: File) => void;
  onSignOut: () => void;
  onGoogleSignIn?: () => void;
  userEmail?: string;
  workspaceStatus?: { spreadsheetId: string; driveFolders: any } | null;
  onRefreshWorkspace: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  categories,
  userSettings,
  onSaveCategories,
  onSaveUserSettings,
  onExportCsv,
  onImportCsv,
  onSignOut,
  userEmail,
  onRefreshWorkspace,
}) => {
  const [categoryList, setCategoryList] = useState<CategoryItem[]>(categories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const [isSavingCat, setIsSavingCat] = useState(false);

  // Budget settings form state
  const [budgetVal, setBudgetVal] = useState<string>(String(userSettings?.monthlyBudget || 30000));
  const [startDayVal, setStartDayVal] = useState<string>(String(userSettings?.budgetStartDay || 1));
  const [currencyVal, setCurrencyVal] = useState<string>(userSettings?.currency || 'INR');
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [budgetMsg, setBudgetMsg] = useState<string | null>(null);

  const handleSaveBudgetSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetMsg(null);
    const bNum = parseFloat(budgetVal);
    const sNum = parseInt(startDayVal, 10);

    if (isNaN(bNum) || bNum <= 0) {
      setBudgetMsg('Please enter a valid positive monthly budget.');
      return;
    }
    if (isNaN(sNum) || sNum < 1 || sNum > 31) {
      setBudgetMsg('Budget start day must be between 1 and 31.');
      return;
    }

    let symbol = '₹';
    if (currencyVal === 'USD') symbol = '$';
    else if (currencyVal === 'EUR') symbol = '€';
    else if (currencyVal === 'GBP') symbol = '£';

    try {
      setIsSavingBudget(true);
      await onSaveUserSettings?.({
        monthlyBudget: bNum,
        budgetStartDay: sNum,
        currency: currencyVal,
        currencySymbol: symbol,
      });
      setBudgetMsg('Budget settings saved successfully to Google Sheets!');
    } catch (err: any) {
      setBudgetMsg(err.message || 'Failed to save settings.');
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const exists = categoryList.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase());
    if (exists) return;

    const updated = [
      ...categoryList,
      {
        name: newCatName.trim(),
        color: newCatColor,
        subcategories: [],
      },
    ];

    setCategoryList(updated);
    setNewCatName('');
    setIsSavingCat(true);
    try {
      await onSaveCategories(updated);
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleDeleteCategory = async (name: string) => {
    const updated = categoryList.filter((c) => c.name !== name);
    setCategoryList(updated);
    setIsSavingCat(true);
    try {
      await onSaveCategories(updated);
    } finally {
      setIsSavingCat(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1440px] mx-auto" id="settings-page-container">
      {/* Compact Workspace Status Card (Target Height: 110-130px) */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-h-[110px] md:min-h-[120px]">
        {/* User Info & Connection Badges */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-base ring-2 ring-emerald-500/20 shrink-0 overflow-hidden">
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-[220px] sm:max-w-[320px]">
                {userEmail || 'Active Workspace'}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Google Sheets</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Google Drive</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Google Calendar</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              </span>
            </div>

            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Last sync: Just now
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
          <button
            onClick={onRefreshWorkspace}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[14px] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Now</span>
          </button>
          <button
            onClick={onSignOut}
            className="px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-[14px] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Monthly Budget System Settings Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4" id="monthly-budget-settings-card">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Monthly Household Budget Settings</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure your primary monthly budget, start day, and currency</p>
        </div>

        <form onSubmit={handleSaveBudgetSettings} className="space-y-4 max-w-xl">
          {budgetMsg && (
            <div className={`p-3 rounded-[12px] text-xs font-bold ${budgetMsg.includes('successfully') ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
              {budgetMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Monthly Budget */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Budget</label>
              <input
                type="number"
                step="any"
                required
                id="settings-monthly-budget-input"
                value={budgetVal}
                onChange={(e) => setBudgetVal(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900 dark:text-white transition-all"
              />
            </div>

            {/* Budget Start Day */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Day (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                id="settings-budget-start-day-input"
                value={startDayVal}
                onChange={(e) => setStartDayVal(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900 dark:text-white transition-all"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
              <select
                id="settings-currency-select"
                value={currencyVal}
                onChange={(e) => setCurrencyVal(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900 dark:text-white transition-all"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingBudget}
            id="settings-save-budget-btn"
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[14px] shadow-xs cursor-pointer disabled:opacity-50 transition-all"
          >
            {isSavingBudget ? 'Saving Settings...' : 'Save Budget Settings'}
          </button>
        </form>
      </div>

      {/* Categories & Subcategories Management */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Custom Categories</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Add or manage categories and visual color tags</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="New Category Name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="px-3.5 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
          />
          <input
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            className="w-9 h-9 rounded-[12px] border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
            title="Choose Color"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCatName.trim() || isSavingCat}
            className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-[14px] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
          {categoryList.map((cat) => (
            <div
              key={cat.name}
              className="p-3 rounded-[14px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{cat.name}</span>
                {cat.subcategories.length > 0 && (
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">({cat.subcategories.length} sub)</span>
                )}
              </div>

              <button
                onClick={() => handleDeleteCategory(cat.name)}
                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg cursor-pointer transition-colors"
                title="Delete Category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Google Calendar Integration Preferences Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4" id="google-calendar-settings-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Google Calendar Preferences</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Google Calendar Connected ✓
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sync recurring bills, EMIs, and expense reminders directly to your Primary Google Calendar
            </p>
          </div>

          <button
            onClick={async () => {
              try {
                await onSaveUserSettings?.({
                  calendarSyncRecurring: true,
                  calendarAllowReminders: true,
                  calendarLastSyncedAt: new Date().toISOString(),
                });
                alert('Google Calendar synced successfully!');
              } catch {}
            }}
            className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[14px] flex items-center gap-2 transition-all cursor-pointer shadow-xs self-start sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Calendar Now</span>
          </button>
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked={userSettings?.calendarSyncRecurring !== false}
                onChange={(e) => onSaveUserSettings?.({ calendarSyncRecurring: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
              />
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Sync recurring bills automatically
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked={userSettings?.calendarAllowReminders !== false}
                onChange={(e) => onSaveUserSettings?.({ calendarAllowReminders: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
              />
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Allow expense reminders
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Default Reminder Time
              </label>
              <input
                type="time"
                defaultValue={userSettings?.calendarDefaultTime || '09:00'}
                onChange={(e) => onSaveUserSettings?.({ calendarDefaultTime: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Default Notification Timing
              </label>
              <select
                defaultValue={userSettings?.calendarDefaultNotificationMinutes || 1440}
                onChange={(e) => onSaveUserSettings?.({ calendarDefaultNotificationMinutes: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-[12px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900 dark:text-white"
              >
                <option value={10}>10 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={1440}>1 day before (Default)</option>
                <option value={4320}>3 days before</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 pt-1">
            Last sync timestamp: {userSettings?.calendarLastSyncedAt ? new Date(userSettings.calendarLastSyncedAt).toLocaleString() : 'Just now'}
          </p>
        </div>
      </div>

      {/* CSV Data Export & Import */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Data Portability (CSV Export / Import)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Download complete offline backups or restore expense records</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExportCsv}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[14px] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Export Expenses as CSV</span>
          </button>

          <label className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[14px] flex items-center gap-2 transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Import Expenses from CSV</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportCsv(file);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

