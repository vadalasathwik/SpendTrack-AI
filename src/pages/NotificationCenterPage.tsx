import React, { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  X,
} from 'lucide-react';
import { ReminderItem, UpcomingReminder } from '../types.js';

interface NotificationCenterPageProps {
  reminders: ReminderItem[];
  upcomingTimeline: UpcomingReminder[];
  onAddReminder: (data: { title: string; description?: string; dueDate: string; priority?: string }) => Promise<void>;
  onUpdateReminder: (id: string, data: any) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}

export const NotificationCenterPage: React.FC<NotificationCenterPageProps> = ({
  reminders,
  upcomingTimeline,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'OVERDUE'>('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    await onAddReminder({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
      priority,
    });
    setTitle('');
    setDescription('');
    setIsAdding(false);
  };

  // Categorize reminders
  const filteredReminders = reminders.filter((rem) => {
    const remDate = rem.dueDate ? rem.dueDate.split('T')[0] : '';
    if (filter === 'TODAY') return remDate === todayStr;
    if (filter === 'TOMORROW') return remDate === tomorrowStr;
    if (filter === 'OVERDUE') return remDate < todayStr && !rem.completed;
    if (filter === 'THIS_WEEK') {
      const d = new Date(remDate);
      const now = new Date();
      const diff = (d.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= 7;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16 max-w-[1440px] mx-auto">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200/80 dark:border-slate-800 soft-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-rose-500" />
            <span>Notification Center & Reminders</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Proactive alerts for bills, SIPs, loan EMIs, and personal tasks.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-[14px] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(
          [
            { key: 'ALL', label: 'All Items' },
            { key: 'TODAY', label: 'Today' },
            { key: 'TOMORROW', label: 'Tomorrow' },
            { key: 'THIS_WEEK', label: 'This Week' },
            { key: 'OVERDUE', label: 'Overdue' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-[12px] text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              filter === tab.key
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ADD MODAL */}
      {isAdding && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Create New Reminder</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Reminder Title (e.g. Pay Electricity Bill)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-slate-50 dark:bg-slate-800 border text-xs font-semibold"
              />
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-3 py-2 rounded-[12px] bg-slate-50 dark:bg-slate-800 border text-xs font-semibold"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="px-3 py-2 rounded-[12px] bg-slate-50 dark:bg-slate-800 border text-xs font-semibold"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Description / Notes (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-[12px] bg-slate-50 dark:bg-slate-800 border text-xs font-semibold"
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs text-slate-500">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-[10px]">
                Add Reminder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LIST OF REMINDERS */}
      <div className="space-y-3">
        {filteredReminders.map((rem) => {
          let priorityBadge = 'bg-slate-100 text-slate-700';
          if (rem.priority === 'HIGH') priorityBadge = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200';
          else if (rem.priority === 'MEDIUM') priorityBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200';

          return (
            <div
              key={rem.id}
              className={`p-4 rounded-[18px] bg-white dark:bg-slate-900 border transition-all flex items-center justify-between gap-3 ${
                rem.completed ? 'opacity-60 border-slate-200 dark:border-slate-800' : 'border-slate-200/80 dark:border-slate-800 soft-shadow'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={() => onUpdateReminder(rem.id, { completed: !rem.completed })}
                  className="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                >
                  <CheckCircle2 className={`w-5 h-5 ${rem.completed ? 'text-emerald-500 fill-emerald-500' : ''}`} />
                </button>

                <div className="min-w-0">
                  <h3 className={`font-extrabold text-sm text-slate-900 dark:text-white truncate ${rem.completed ? 'line-through' : ''}`}>
                    {rem.title}
                  </h3>
                  {rem.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{rem.description}</p>
                  )}
                  <span className="text-[11px] font-semibold text-slate-400">
                    Due: {rem.dueDate ? rem.dueDate.split('T')[0] : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityBadge}`}>
                  {rem.priority}
                </span>

                <button onClick={() => onDeleteReminder(rem.id)} className="text-slate-400 hover:text-rose-500 cursor-pointer p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredReminders.length === 0 && (
          <div className="p-8 text-center text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-[20px] border">
            No notifications matching current filter.
          </div>
        )}
      </div>
    </div>
  );
};
