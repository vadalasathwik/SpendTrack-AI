import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateRangePreset, DateRange } from '../types.js';
import { getDateRangeFromPreset } from '../utils/dateRanges.js';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'last7days', label: 'Last 7 days' },
  { key: 'last30days', label: 'Last 30 days' },
  { key: 'currentMonth', label: 'Current month' },
  { key: 'previousMonth', label: 'Previous month' },
  { key: 'last3months', label: 'Last 3 months' },
  { key: 'last6months', label: 'Last 6 months' },
  { key: 'currentYear', label: 'Current year' },
  { key: 'custom', label: 'Custom range' },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);

  const handleSelectPreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      const updated = getDateRangeFromPreset('custom', customStart, customEnd);
      onChange(updated);
    } else {
      const updated = getDateRangeFromPreset(preset);
      setCustomStart(updated.startDate);
      setCustomEnd(updated.endDate);
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

  return (
    <div className="relative inline-block text-left" id="date-range-picker-container">
      <button
        id="date-range-picker-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
      >
        <Calendar className="w-4 h-4 text-emerald-600" />
        <span className="font-semibold text-slate-800">{value.label}</span>
        <span className="text-slate-400 text-xs hidden md:inline">
          ({value.startDate} → {value.endDate})
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />
          <div
            id="date-range-dropdown-menu"
            className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-30 space-y-2 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 pt-1">
              Select Time Horizon
            </div>

            <div className="grid grid-cols-2 gap-1">
              {PRESETS.map((p) => {
                const isSelected = value.preset === p.key;
                return (
                  <button
                    key={p.key}
                    id={`preset-${p.key}`}
                    type="button"
                    onClick={() => handleSelectPreset(p.key)}
                    className={`text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-3 px-1">
              <div className="text-xs font-medium text-slate-700 mb-2">Arbitrary Date Range</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Start Date</label>
                  <input
                    type="date"
                    id="custom-start-date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">End Date</label>
                  <input
                    type="date"
                    id="custom-end-date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                id="apply-custom-date-btn"
                onClick={handleApplyCustom}
                disabled={!customStart || !customEnd || customStart > customEnd}
                className="w-full py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
              >
                Apply Custom Range
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
