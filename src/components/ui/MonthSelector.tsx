import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange } from '../../types.js';

interface MonthSelectorProps {
  dateRange: DateRange;
  onChangeDateRange?: (newRange: DateRange) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  dateRange,
  onChangeDateRange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  const handleSelectPresetMonth = (monthIdx: number) => {
    const startDate = new Date(currentYear, monthIdx, 1).toISOString().split('T')[0];
    const endDate = new Date(currentYear, monthIdx + 1, 0).toISOString().split('T')[0];
    const label = `${months[monthIdx]} ${currentYear}`;

    if (onChangeDateRange) {
      onChangeDateRange({
        preset: 'custom',
        startDate,
        endDate,
        label,
      });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/10 hover:border-emerald-500/30 text-xs font-bold text-slate-200 hover:text-white transition-all duration-200 cursor-pointer backdrop-blur-md"
      >
        <Calendar className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
        <span>{dateRange.label || 'Current Month'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-[#0F172A] border border-white/10 shadow-2xl p-2 z-50 animate-in zoom-in-95 duration-150">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
            <span>Select Month ({currentYear})</span>
          </div>
          <div className="grid grid-cols-2 gap-1 pt-1.5">
            {months.map((m, idx) => {
              const isCurrent = idx === currentMonthIdx;
              return (
                <button
                  key={m}
                  onClick={() => handleSelectPresetMonth(idx)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-400 font-extrabold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {m.substring(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
