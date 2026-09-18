import React from 'react';

export interface TimelineEventItem {
  id: string;
  dateStr: string;
  title: string;
  amount: number;
  type: 'Salary' | 'EMI' | 'SIP' | 'RD' | 'FD' | 'Goal' | 'Reminder';
  categoryLabel?: string;
}

interface WealthTimelineProps {
  events: TimelineEventItem[];
  className?: string;
}

export const WealthTimeline: React.FC<WealthTimelineProps> = ({ events, className = '' }) => {
  const getDotStyle = (type: TimelineEventItem['type']) => {
    switch (type) {
      case 'Salary':
        return 'bg-emerald-400 border-emerald-500 shadow-emerald-500/50';
      case 'EMI':
        return 'bg-rose-400 border-rose-500 shadow-rose-500/50';
      case 'SIP':
        return 'bg-purple-400 border-purple-500 shadow-purple-500/50';
      case 'RD':
        return 'bg-amber-400 border-amber-500 shadow-amber-500/50';
      case 'FD':
        return 'bg-blue-400 border-blue-500 shadow-blue-500/50';
      case 'Goal':
        return 'bg-teal-400 border-teal-500 shadow-teal-500/50';
      case 'Reminder':
      default:
        return 'bg-slate-400 border-slate-500 shadow-slate-500/50';
    }
  };

  const getContainerStyle = (type: TimelineEventItem['type']) => {
    switch (type) {
      case 'Salary':
        return 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
      case 'EMI':
        return 'bg-rose-950/40 border-rose-500/30 text-rose-300';
      case 'SIP':
        return 'bg-purple-950/40 border-purple-500/30 text-purple-300';
      case 'RD':
        return 'bg-amber-950/40 border-amber-500/30 text-amber-300';
      case 'FD':
        return 'bg-blue-950/40 border-blue-500/30 text-blue-300';
      case 'Goal':
        return 'bg-teal-950/40 border-teal-500/30 text-teal-300';
      case 'Reminder':
      default:
        return 'bg-slate-900/60 border-slate-700/50 text-slate-300';
    }
  };

  return (
    <div className={`relative pl-6 space-y-4 ${className}`}>
      {/* Vertical Timeline Line */}
      <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-slate-800" />

      {events.map((evt) => (
        <div key={evt.id} className="relative flex items-center gap-4">
          {/* Node Dot */}
          <div
            className={`absolute -left-6 w-3.5 h-3.5 rounded-full border-2 shadow-sm ${getDotStyle(
              evt.type
            )}`}
          />

          {/* Event Content Container */}
          <div
            className={`flex-1 p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${getContainerStyle(
              evt.type
            )}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/30">
                  {evt.dateStr}
                </span>
                <span className="text-xs font-bold text-white">{evt.title}</span>
              </div>
              {evt.categoryLabel && (
                <p className="text-[10px] opacity-75 mt-0.5 font-medium">{evt.categoryLabel}</p>
              )}
            </div>

            <span className="text-xs font-black font-mono text-white shrink-0">
              ₹{evt.amount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
