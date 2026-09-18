import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./auth/routes.js";
import apiRoutes from "./routes.js";
import { authenticateJWT, assertJwtSecretConfigured } from "./auth/jwt.js";
import { geminiAssistantService } from "./services/geminiService.js";
import { extractReceipt } from "./services/receipt.service.js";
import {
  ApiErrorCodes,
  apiErrorHandler,
  handleRouteError,
  requestIdMiddleware,
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
  assertJwtSecretConfigured();

  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || (ALLOWED_ORIGINS as readonly string[]).includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    })
  );

  app.use(requestIdMiddleware);

  app.use((req, res, next) => {
    const path = req.path || req.originalUrl || "";
    const isReceiptScan =
      path === "/api/receipt/scan" || path.startsWith("/api/receipt/scan?");
    const limit = isReceiptScan ? "8mb" : "1mb";
    return express.json({ limit })(req, res, next);
  });

  // Health check
  app.get("/api/health", (_, res) => {
    res.json({ success: true, database: "postgresql" });
  });

  // Google authentication (rate limit applied inside auth router)
  app.use("/api/auth", authRoutes);

  // Authenticate JWT for all subsequent /api routes
  app.use(authenticateJWT);

  // Workspace status
  app.get("/api/workspace/status", (req, res) => {
    res.json({
      success: true,
      database: "postgresql",
    });
  });

  // Expenses, Categories, Monthly Budget CRUD (Prisma backend)
  app.use(apiRoutes);

  // Receipt Scanner (Gemini Vision)
  app.post("/api/receipt/scan", receiptScanRateLimit, async (req, res) => {
    try {
      const { base64Data, type } = req.body || {};
      if (!base64Data) {
        return sendApiError(res, req, 400, ApiErrorCodes.BAD_REQUEST, "Missing base64Data");
      }
      const data = await extractReceipt({ base64Data, mimeType: type });
      res.json(data);
    } catch (err: unknown) {
      console.error("Server /api/receipt/scan caught error:", err);
      return handleRouteError(res, req, err, "Receipt scanner unavailable", 500);
    }
  });


  // Budget AI Prediction
  app.post("/api/budget/predict", (req, res) => {
    res.json({ success: true, predictedMonthlySpend: 15000 });
  });

  // SpendTrack AI Chat (Uses Gemini with clientData)
  app.post("/api/ai/chat", aiChatRateLimit, async (req, res) => {
    try {
      const { message, history, dateRange, clientData } = req.body || {};
      if (!message || typeof message !== "string") {
        return sendApiError(res, req, 400, ApiErrorCodes.BAD_REQUEST, "Missing message");
      }

      const expenses = clientData?.expenses || [];
      const recurringExpenses = clientData?.recurringExpenses || [];
      const categories = clientData?.categories || [];

      const reply = await geminiAssistantService.chat({
        message,
        history,
        dateRange,
        expenses,
        recurringExpenses,
        categories,
      });
      res.json({ reply });
    } catch (err: unknown) {
      return handleRouteError(res, req, err, "TrackPay AI service error", 500);
    }
  });

  // SpendTrack AI Chat History
  app.get("/api/ai/chat/history", (req, res) => {
    res.json({ success: true, history: [] });
  });

  app.post("/api/ai/chat/history", (req, res) => {
    res.json({ success: true, saved: req.body || {} });
  });

  app.delete("/api/ai/chat/history/:chatId", (req, res) => {
    res.json({ success: true });
  });

  // Notifications
  app.get("/api/notifications", (req, res) => {
    res.json({ success: true, notifications: [] });
  });

  app.post("/api/notifications", (req, res) => {
    res.json({ success: true, notification: req.body || {} });
  });

  app.put("/api/notifications/:id", (req, res) => {
    res.json({ success: true, notification: req.body || {} });
  });

  app.delete("/api/notifications/:id", (req, res) => {
    res.json({ success: true });
  });

  app.delete("/api/notifications", (req, res) => {
    res.json({ success: true });
  });

  // Catch-all 404 for ANY /api/* request
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