import { CalendarRepository } from '../services/interfaces.js';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export class GoogleCalendarService implements CalendarRepository {
  private async fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = `Google Calendar API Error (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        msg = parsed.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    return res.json();
  }

  /**
   * Helper to determine recurrence rule (RRULE) from frequency
   */
  private getRecurrenceRule(frequency: string): string[] {
    switch (frequency) {
      case 'daily':
        return ['RRULE:FREQ=DAILY'];
      case 'weekly':
        return ['RRULE:FREQ=WEEKLY'];
      case 'quarterly':
        return ['RRULE:FREQ=MONTHLY;INTERVAL=3'];
      case 'yearly':
        return ['RRULE:FREQ=YEARLY'];
      case 'monthly':
      default:
        return ['RRULE:FREQ=MONTHLY'];
    }
  }

  async createReminder(
    token: string,
    reminder: {
      summary: string;
      description?: string;
      dueDate: string; // YYYY-MM-DD
      frequency: string;
    }
  ): Promise<{ eventId: string; htmlLink?: string }> {
    const recurrence = this.getRecurrenceRule(reminder.frequency);

    const eventBody = {
      summary: `[SpendTrack] ${reminder.summary}`,
      description: `${reminder.description || 'SpendTrack recurring bill reminder'}\n\nManaged automatically by SpendTrack.`,
      start: {
        date: reminder.dueDate,
      },
      end: {
        date: reminder.dueDate,
      },
      recurrence,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 9 * 60 },  // 9 hours before
        ],
      },
    };

    const data = await this.fetchWithAuth(CALENDAR_API, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventBody),
    });

    return {
      eventId: data.id,
      htmlLink: data.htmlLink,
    };
  }

  async updateReminder(
    token: string,
    eventId: string,
    reminder: {
      summary: string;
      description?: string;
      dueDate: string;
      frequency: string;
    }
  ): Promise<{ eventId: string }> {
    const recurrence = this.getRecurrenceRule(reminder.frequency);

    const eventBody = {
      summary: `[SpendTrack] ${reminder.summary}`,
      description: `${reminder.description || 'SpendTrack recurring bill reminder'}\n\nManaged automatically by SpendTrack.`,
      start: {
        date: reminder.dueDate,
      },
      end: {
        date: reminder.dueDate,
      },
      recurrence,
    };

    const data = await this.fetchWithAuth(`${CALENDAR_API}/${eventId}`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventBody),
    });

    return {
      eventId: data.id,
    };
  }

  async deleteReminder(token: string, eventId: string): Promise<boolean> {
    const res = await fetch(`${CALENDAR_API}/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok && res.status !== 404) {
      const errText = await res.text();
      throw new Error(`Failed to delete Calendar reminder: ${errText}`);
    }

    return true;
  }
}
