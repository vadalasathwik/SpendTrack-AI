import React from 'react';
import {
  X,
  User,
  Settings,
  RefreshCw,
  LogOut,
  CheckCircle2,
  FileSpreadsheet,
  HardDrive,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  userPhotoUrl?: string;
  onNavigateToSettings: () => void;
  onSyncNow: () => void;
  onSignOut: () => void;
}

export const ProfileSheet: React.FC<ProfileSheetProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
  userPhotoUrl,
  onNavigateToSettings,
  onSyncNow,
  onSignOut,
}) => {
  if (!isOpen) return null;

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'User');
  const userInitials = userEmail ? userEmail.substring(0, 2).toUpperCase() : 'ST';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        id="profile-sheet-dialog"
        className="relative bg-white dark:bg-slate-900 w-[calc(100vw-24px)] sm:max-w-sm rounded-[20px] shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 sm:slide-in-from-right duration-200 max-h-[85vh] sm:max-h-[90vh]"
      >
        {/* Handle bar on mobile */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Sheet Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Account & Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* User Profile Card */}
          <div className="p-4 rounded-[16px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-black text-sm border-2 border-emerald-500 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
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
                {userEmail || 'Active User'}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              </div>
            </div>
          </div>

          {/* Workspace Status Details */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Workspace Status
            </h5>
            <div className="p-3.5 rounded-[14px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Google Sheets Sync
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Google Drive Storage
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Google Calendar Alerts
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700 flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>Last Sync</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">Just now</span>
              </div>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="space-y-2 pt-1">
            <h5 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Account Actions
            </h5>

            <button
              onClick={async () => {
                onSyncNow();
                onClose();
              }}
              className="w-full p-3 rounded-[14px] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Sync Now
              </span>
            </button>

            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="w-full p-3 rounded-[14px] bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between font-bold text-xs text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4" />
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
