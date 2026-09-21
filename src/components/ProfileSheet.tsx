import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Settings,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Database,
  Sparkles,
  ShieldCheck,
  Moon,
  Sun,
  Monitor,
  Lock,
  WifiOff,
  Bell,
  Eye,
  Laptop,
  Smartphone,
  Globe,
  FileText,
  ChevronRight,
  ExternalLink,
  Download,
} from 'lucide-react';
import { getStoredThemeMode, applyThemeMode, ThemeMode } from '../utils/theme.js';
import { SpendTrackApi } from '../services/api.js';
import { QRVaultStore } from '../services/qrVaultStore.js';

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  userPhotoUrl?: string;
  onNavigateToSettings?: () => void;
  onSyncNow: () => void;
  onSignOut: () => void;
}

export const ProfileSheet: React.FC<ProfileSheetProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
  userPhotoUrl,
  onSyncNow,
  onSignOut,
}) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredThemeMode);
  const [offlineMode, setOfflineMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setThemeMode(getStoredThemeMode());
      setIsLoadingSessions(true);
      SpendTrackApi.getSessions()
        .then((data: any) => {
          if (Array.isArray(data)) setActiveSessions(data);
          else if (data && Array.isArray(data.sessions)) setActiveSessions(data.sessions);
        })
        .catch((err) => console.warn('Sessions fetch notice:', err))
        .finally(() => setIsLoadingSessions(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'User');
  const userInitials = userEmail ? userEmail.substring(0, 2).toUpperCase() : 'ST';

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyThemeMode(mode);
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const jsonStr = await QRVaultStore.exportVaultData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SpendTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message || 'Error exporting backup'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click area */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Google Pay Style Bottom Sheet Drawer */}
      <div
        id="profile-sheet-dialog"
        className="relative bg-white dark:bg-slate-900 w-full max-w-[430px] mx-auto rounded-t-[32px] border-t border-x border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[88vh] z-10"
      >
        {/* Google Pay Signature Top Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 shrink-0" />

        {/* Sheet Header */}
        <div className="px-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-black text-base text-slate-900 dark:text-white">Account & Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 no-scrollbar">
          {/* 1. Google Profile Section */}
          <div className="p-4 rounded-[24px] bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-sm border-2 border-emerald-400 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
              {userPhotoUrl ? (
                <img src={userPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                {displayName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {userEmail || 'Active Google User'}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Google OAuth Active
                </span>
              </div>
            </div>
          </div>

          {/* 2. Appearance Section */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Appearance
            </h5>
            <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'amoled', label: 'AMOLED', icon: Eye },
                { id: 'system', label: 'System', icon: Monitor },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = themeMode === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id as any)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Notifications & Alerts Toggle */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Notifications
            </h5>
            <div className="p-3.5 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Bill & Due Reminders</span>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  notificationsEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 4. Offline Mode Toggle */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Offline Storage
            </h5>
            <div className="p-3.5 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="font-bold text-slate-800 dark:text-slate-200">IndexedDB Encrypted Store</span>
              </div>
              <button
                onClick={() => setOfflineMode(!offlineMode)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  offlineMode ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    offlineMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 5. Connected Devices */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Connected Devices
            </h5>
            <div className="p-3.5 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              {isLoadingSessions ? (
                <div className="py-2 text-center text-slate-400 text-xs animate-pulse">Loading active sessions...</div>
              ) : activeSessions.length > 0 ? (
                activeSessions.map((sess, idx) => (
                  <div key={sess.id || idx} className="flex items-center justify-between py-1 border-b border-slate-200/40 dark:border-slate-700/40 last:border-none">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                      <Laptop className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate max-w-[200px]">{sess.device || sess.userAgent?.substring(0, 24) || 'Web Session'}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full shrink-0">
                      {sess.isCurrent ? 'Current Device' : 'Active'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between py-1 text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 font-medium">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span>Current Device (Web Session)</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 6. Export Backup */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Export Backup
            </h5>
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="w-full p-3.5 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Export QR Vault & Encrypted Backup</span>
              </div>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 bg-teal-500/15 px-2 py-0.5 rounded-full font-bold">
                {isExporting ? 'Exporting...' : 'Download JSON'}
              </span>
            </button>
          </div>

          {/* 6. Privacy & Security */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Privacy & Security
            </h5>
            <div className="p-3.5 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  256-bit AES Local Encryption
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <Lock className="w-4 h-4 text-cyan-500" />
                  Google OAuth 2.0 Auth
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Privacy Policy</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Terms of Service</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* 7. Sign Out Action Button */}
          <div className="pt-2 pb-1 space-y-2">
            <button
              onClick={async () => {
                onSyncNow();
                onClose();
              }}
              className="w-full p-3 rounded-[20px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Sync Database Now
              </span>
            </button>

            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="w-full p-3.5 rounded-[20px] bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between font-bold text-xs text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4" />
                Sign Out of Account
              </span>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
