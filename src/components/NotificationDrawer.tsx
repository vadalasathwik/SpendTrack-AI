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

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onClearAllNotifications,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getBadgeStyle = (notification: AppNotification) => {
    if (notification.read) {
      return 'bg-slate-100 text-slate-500 border-slate-200';
    }
    switch (notification.type) {
      case 'bill_due':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'bill_overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'stock_low':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'ai_insight':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'bill_upcoming':
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'stock_low':
        return <ShoppingBag className="w-4 h-4 text-orange-600" />;
      case 'bill_overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'bill_due':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'ai_insight':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'bill_upcoming':
      default:
        return <Calendar className="w-4 h-4 text-teal-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div
        id="notification-drawer-dialog"
        className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Notifications</h3>
              <p className="text-[11px] text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Mark all read / Clear all */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-100 flex items-center justify-between text-xs">
            {unreadCount > 0 ? (
              <button
                onClick={onMarkAllAsRead}
                className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">All marked as read</span>
            )}

            <button
              onClick={onClearAllNotifications}
              className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) onMarkAsRead?.(n.id);
                  onSelectNotification?.(n);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative group ${
                  n.read
                    ? 'bg-slate-50/60 border-slate-200/60 opacity-80'
                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="p-2 rounded-xl bg-white border border-slate-100 shrink-0 mt-0.5 shadow-2xs">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs font-bold truncate ${n.read ? 'text-slate-600' : 'text-slate-900'}`}>
                      {n.title}
                    </h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getBadgeStyle(n)} shrink-0`}>
                      {n.read ? 'Read' : n.state}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  {n.createdAt && (
                    <p className="text-[9px] text-slate-400 mt-1.5">
                      {new Date(n.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>

                {/* Individual Clear Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearNotification?.(n.id);
                  }}
                  title="Clear notification"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 stroke-1" />
              <h4 className="text-xs font-bold text-slate-700">All Clear!</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                No active notifications right now. Upcoming bill reminders & inventory alerts will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-center">
          <p className="text-[10px] text-slate-400 font-semibold">
            Google Sheets Synchronized Notifications
          </p>
        </div>
      </div>
    </div>
  );
};

