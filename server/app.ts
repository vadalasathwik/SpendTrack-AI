import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import authRoutes from "./auth/routes.js";
import apiRoutes from "./routes.js";
import { authenticateJWT, assertJwtSecretConfigured } from "./auth/jwt.js";
import { geminiAssistantService } from "./services/geminiService.js";
import { extractReceipt } from "./services/receipt.service.js";
import { prisma } from "./db/prisma.js";
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
  ...(process.env.APP_URL ? [process.env.APP_URL.trim()] : []),
];

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many authentication requests. Please try again later.",
    },
  },
});

export function createExpressApp() {
  assertJwtSecretConfigured();

  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || (ALLOWED_ORIGINS as string[]).includes(origin)) {
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

  // Production Health check with Prisma ping
  app.get("/api/health", async (_, res) => {
    let dbStatus = "connected";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbStatus = "disconnected";
    }

    res.json({
      status: dbStatus === "connected" ? "healthy" : "unhealthy",
      database: dbStatus,
      version: "7.2.0",
      uptime: process.uptime(),
    });
  });

  // Google authentication with rate limiting
  app.use("/api/auth", authRateLimiter, authRoutes);

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
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_RECEIPT_IMAGE",
            message: "Missing base64Data",
          },
        });
      }
      const data = await extractReceipt({ base64Data, mimeType: type });
      res.json(data);
    } catch (err: any) {
      const msg = err?.message || "";
      let code = "RECEIPT_AI_UNAVAILABLE";
      let status = 500;
      let userMessage = "Receipt AI is temporarily unavailable.";

      if (msg === "RECEIPT_AI_TIMEOUT") {
        code = "RECEIPT_AI_TIMEOUT";
        userMessage = "Receipt processing timed out. Please try again.";
      } else if (msg === "INVALID_RECEIPT_IMAGE") {
        code = "INVALID_RECEIPT_IMAGE";
        status = 400;
        userMessage = "Invalid or unreadable receipt image.";
      }

      return res.status(status).json({
        success: false,
        error: {
          code,
          message: userMessage,
        },
      });
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