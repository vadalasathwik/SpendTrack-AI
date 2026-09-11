const CALENDAR_PRIMARY_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export interface CalendarEventInput {
  title?: string;
  summary?: string;
  description?: string;
  startDate?: string;
  date?: string; // YYYY-MM-DD
  startTime?: string;
  time?: string; // HH:mm (e.g. '09:00')
  dueDate?: string;
  notifyBefore?: string;
  minutesBefore?: number; // e.g. 10, 30, 60, 1440 (1 day), 4320 (3 days)
  frequency?: string; // 'daily' | 'weekly' | 'monthly' | 'yearly' | 'quarterly'
  recurring?: boolean;
  amount?: number;
  currencySymbol?: string;
  colorId?: string;
}

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  startDate: string;
  startTime?: string;
  htmlLink?: string;
  amount?: number;
}

export class GoogleCalendarService {
  private async fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
    console.log("Calendar API URL:", url);
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    console.log("HTTP status:", res.status);
    const resText = await res.text();
    console.log("Response body:", resText);

    if (!res.ok) {
      let msg = `Google Calendar API Error (${res.status})`;
      try {
        const parsed = JSON.parse(resText);
        msg = parsed.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    try {
      return JSON.parse(resText);
    } catch {
      return {};
    }
  }

  private getRecurrenceRule(frequency?: string): string[] | undefined {
    if (!frequency) return undefined;
    switch (frequency.toLowerCase()) {
      case 'daily':
        return ['RRULE:FREQ=DAILY'];
      case 'weekly':
        return ['RRULE:FREQ=WEEKLY'];
      case 'quarterly':
        return ['RRULE:FREQ=MONTHLY;INTERVAL=3'];
      case 'yearly':
        return ['RRULE:FREQ=YEARLY'];
      case 'monthly':
        return ['RRULE:FREQ=MONTHLY'];
      default:
        return undefined;
    }
  }

  private parseMinutesBefore(input: any): number {
    if (typeof input === 'number') return input;
    if (typeof input === 'string') {
      if (input.includes('3 days')) return 4320;
      if (input.includes('1 day')) return 1440;
      if (input.includes('1 hour')) return 60;
      if (input.includes('30 min')) return 30;
      if (input.includes('10 min')) return 10;
      if (input.includes('At time')) return 0;
      const num = parseInt(input, 10);
      if (!isNaN(num)) return num;
    }
    return 1440;
  }

  /**
   * Create a new Google Calendar Event
   */
  async createCalendarEvent(
    token: string,
    eventDetails: CalendarEventInput
  ): Promise<{ eventId: string; htmlLink?: string }> {
    const calendarId = 'primary';
    const summaryText = eventDetails.title || eventDetails.summary || 'Pay Bill';
    const dateStr = eventDetails.startDate || eventDetails.date || eventDetails.dueDate || new Date().toISOString().split('T')[0];
    const timeStr = eventDetails.startTime || eventDetails.time || '20:00';
    
    let startDateTimeISO: string;
    let endDateTimeISO: string;

    try {
      const startObj = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(startObj.getTime())) {
        throw new Error('Invalid date/time');
      }
      startDateTimeISO = startObj.toISOString();
      const endObj = new Date(startObj.getTime() + 30 * 60 * 1000);
      endDateTimeISO = endObj.toISOString();
    } catch {
      startDateTimeISO = `${dateStr}T${timeStr}:00Z`;
      endDateTimeISO = `${dateStr}T${timeStr}:30Z`;
    }

    const minutesBefore = this.parseMinutesBefore(eventDetails.notifyBefore ?? eventDetails.minutesBefore);
    const recurrence = this.getRecurrenceRule(eventDetails.frequency);

    const formattedSummary = summaryText.startsWith('[SpendTrack]')
      ? summaryText
      : `[SpendTrack] ${summaryText}`;

    const descriptionText = eventDetails.description
      ? eventDetails.description
      : `Amount: ${eventDetails.currencySymbol || '₹'}${eventDetails.amount || 0}\nDue Date: ${eventDetails.dueDate || dateStr}`;

    const eventPayload: any = {
      summary: formattedSummary,
      description: `${descriptionText}\n\nCreated by TrackPay.`,
      start: {
        dateTime: startDateTimeISO,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endDateTimeISO,
        timeZone: "Asia/Kolkata",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: minutesBefore },
        ],
      },
    };

    if (eventDetails.colorId) {
      eventPayload.colorId = eventDetails.colorId;
    }

    if (recurrence && eventDetails.recurring !== false) {
      eventPayload.recurrence = recurrence;
    }

    console.log("Calendar ID:", calendarId);
    console.log("Event payload:", JSON.stringify(eventPayload, null, 2));
    console.log("RFC3339 start:", startDateTimeISO);
    console.log("RFC3339 end:", endDateTimeISO);

    const data = await this.fetchWithAuth(CALENDAR_PRIMARY_API, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload),
    });

    console.log("Created Calendar Event:", data.id);

    return {
      eventId: data.id,
      htmlLink: data.htmlLink,
    };
  }

  /**
   * Update an existing Google Calendar Event
   */
  async updateCalendarEvent(
    token: string,
    eventId: string,
    eventDetails: CalendarEventInput
  ): Promise<{ eventId: string; htmlLink?: string }> {
    const calendarId = 'primary';
    const summaryText = eventDetails.title || eventDetails.summary || 'Pay Bill';
    const dateStr = eventDetails.startDate || eventDetails.date || eventDetails.dueDate || new Date().toISOString().split('T')[0];
    const timeStr = eventDetails.startTime || eventDetails.time || '20:00';
    
    let startDateTimeISO: string;
    let endDateTimeISO: string;

    try {
      const startObj = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(startObj.getTime())) {
        throw new Error('Invalid date/time');
      }
      startDateTimeISO = startObj.toISOString();
      const endObj = new Date(startObj.getTime() + 30 * 60 * 1000);
      endDateTimeISO = endObj.toISOString();
    } catch {
      startDateTimeISO = `${dateStr}T${timeStr}:00Z`;
      endDateTimeISO = `${dateStr}T${timeStr}:30Z`;
    }

    const minutesBefore = this.parseMinutesBefore(eventDetails.notifyBefore ?? eventDetails.minutesBefore);

    const formattedSummary = summaryText.startsWith('[SpendTrack]')
      ? summaryText
      : summaryText.startsWith('✓ Paid')
      ? `[SpendTrack] ${summaryText}`
      : `[SpendTrack] ${summaryText}`;

    const eventPayload: any = {
      summary: formattedSummary,
      start: {
        dateTime: startDateTimeISO,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endDateTimeISO,
        timeZone: "Asia/Kolkata",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: minutesBefore },
        ],
      },
    };

    if (eventDetails.colorId) {
      eventPayload.colorId = eventDetails.colorId;
    }

    if (eventDetails.description) {
      eventPayload.description = `${eventDetails.description}\n\nCreated by TrackPay.`;
    }

    console.log("Calendar ID:", calendarId);
    console.log("Event payload:", JSON.stringify(eventPayload, null, 2));
    console.log("RFC3339 start:", startDateTimeISO);
    console.log("RFC3339 end:", endDateTimeISO);

    const data = await this.fetchWithAuth(`${CALENDAR_PRIMARY_API}/${eventId}`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload),
    });

    console.log("Updated Calendar Event:", data.id);

    return { eventId: data.id, htmlLink: data.htmlLink };
  }

  /**
   * Delete an existing Google Calendar Event
   */
  async deleteCalendarEvent(token: string, eventId: string): Promise<boolean> {
    const res = await fetch(`${CALENDAR_PRIMARY_API}/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok && res.status !== 404) {
      const errText = await res.text();
      throw new Error(`Failed to delete Calendar event: ${errText}`);
    }

    return true;
  }

  /**
   * List upcoming events from Primary Calendar
   */
  async listUpcomingEvents(token: string, maxResults = 5): Promise<CalendarEventItem[]> {
    const now = new Date().toISOString();
    const url = `${CALENDAR_PRIMARY_API}?timeMin=${encodeURIComponent(now)}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;

    const data = await this.fetchWithAuth(url, token);
    const items = data.items || [];

    return items.map((item: any) => {
      const startDateTime = item.start?.dateTime || item.start?.date || '';
      const [startDate, fullTime] = startDateTime.split('T');
      const startTime = fullTime ? fullTime.substring(0, 5) : '09:00';

      return {
        id: item.id,
        summary: (item.summary || '').replace(/^\[SpendTrack\]\s*/, ''),
        description: item.description,
        startDate: startDate || new Date().toISOString().split('T')[0],
        startTime: startTime,
        htmlLink: item.htmlLink,
      };
    });
  }
}

export const googleCalendarService = new GoogleCalendarService();
