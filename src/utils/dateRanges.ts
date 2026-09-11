import { DateRangePreset, DateRange } from '../types.js';

export function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRangeFromPreset(preset: DateRangePreset, customStart?: string, customEnd?: string): DateRange {
  const today = new Date();
  const todayStr = formatDateToYYYYMMDD(today);

  switch (preset) {
    case 'today':
      return {
        preset: 'today',
        startDate: todayStr,
        endDate: todayStr,
        label: 'Today',
      };

    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = formatDateToYYYYMMDD(y);
      return {
        preset: 'yesterday',
        startDate: yStr,
        endDate: yStr,
        label: 'Yesterday',
      };
    }

    case 'last7days': {
      const past = new Date(today);
      past.setDate(past.getDate() - 6);
      return {
        preset: 'last7days',
        startDate: formatDateToYYYYMMDD(past),
        endDate: todayStr,
        label: 'Last 7 Days',
      };
    }

    case 'last30days': {
      const past = new Date(today);
      past.setDate(past.getDate() - 29);
      return {
        preset: 'last30days',
        startDate: formatDateToYYYYMMDD(past),
        endDate: todayStr,
        label: 'Last 30 Days',
      };
    }

    case 'currentMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        preset: 'currentMonth',
        startDate: formatDateToYYYYMMDD(start),
        endDate: formatDateToYYYYMMDD(end),
        label: 'This Month',
      };
    }

    case 'previousMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        preset: 'previousMonth',
        startDate: formatDateToYYYYMMDD(start),
        endDate: formatDateToYYYYMMDD(end),
        label: 'Last Month',
      };
    }

    case 'currentQuarter': {
      const currentMonth = today.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const start = new Date(today.getFullYear(), quarterStartMonth, 1);
      const end = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
      return {
        preset: 'currentQuarter',
        startDate: formatDateToYYYYMMDD(start),
        endDate: formatDateToYYYYMMDD(end),
        label: 'This Quarter',
      };
    }

    case 'last3months': {
      const past = new Date(today);
      past.setMonth(past.getMonth() - 3);
      return {
        preset: 'last3months',
        startDate: formatDateToYYYYMMDD(past),
        endDate: todayStr,
        label: 'Last 3 Months',
      };
    }

    case 'last6months': {
      const past = new Date(today);
      past.setMonth(past.getMonth() - 6);
      return {
        preset: 'last6months',
        startDate: formatDateToYYYYMMDD(past),
        endDate: todayStr,
        label: 'Last 6 Months',
      };
    }

    case 'currentYear': {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      return {
        preset: 'currentYear',
        startDate: formatDateToYYYYMMDD(start),
        endDate: formatDateToYYYYMMDD(end),
        label: 'This Year',
      };
    }

    case 'custom':
    default: {
      const s = customStart || todayStr;
      const e = customEnd || todayStr;
      return {
        preset: 'custom',
        startDate: s,
        endDate: e,
        label: `${s} to ${e}`,
      };
    }
  }
}

/**
 * Calculates previous equivalent period for comparison
 */
export function getPreviousPeriod(currentRange: { startDate: string; endDate: string }): { startDate: string; endDate: string } {
  const start = new Date(currentRange.startDate);
  const end = new Date(currentRange.endDate);
  const daysDiff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (daysDiff - 1));

  return {
    startDate: formatDateToYYYYMMDD(prevStart),
    endDate: formatDateToYYYYMMDD(prevEnd),
  };
}

export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, monthIndex, day);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
