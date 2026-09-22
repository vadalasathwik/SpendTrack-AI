import React, { useState, useEffect } from 'react';
import {
  Sliders,
  DollarSign,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Download,
  Upload,
  LogOut,
  User as UserIcon,
  Bell,
  Moon,
  Sun,
  Palette,
  Globe,
  Database,
  Lock,
  Bot,
  Laptop,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { CategoryItem, UserSettings } from '../types.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { getActiveSessions, revokeSession, logoutAllDevices, UserSession } from '../services/authService.js';
import {
  exportReceiptsJSON,
  exportQRVaultJSON,
  exportExpensesCSV,
  importBackupJSON,
} from '../utils/mobileStorage.js';

interface SettingsPageProps {
  categories: CategoryItem[];
  userSettings?: UserSettings;
  onSaveCategories: (categories: CategoryItem[]) => Promise<void>;
  onSaveUserSettings?: (settings: Partial<UserSettings>) => Promise<void>;
  onExportCsv: () => void;
  onImportCsv: (file: File) => void;
  onSignOut: () => void;
  userEmail?: string;
  onNavigateToCategories?: () => void;
  themeMode?: 'light' | 'dark' | 'system';
  onChangeThemeMode?: (mode: 'light' | 'dark' | 'system') => void;
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
  themeMode = 'dark',
  onChangeThemeMode,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'homelayout' | 'aipersona' | 'security'>('appearance');

  // Appearance State
  const [theme, setTheme] = useState<'midnight' | 'emerald' | 'sapphire' | 'graphite'>('midnight');
  const [currency, setCurrency] = useState<string>(userSettings?.currency || 'INR');

  // Home Layout State
  const [homeLayout, setHomeLayout] = useState<string>(userSettings?.homeMode || 'COMMAND');

  // AI Personality State
  const [aiPersona, setAiPersona] = useState<'cfo' | 'coach' | 'analytical' | 'minimal'>('cfo');

  // Status message
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Active Device Sessions State
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (activeTab === 'security') {
      setLoadingSessions(true);
      getActiveSessions()
        .then((data) => setSessions(data))
        .catch(() => {})
        .finally(() => setLoadingSessions(false));
    }
  }, [activeTab]);

  const handleRevokeSession = async (sessionId: string) => {
    const success = await revokeSession(sessionId);
    if (success) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
  };

  const handleLogoutAllDevices = async () => {
    await logoutAllDevices();
    onSignOut();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMsg(null);

    try {
      let symbol = '₹';
      if (currency === 'USD') symbol = '$';
      else if (currency === 'AED') symbol = 'AED ';

      await onSaveUserSettings?.({
        homeMode: homeLayout as any,
        currency,
        currencySymbol: symbol,
      });

      setSaveMsg('TrackPay v4.0 settings saved successfully!');
      setTimeout(() => setSaveMsg(null), 3500);
    } catch (err: any) {
      setSaveMsg(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-[1440px] mx-auto animate-in fade-in duration-300">
      {/* Settings Title Header */}
      <GlassCard padding="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Sliders className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">System Personalization</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Customize Theme Appearance, Command Layout, AI Personality, and Currency.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              User: {userEmail || 'Active User'}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* 4 Section Tab Selector */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
        {[
          { id: 'appearance', label: '1. Appearance', icon: Palette },
          { id: 'homelayout', label: '2. Home Layout', icon: Sliders },
          { id: 'aipersona', label: '3. AI Personality', icon: Bot },
          { id: 'security', label: '4. Security & Data', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {saveMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* SECTION 1: Appearance */}
        {activeTab === 'appearance' && (
          <GlassCard padding="p-6">
            <h3 className="text-base font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Palette className="w-4.5 h-4.5 text-emerald-400" />
              Appearance & Theme Palette
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Theme Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', name: 'Light', icon: Sun },
                    { id: 'dark', name: 'Dark', icon: Moon },
                    { id: 'system', name: 'System', icon: Globe },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = themeMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onChangeThemeMode?.(m.id as any)}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Theme Preset Accent
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'midnight', name: 'Midnight', color: '#070B14' },
                    { id: 'emerald', name: 'Emerald', color: '#064E3B' },
                    { id: 'sapphire', name: 'Sapphire', color: '#0F172A' },
                    { id: 'graphite', name: 'Graphite', color: '#18181B' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id as any)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        theme === t.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20 shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-xs">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Primary Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                  <option value="EUR">€ EUR (Euro)</option>
                  <option value="GBP">£ GBP (British Pound)</option>
                </select>
              </div>
            </div>
          </GlassCard>
        )}

        {/* SECTION 2: Home Layout */}
        {activeTab === 'homelayout' && (
          <GlassCard padding="p-6">
            <h3 className="text-base font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-blue-400" />
              Home Layout Modes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'COMMAND', name: 'Command Center', desc: 'Executive overview & KPI cards grid' },
                { id: 'CALENDAR', name: 'Calendar First', desc: 'Bills, SIP timeline & reminders first' },
                { id: 'NOTEBOOK', name: 'Notebook Workspace', desc: 'Financial journal & goal notes focus' },
                { id: 'AICFO', name: 'AI CFO Workspace', desc: 'Conversational assistant as homepage' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setHomeLayout(mode.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    homeLayout === mode.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                      : 'border-white/10 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-black text-white block">{mode.name}</span>
                  <span className="text-[11px] text-slate-400 mt-1 block">{mode.desc}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        )}

        {/* SECTION 3: AI Personality */}
        {activeTab === 'aipersona' && (
          <GlassCard padding="p-6">
            <h3 className="text-base font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bot className="w-4.5 h-4.5 text-violet-400" />
              AI CFO Persona & Tone
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'cfo', name: 'Professional CFO', desc: 'Strict, data-driven financial advice' },
                { id: 'coach', name: 'Friendly Wealth Coach', desc: 'Encouraging, supportive milestone guidance' },
                { id: 'analytical', name: 'Analytical Researcher', desc: 'Deep metrics, CAGR, and ratio breakdown' },
                { id: 'minimal', name: 'Minimalist Advisor', desc: 'Short, concise bullet recommendations' },
              ].map((persona) => (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => setAiPersona(persona.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    aiPersona === persona.id
                      ? 'border-violet-500 bg-violet-500/10 text-white font-bold'
                      : 'border-white/10 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-black text-white block">{persona.name}</span>
                  <span className="text-[11px] text-slate-400 mt-1 block">{persona.desc}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        )}

        {/* SECTION 4: Security & Data */}
        {activeTab === 'security' && (
          <GlassCard padding="p-6">
            <h3 className="text-base font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Lock className="w-4.5 h-4.5 text-rose-400" />
              Security & Active Sessions
            </h3>

            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Google OAuth Account</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{userEmail || 'Active session'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLogoutAllDevices}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-800/60 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout All Devices</span>
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Active Device Sessions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Active Device Sessions</h4>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {sessions.length} Active
                  </span>
                </div>

                {loadingSessions ? (
                  <div className="p-4 text-center text-xs text-slate-400 animate-pulse">Loading active sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-400 text-center">
                    No other active sessions found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((s, idx) => {
                      const isMobile = s.device.toLowerCase().includes('mobile') || s.device.toLowerCase().includes('android') || s.device.toLowerCase().includes('iphone');
                      const DeviceIcon = isMobile ? Smartphone : Laptop;
                      return (
                        <div
                          key={s.id || idx}
                          className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                              <DeviceIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                                  {s.device.length > 35 ? s.device.substring(0, 35) + '...' : s.device}
                                </span>
                                {idx === 0 && (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Current Device
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                IP: {s.ipAddress || '127.0.0.1'} • Signed in: {new Date(s.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleRevokeSession(s.id)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer transition-colors"
                              title="Revoke Session"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile Device Storage Export & Import Section */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Mobile Storage & Backup
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => exportExpensesCSV()}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-left cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Download className="w-4 h-4" />
                      <span>Export Expenses (CSV)</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Download expenses spreadsheet</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportReceiptsJSON()}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-left cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                      <Download className="w-4 h-4" />
                      <span>Export Receipts (JSON)</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Download OCR receipt vault JSON</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportQRVaultJSON()}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-left cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <Download className="w-4 h-4" />
                      <span>Export QR Vault (JSON)</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Backup encrypted QR codes</p>
                  </button>

                  <label className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-left cursor-pointer transition-all space-y-1 block">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <Upload className="w-4 h-4" />
                      <span>Import Backup JSON</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Restore previous JSON backup</p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const result = await importBackupJSON(file);
                          alert(`Successfully restored ${result.itemCount} items! Reloading...`);
                          window.location.reload();
                        } catch (err: any) {
                          alert('Failed to import backup: ' + (err.message || 'Invalid format'));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save SpendTrack AI Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};
