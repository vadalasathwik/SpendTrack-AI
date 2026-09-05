import React from 'react';
import { Bell, X, AlertTriangle, Calendar, Clock, ShoppingBag, CheckCircle2, ChevronRight } from 'lucide-react';
import { AppNotification } from '../types.js';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onSelectNotification?: (notification: AppNotification) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  const getBadgeStyle = (state: AppNotification['state']) => {
    switch (state) {
      case 'Due Today':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Low Stock':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Upcoming':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
      case 'bill_upcoming':
      default:
        return <Calendar className="w-4 h-4 text-emerald-600" />;
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
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">In-App Notifications</h3>
              <p className="text-[11px] text-slate-500">Live bill due dates & stock alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  onSelectNotification?.(n);
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-slate-50 shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getBadgeStyle(n.state)} shrink-0`}>
                      {n.state}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 stroke-1" />
              <h4 className="text-xs font-bold text-slate-700">All Clear!</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                No upcoming bills due or low stock consumable alerts right now.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-center">
          <p className="text-[10px] text-slate-400 font-semibold">
            Deterministic Household Intelligence • No External Push
          </p>
        </div>
      </div>
    </div>
  );
};
