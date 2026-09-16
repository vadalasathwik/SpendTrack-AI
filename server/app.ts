import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./auth/routes.js";
import apiRoutes from "./routes.js";
import { authenticateJWT, assertJwtSecretConfigured } from "./auth/jwt.js";
import { googleSheetsService } from "./google/sheetsService.js";
import { familyWorkspaceService } from "./services/familyWorkspaceService.js";
import { geminiAssistantService } from "./services/geminiService.js";
import { receiptVisionService } from "./services/receiptVisionService.js";
import { googleCalendarService } from "./services/googleCalendarService.js";
import {
  ApiErrorCodes,
  apiErrorHandler,
  handleRouteError,
  requestIdMiddleware,
  requireGoogleAccessToken,
  sendApiError,
} from "./middleware/apiError.js";
import { aiChatRateLimit, receiptScanRateLimit } from "./middleware/rateLimit.js";

dotenv.config();

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://spend-track-rho.vercel.app",
] as const;

export function createExpressApp() {
  // Fail fast in production if JWT_SECRET is missing (after dotenv has loaded).
  assertJwtSecretConfigured();

  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        // Non-browser clients (no Origin) and allowlisted browser origins only.
        if (!origin || (ALLOWED_ORIGINS as readonly string[]).includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    })
  );

  app.use(requestIdMiddleware);

  // Default JSON limit is small; receipt scan opts into a higher limit below.
  app.use((req, res, next) => {
    const path = req.path || req.originalUrl || "";
    const isReceiptScan =
      path === "/api/receipt/scan" || path.startsWith("/api/receipt/scan?");
    const limit = isReceiptScan ? "8mb" : "1mb";
    return express.json({ limit })(req, res, next);
  });

  // Health check
  app.get("/api/health", (_, res) => {
    res.json({ success: true });
  });

  // Google authentication (rate limit applied inside auth router)
  app.use("/api/auth", authRoutes);

  // Authenticate JWT for all subsequent /api routes
  app.use(authenticateJWT);

  // Workspace endpoints
  app.get("/api/workspace/status", (req, res) => {
    res.json({
      success: true,
      spreadsheetId: "",
      driveFolders: {
        receiptsFolderId: "",
      },
    });
  });

  app.post("/api/workspace/create", (req, res) => {
    res.json({ success: true, message: "Workspace created successfully" });
  });

  app.get("/api/workspace/members", (req, res) => {
    const user = (req as any).user;
    const details = familyWorkspaceService.getWorkspaceDetails(user?.uid || "");
    res.json(details);
  });

  app.post("/api/workspace/invite", (req, res) => {
    res.json({ success: true, message: "Invite sent" });
  });

  app.post("/api/workspace/accept", (req, res) => {
    res.json({ success: true, message: "Invite accepted" });
  });

  app.delete("/api/workspace/member", (req, res) => {
    res.json({ success: true });
  });

  // Helper to extract Google Auth Token (requires valid authenticated user session & googleToken)
  const getGoogleToken = (req: express.Request): string => {
    return requireGoogleAccessToken(req);
  };

  // Expenses CRUD (Prisma backend)
  app.use(apiRoutes);

  // Monthly Items CRUD
  app.get("/api/monthly-items", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const items = await googleSheetsService.getMonthlyItems(token);
      res.json(items);
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to fetch monthly items", 500);
    }
  });

  app.post("/api/monthly-items", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const created = await googleSheetsService.createMonthlyItem(token, req.body);
      res.json(created);
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to create monthly item", 400);
    }
  });

  app.put("/api/monthly-items/:id", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const updated = await googleSheetsService.updateMonthlyItem(token, req.params.id, req.body);
      res.json(updated);
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to update monthly item", 400);
    }
  });

  app.delete("/api/monthly-items/:id", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      await googleSheetsService.deleteMonthlyItem(token, req.params.id);
      res.json({ success: true });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to delete monthly item", 400);
    }
  });

  // Consumption Log CRUD
  app.get("/api/consumption-log", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const logs = await googleSheetsService.getConsumptionLogs(token);
      res.json(logs);
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to fetch consumption logs", 500);
    }
  });

  app.post("/api/consumption-log", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const log = await googleSheetsService.createConsumptionLog(token, req.body);

      // Update remaining quantity on matching MonthlyItem
      let updatedItem = null;
      if (req.body.itemId || req.body.itemName) {
        const items = await googleSheetsService.getMonthlyItems(token);
        const match = items.find(
          (m) => m.id === req.body.itemId || m.name.toLowerCase() === (req.body.itemName || '').toLowerCase()
        );
        if (match) {
          const currentRemaining =
            match.remainingQuantity !== undefined
              ? match.remainingQuantity
              : match.openingStock !== undefined
              ? match.openingStock
              : match.quantityPurchased !== undefined
              ? match.quantityPurchased
              : 0;

          const newRemaining = Math.max(
            0,
            Number((currentRemaining - (req.body.consumedQuantity || 0)).toFixed(2))
          );

          updatedItem = await googleSheetsService.updateMonthlyItem(token, match.id, {
            remainingQuantity: newRemaining,
          });
        }
      }

      res.json({ log, updatedItem });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to log consumption", 400);
    }
  });

  app.delete("/api/consumption-log/:id", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      await googleSheetsService.deleteConsumptionLog(token, req.params.id);
      res.json({ success: true });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to delete consumption log", 400);
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const cats = await googleSheetsService.getCategories(token);
      res.json(cats);
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to fetch categories", 500);
    }
  });

  app.post("/api/categories", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const saved = await googleSheetsService.saveCategories(token, req.body);
      res.json(saved);
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to save categories", 400);
    }
  });

  // Recurring Expenses CRUD
  app.get("/api/recurring", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const list = await googleSheetsService.getRecurringExpenses(token);
      res.json(list);
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to fetch recurring expenses", 500);
    }
  });

  app.post("/api/recurring", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const created = await googleSheetsService.createRecurringExpense(token, req.body);
      res.json(created);
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to create recurring expense", 400);
    }
  });

  app.post("/api/recurring/generate-due", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const bills = await googleSheetsService.getRecurringExpenses(token);
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonthNum = today.getMonth() + 1;
      const currentMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;
      const currentDay = today.getDate();

      const createdExpenses: any[] = [];
      const updatedBills: any[] = [];

      for (const bill of bills) {
        if (bill.isActive === false || bill.autopost === false) continue;
        if (bill.lastGeneratedMonth === currentMonthStr) continue;

        const targetDueDay = Math.min(bill.dueDay || 1, new Date(currentYear, currentMonthNum, 0).getDate());
        const dueDateStr = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(targetDueDay).padStart(2, "0")}`;

        if (currentDay >= targetDueDay) {
          const expense = await googleSheetsService.createExpense(token, {
            itemName: bill.name || bill.title || "Recurring Bill",
            category: bill.category || "Utilities",
            subcategory: bill.subcategory || "",
            totalPrice: bill.amount || 0,
            purchaseDate: dueDateStr,
            notes: bill.notes ? `Auto-generated: ${bill.notes}` : "Auto-generated recurring bill",
            source: "recurring",
            recurringId: bill.id,
          });

          const updatedBill = await googleSheetsService.updateRecurringExpense(token, bill.id, {
            lastGeneratedMonth: currentMonthStr,
            lastRecordedDate: dueDateStr,
          });

          createdExpenses.push(expense);
          updatedBills.push(updatedBill);
        }
      }

      res.json({ success: true, createdExpenses, updatedBills });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to auto-generate recurring expenses", 500);
    }
  });

  app.put("/api/recurring/:id", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const updated = await googleSheetsService.updateRecurringExpense(token, req.params.id, req.body);
      res.json(updated);
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to update recurring expense", 400);
    }
  });

  app.delete("/api/recurring/:id", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      await googleSheetsService.deleteRecurringExpense(token, req.params.id);
      res.json({ success: true });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to delete recurring expense", 400);
    }
  });

  // Drive & Receipt Upload
  app.post("/api/drive/upload-receipt", (req, res) => {
    res.json({
      fileId: `file_${Date.now()}`,
      fileName: req.body?.name || "receipt.jpg",
      webViewLink: "#",
    });
  });

  app.get("/api/drive/file/:fileId", (req, res) => {
    res.json({
      fileId: req.params.fileId,
      name: "receipt.jpg",
      mimeType: "image/jpeg",
      webViewLink: "#",
    });
  });

  app.post("/api/receipt/scan", receiptScanRateLimit, async (req, res) => {
    try {
      const { base64Data, type } = req.body || {};
      if (!base64Data) {
        return sendApiError(res, req, 400, ApiErrorCodes.BAD_REQUEST, "Missing base64Data");
      }
      const data = await receiptVisionService.analyzeReceiptImage(base64Data, type);
      res.json(data);
    } catch (err: unknown) {
      console.error("Server /api/receipt/scan caught error:", err);
      return handleRouteError(res, req, err, "Receipt scanner unavailable", 500);
    }
  });

  // User Settings Routes (Google Sheets Settings Tab)
  app.get("/api/settings", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const settings = await googleSheetsService.getSettings(token);
      res.json(settings);
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to fetch settings from Google Sheets", 500);
    }
  });

  app.post("/api/settings", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const updated = await googleSheetsService.saveSettings(token, req.body || {});
      res.json(updated);
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to save settings to Google Sheets", 500);
    }
  });

  // Budget AI
  app.get("/api/budget/summary", (req, res) => {
    res.json({ success: true, summary: "Monthly budget tracking is active." });
  });

  app.post("/api/budget/predict", (req, res) => {
    res.json({ success: true, predictedMonthlySpend: 15000 });
  });

  // Google Calendar API routes
  app.post("/api/calendar/event", async (req, res) => {
    let accessToken: string;
    try {
      accessToken = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }

    try {
      const result = await googleCalendarService.createCalendarEvent(accessToken, req.body);
      return res.json({
        success: true,
        eventId: result.eventId,
        htmlLink: result.htmlLink,
      });
    } catch (err: unknown) {
      console.error("Google Calendar API Error:", err);
      return handleRouteError(res, req, err, "Failed to create Google Calendar event", 500);
    }
  });

  app.put("/api/calendar/event/:id", async (req, res) => {
    let accessToken: string;
    try {
      accessToken = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }

    try {
      const result = await googleCalendarService.updateCalendarEvent(accessToken, req.params.id, req.body);
      return res.json({
        success: true,
        eventId: result.eventId,
        htmlLink: result.htmlLink,
      });
    } catch (err: unknown) {
      console.error("Google Calendar API Error:", err);
      return handleRouteError(res, req, err, "Failed to update Google Calendar event", 500);
    }
  });

  app.delete("/api/calendar/event/:id", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      await googleCalendarService.deleteCalendarEvent(token, req.params.id);
      res.json({ success: true });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to delete Google Calendar event", 500);
    }
  });

  app.get("/api/calendar/upcoming", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const maxResults = parseInt(req.query.maxResults as string, 10) || 5;
      const events = await googleCalendarService.listUpcomingEvents(token, maxResults);
      res.json({ success: true, events });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to fetch upcoming calendar events", 500);
    }
  });

  app.post("/api/calendar/sync", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const events = await googleCalendarService.listUpcomingEvents(token, 10);
      res.json({ success: true, lastSyncedAt: new Date().toISOString(), eventsCount: events.length });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to sync calendar", 500);
    }
  });

  // SpendTrack AI Chat
  app.post("/api/ai/chat", aiChatRateLimit, async (req, res) => {
    try {
      const { message, history, dateRange, clientData } = req.body || {};
      if (!message || typeof message !== "string") {
        return sendApiError(res, req, 400, ApiErrorCodes.BAD_REQUEST, "Missing message");
      }

      let token: string | null = null;
      try {
        token = getGoogleToken(req);
      } catch {
        token = null;
      }
      if (!token && !clientData) {
        return sendApiError(
          res,
          req,
          401,
          ApiErrorCodes.GOOGLE_AUTH_REQUIRED,
          "Unauthorized: Google authentication required"
        );
      }

      const expenses = clientData?.expenses || (token ? await googleSheetsService.getExpenses(token).catch(() => []) : []);
      const recurringExpenses = clientData?.recurringExpenses || (token ? await googleSheetsService.getRecurringExpenses(token).catch(() => []) : []);
      const categories = clientData?.categories || (token ? await googleSheetsService.getCategories(token).catch(() => []) : []);
      const upcomingCalendarEvents = token ? await googleCalendarService.listUpcomingEvents(token, 10).catch(() => []) : [];
      const reply = await geminiAssistantService.chat({
        message,
        history,
        dateRange,
        expenses,
        recurringExpenses,
        categories,
        upcomingCalendarEvents,
      });
      res.json({ reply });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "TrackPay AI service error", 500);
    }
  });

  // SpendTrack AI Chat History & Notifications
  app.get("/api/ai/chat/history", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const history = await googleSheetsService.getAIChatHistory(token);
      res.json({ success: true, history });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to fetch AI chat history", 500);
    }
  });

  app.post("/api/ai/chat/history", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const saved = await googleSheetsService.saveAIChatMessage(token, req.body || {});
      res.json({ success: true, saved });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to save AI chat message", 500);
    }
  });

  app.delete("/api/ai/chat/history/:chatId", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      await googleSheetsService.deleteAIChat(token, req.params.chatId);
      res.json({ success: true });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to delete AI chat session", 500);
    }
  });

  app.get("/api/notifications", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const notifications = await googleSheetsService.getNotifications(token);
      res.json({ success: true, notifications });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to fetch notifications", 500);
    }
  });

  app.post("/api/notifications", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const notification = await googleSheetsService.saveNotification(token, req.body || {});
      res.json({ success: true, notification });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to save notification", 500);
    }
  });

  app.put("/api/notifications/:id", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      const updated = await googleSheetsService.updateNotification(token, req.params.id, req.body || {});
      res.json({ success: true, notification: updated });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to update notification", 500);
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      await googleSheetsService.deleteNotification(token, req.params.id);
      res.json({ success: true });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to delete notification", 500);
    }
  });

  app.delete("/api/notifications", async (req, res) => {
    let token: string;
    try {
      token = getGoogleToken(req);
    } catch (err) {
      return handleRouteError(res, req, err, "Unauthorized: Google authentication required", 401);
    }
    try {
      await googleSheetsService.clearAllNotifications(token);
      res.json({ success: true });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "Failed to clear all notifications", 500);
    }
  });

  // Catch-all 404 for ANY /api/* request to prevent falling through to Vite HTML fallback
  app.all("/api/*", (req, res) => {
    sendApiError(
      res,
      req,
      404,
      ApiErrorCodes.NOT_FOUND,
      `API endpoint ${req.method} ${req.path} not found`
    );
  });

  app.use(apiErrorHandler);

  return app;
}