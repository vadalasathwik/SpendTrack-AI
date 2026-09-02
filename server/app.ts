import express, { Request, Response, NextFunction } from 'express';
import { GoogleSheetsService } from './google/sheetsService.js';
import { GoogleDriveService } from './google/driveService.js';
import { GoogleCalendarService } from './google/calendarService.js';
import { geminiAssistantService } from './services/geminiService.js';

export function createExpressApp(): express.Application {
  const app = express();

  // Middleware for JSON body parsing with large limit for receipt base64 images
  app.use(express.json({ limit: '25mb' }));

  const sheetsService = new GoogleSheetsService();
  const driveService = new GoogleDriveService();
  const calendarService = new GoogleCalendarService();

  // Helper to extract Bearer token
  function getBearerToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Authentication middleware
  function requireGoogleToken(req: Request, res: Response, next: NextFunction) {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Google access token is required.' });
    }
    (req as any).googleToken = token;
    next();
  }

  // Helper to handle API errors and consistently return 401 on Google auth failures
  function handleApiError(res: Response, error: any, fallbackMessage: string) {
    console.error(fallbackMessage, error);
    const is401 =
      error?.status === 401 ||
      (error?.message &&
        (error.message.includes('401') ||
          error.message.includes('Invalid Credentials') ||
          error.message.includes('Unauthenticated') ||
          error.message.includes('invalid_token') ||
          error.message.includes('invalid_grant')));

    const statusCode = is401 ? 401 : 500;
    const errorMessage = is401
      ? 'Unauthorized: Expired or invalid Google access token. Please sign in with Google again.'
      : error?.message || fallbackMessage;

    return res.status(statusCode).json({ error: errorMessage });
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'SpendTrack API', timestamp: new Date().toISOString() });
  });

  // Setup & initialization route to verify Google Drive and Sheets accessibility
  app.get('/api/workspace/status', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const spreadsheetId = await sheetsService.getOrCreateSpendTrackSpreadsheet(token);
      const driveFolders = await driveService.ensureFolders(token);

      res.json({
        success: true,
        spreadsheetId,
        driveFolders,
      });
    } catch (error: any) {
      handleApiError(res, error, 'Failed to initialize Google Workspace resources.');
    }
  });

  // ==========================================
  // EXPENSES API ROUTES
  // ==========================================

  app.get('/api/expenses', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const expenses = await sheetsService.getExpenses(token);
      res.json(expenses);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to fetch expenses from Google Sheets.');
    }
  });

  app.post('/api/expenses', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const newExpense = await sheetsService.createExpense(token, req.body);
      res.status(201).json(newExpense);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to save expense in Google Sheets.');
    }
  });

  app.put('/api/expenses/:id', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const { id } = req.params;
      const updated = await sheetsService.updateExpense(token, id, req.body);
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to update expense in Google Sheets.');
    }
  });

  app.delete('/api/expenses/:id', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const { id } = req.params;
      const success = await sheetsService.deleteExpense(token, id);
      res.json({ success });
    } catch (error: any) {
      handleApiError(res, error, 'Failed to delete expense from Google Sheets.');
    }
  });

  // ==========================================
  // CATEGORIES API ROUTES
  // ==========================================

  app.get('/api/categories', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const categories = await sheetsService.getCategories(token);
      res.json(categories);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to fetch categories.');
    }
  });

  app.post('/api/categories', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const categories = await sheetsService.saveCategories(token, req.body);
      res.json(categories);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to save categories.');
    }
  });

  // ==========================================
  // RECURRING EXPENSES API ROUTES
  // ==========================================

  app.get('/api/recurring', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const recurring = await sheetsService.getRecurringExpenses(token);
      res.json(recurring);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to fetch recurring expenses.');
    }
  });

  app.post('/api/recurring', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      let calendarEventId = req.body.calendarEventId;

      // If calendar reminder enabled and no event ID yet, create Calendar event
      if (req.body.calendarReminderEnabled && !calendarEventId) {
        try {
          const cal = await calendarService.createReminder(token, {
            summary: `${req.body.name} (₹${req.body.amount})`,
            description: req.body.notes || `Recurring ${req.body.category} expense`,
            dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
            frequency: req.body.frequency || 'monthly',
          });
          calendarEventId = cal.eventId;
        } catch (calErr: any) {
          console.warn('Calendar event creation warning:', calErr.message);
        }
      }

      const newRecurring = await sheetsService.createRecurringExpense(token, {
        ...req.body,
        calendarEventId,
      });
      res.status(201).json(newRecurring);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to save recurring expense.');
    }
  });

  app.put('/api/recurring/:id', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const { id } = req.params;
      let calendarEventId = req.body.calendarEventId;

      // Handle calendar event synchronization
      if (req.body.calendarReminderEnabled) {
        if (calendarEventId) {
          try {
            await calendarService.updateReminder(token, calendarEventId, {
              summary: `${req.body.name} (₹${req.body.amount})`,
              description: req.body.notes || `Recurring ${req.body.category} expense`,
              dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
              frequency: req.body.frequency || 'monthly',
            });
          } catch (calErr: any) {
            console.warn('Calendar update warning:', calErr.message);
          }
        } else {
          try {
            const cal = await calendarService.createReminder(token, {
              summary: `${req.body.name} (₹${req.body.amount})`,
              description: req.body.notes || `Recurring ${req.body.category} expense`,
              dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
              frequency: req.body.frequency || 'monthly',
            });
            calendarEventId = cal.eventId;
          } catch (calErr: any) {
            console.warn('Calendar create on update warning:', calErr.message);
          }
        }
      } else if (calendarEventId && req.body.calendarReminderEnabled === false) {
        // Remove calendar event if disabled
        try {
          await calendarService.deleteReminder(token, calendarEventId);
          calendarEventId = '';
        } catch (calErr: any) {
          console.warn('Calendar delete warning:', calErr.message);
        }
      }

      const updated = await sheetsService.updateRecurringExpense(token, id, {
        ...req.body,
        calendarEventId,
      });
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to update recurring expense.');
    }
  });

  app.delete('/api/recurring/:id', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const { id } = req.params;
      const eventId = req.query.calendarEventId as string;
      
      if (eventId) {
        try {
          await calendarService.deleteReminder(token, eventId);
        } catch (calErr: any) {
          console.warn('Calendar delete warning:', calErr.message);
        }
      }

      const success = await sheetsService.deleteRecurringExpense(token, id);
      res.json({ success });
    } catch (error: any) {
      handleApiError(res, error, 'Failed to delete recurring expense.');
    }
  });

  // ==========================================
  // MONTHLY ITEMS (TEMPLATES) API ROUTES
  // ==========================================

  app.get('/api/monthly-items', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const items = await sheetsService.getMonthlyItems(token);
      res.json(items);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to fetch monthly items.');
    }
  });

  app.post('/api/monthly-items', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const item = await sheetsService.createMonthlyItem(token, req.body);
      res.json(item);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to create monthly item.');
    }
  });

  app.put('/api/monthly-items/:id', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const { id } = req.params;
      const updated = await sheetsService.updateMonthlyItem(token, id, req.body);
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to update monthly item.');
    }
  });

  app.delete('/api/monthly-items/:id', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const { id } = req.params;
      const success = await sheetsService.deleteMonthlyItem(token, id);
      res.json({ success });
    } catch (error: any) {
      handleApiError(res, error, 'Failed to delete monthly item.');
    }
  });

  // ==========================================
  // GOOGLE DRIVE RECEIPTS & EXPORTS API ROUTES
  // ==========================================

  app.post('/api/drive/upload-receipt', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const { name, type, base64Data } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: 'base64Data is required' });
      }

      const file = await driveService.uploadReceipt(token, {
        name: name || 'receipt.jpg',
        type: type || 'image/jpeg',
        base64Data,
      });

      res.json(file);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to upload receipt to Google Drive.');
    }
  });

  app.get('/api/drive/file/:fileId', requireGoogleToken, async (req, res) => {
    try {
      const token = (req as any).googleToken;
      const { fileId } = req.params;
      const file = await driveService.getReceiptFile(token, fileId);
      res.json(file);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to fetch Google Drive file info.');
    }
  });

  // ==========================================
  // SPENDTRACK AI ASSISTANT API ROUTES
  // ==========================================

  app.post(['/api/ai/chat', '/api/ai/ask'], requireGoogleToken, async (req, res) => {
    try {
      const { message, history, dateRange, clientData, currentDate } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'A message string is required.' });
      }

      const token = (req as any).googleToken;
      let expenses = clientData?.expenses || [];
      let recurringExpenses = clientData?.recurringExpenses || [];
      let categories = clientData?.categories || [];

      // Fetch latest synced data from user's Google Sheets
      if (token) {
        try {
          const [liveExpenses, liveRecurring, liveCategories] = await Promise.all([
            sheetsService.getExpenses(token).catch(() => null),
            sheetsService.getRecurringExpenses(token).catch(() => null),
            sheetsService.getCategories(token).catch(() => null),
          ]);
          if (liveExpenses && liveExpenses.length > 0) expenses = liveExpenses;
          if (liveRecurring && liveRecurring.length > 0) recurringExpenses = liveRecurring;
          if (liveCategories && liveCategories.length > 0) categories = liveCategories;
        } catch (syncErr) {
          console.warn('AI fallback to client data:', syncErr);
        }
      }

      const reply = await geminiAssistantService.chat({
        message,
        history,
        expenses,
        recurringExpenses,
        categories,
        dateRange,
        currentDate: currentDate || new Date().toISOString().split('T')[0],
      });

      res.json({ reply });
    } catch (error: any) {
      handleApiError(res, error, 'SpendTrack AI is temporarily unavailable.');
    }
  });

  return app;
}
