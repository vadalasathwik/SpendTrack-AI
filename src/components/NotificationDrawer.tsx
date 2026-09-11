import React from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Calendar,
  Clock,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { AppNotification } from '../types.js';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onSelectNotification?: (notification: AppNotification) => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onSelectNotification,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onClearAllNotifications,
}) => {
  if (!isOpen) return null;

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n?.read).length;

  const getBadgeStyle = (notification: AppNotification) => {
    if (notification?.read) {
      return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
    switch (notification?.type) {
      case 'bill_due':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'bill_overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      case 'stock_low':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800';
      case 'ai_insight':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'bill_upcoming':
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800';
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'stock_low':
        return <ShoppingBag className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'bill_overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'bill_due':
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'ai_insight':
        return <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'bill_upcoming':
      default:
        return <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div
        id="notification-drawer-dialog"
        className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 border-l border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Notifications</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Mark all read / Clear all */}
        {safeNotifications.length > 0 && (
          <div className="px-4 py-2 bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            {unreadCount > 0 ? (
              <button
                onClick={onMarkAllAsRead}
                className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">All marked as read</span>
            )}

            <button
              onClick={onClearAllNotifications}
              className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {safeNotifications.length > 0 ? (
            safeNotifications.map((n) => (
              <div
                key={n?.id || Math.random()}
                onClick={() => {
                  if (!n?.read) onMarkAsRead?.(n.id);
                  onSelectNotification?.(n);
                }}
                className={`p-3.5 rounded-[20px] border transition-all cursor-pointer flex items-start gap-3 relative group ${
                  n?.read
                    ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-75'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0 mt-0.5 shadow-2xs">
                  {getIcon(n?.type)}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs font-bold truncate ${n?.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {n?.title || 'Notification'}
                    </h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getBadgeStyle(n)} shrink-0`}>
                      {n?.read ? 'Read' : n?.state || 'Alert'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{n?.message || ''}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {n?.createdAt && (
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    )}
                    {(n?.type === 'bill_due' || n?.type === 'bill_upcoming' || n?.type === 'bill_overdue') && (
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60 inline-flex items-center gap-1">
                        Calendar Synced ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Individual Clear Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (n?.id) onClearNotification?.(n.id);
                  }}
                  title="Clear notification"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-opacity rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 stroke-1" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">All Clear!</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                No active notifications right now. Upcoming bill reminders & inventory alerts will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
            Google Sheets Synchronized Notifications
          </p>
        </div>
      </div>
    </div>
  );
};


