import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, X } from 'lucide-react';
import { DateRangePreset, DateRange } from '../types.js';
import { getDateRangeFromPreset } from '../utils/dateRanges.js';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7days', label: 'Last 7 Days' },
  { key: 'last30days', label: 'Last 30 Days' },
  { key: 'currentMonth', label: 'This Month' },
  { key: 'previousMonth', label: 'Last Month' },
  { key: 'currentQuarter', label: 'This Quarter' },
  { key: 'currentYear', label: 'This Year' },
  { key: 'custom', label: 'Custom Range' },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(value.preset === 'custom');
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync custom start/end when props change
  useEffect(() => {
    setCustomStart(value.startDate);
    setCustomEnd(value.endDate);
    setIsCustomMode(value.preset === 'custom');
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      const updated = getDateRangeFromPreset(preset);
      onChange(updated);
      setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      const updated = getDateRangeFromPreset('custom', customStart, customEnd);
      onChange(updated);
      setIsOpen(false);
    }
  };

  const handleCancelCustom = () => {
    setIsCustomMode(false);
    setCustomStart(value.startDate);
    setCustomEnd(value.endDate);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef} id="date-range-picker-container">
      {/* 40px Height, 14px Radius Dropdown Button */}
      <button
        id="date-range-picker-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-3.5 rounded-[14px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 font-bold text-xs inline-flex items-center gap-2 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none max-w-[200px] sm:max-w-none"
        aria-expanded={isOpen}
      >
        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="truncate">{value.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 16px Radius Floating Popover */}
      {isOpen && (
        <div
          id="date-range-dropdown-menu"
          className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-[16px] shadow-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Time Range
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets List */}
          <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
            {PRESETS.map((p) => {
              const isSelected = value.preset === p.key || (p.key === 'custom' && isCustomMode);
              return (
                <button
                  key={p.key}
                  id={`preset-${p.key}`}
                  type="button"
                  onClick={() => handleSelectPreset(p.key)}
                  className={`w-full text-left px-3 py-2 rounded-[12px] text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <span>{p.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Controls */}
          {isCustomMode && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Custom Date Range</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    id="custom-start-date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[10px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    id="custom-end-date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[10px] focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelCustom}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[10px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="apply-custom-date-btn"
                  onClick={handleApplyCustom}
                  disabled={!customStart || !customEnd || customStart > customEnd}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-[10px] transition-colors cursor-pointer shadow-2xs"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

