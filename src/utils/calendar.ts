import { RecurringExpense } from '../types.js';

export function getCalendarUrl(item: RecurringExpense): string {
  if (item.calendarHtmlLink) {
    return item.calendarHtmlLink;
  }
  const dateStr = item.paidDate || item.reminderDate || item.dueDate || new Date().toISOString().split('T')[0];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `https://calendar.google.com/calendar/u/0/r/day/${y}/${m}/${d}`;
  }
  return 'https://calendar.google.com';
}
