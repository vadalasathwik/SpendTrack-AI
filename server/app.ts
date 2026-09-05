import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./auth/routes.js";
import { authenticateJWT } from "./auth/jwt.js";
import { dataStore } from "./services/dataStore.js";
import { googleSheetsService } from "./google/sheetsService.js";
import { familyWorkspaceService } from "./services/familyWorkspaceService.js";
import { geminiAssistantService } from "./services/geminiService.js";
import { receiptVisionService } from "./services/receiptVisionService.js";

dotenv.config();

export function createExpressApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "20mb" }));

  // Health check
  app.get("/api/health", (_, res) => {
    res.json({ success: true });
  });

  // Google authentication
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
    const details = familyWorkspaceService.getWorkspaceDetails("default-user");
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

  // Expenses CRUD
  app.get("/api/expenses", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      if (token) {
        const expenses = await googleSheetsService.getExpenses(token);
        return res.json(expenses);
      }
      res.json(dataStore.getExpenses());
    } catch (err: any) {
      console.warn("Sheets sync warning (getExpenses):", err.message);
      res.json(dataStore.getExpenses());
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      let created;
      if (token) {
        created = await googleSheetsService.createExpense(token, req.body);
      } else {
        created = dataStore.createExpense(req.body);
      }
      res.json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      let updated;
      if (token) {
        updated = await googleSheetsService.updateExpense(token, req.params.id, req.body);
      } else {
        updated = dataStore.updateExpense(req.params.id, req.body);
      }
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      if (token) {
        await googleSheetsService.deleteExpense(token, req.params.id);
      }
      dataStore.deleteExpense(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to delete expense" });
    }
  });

  // Monthly Items CRUD
  app.get("/api/monthly-items", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      if (token) {
        const items = await googleSheetsService.getMonthlyItems(token);
        return res.json(items);
      }
      res.json(dataStore.getMonthlyItems());
    } catch (err: any) {
      console.warn("Sheets sync warning (getMonthlyItems):", err.message);
      res.json(dataStore.getMonthlyItems());
    }
  });

  app.post("/api/monthly-items", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      let created;
      if (token) {
        created = await googleSheetsService.createMonthlyItem(token, req.body);
      } else {
        created = dataStore.createMonthlyItem(req.body);
      }
      res.json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create monthly item" });
    }
  });

  app.put("/api/monthly-items/:id", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      let updated;
      if (token) {
        updated = await googleSheetsService.updateMonthlyItem(token, req.params.id, req.body);
      } else {
        updated = dataStore.updateMonthlyItem(req.params.id, req.body);
      }
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update monthly item" });
    }
  });

  app.delete("/api/monthly-items/:id", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      if (token) {
        await googleSheetsService.deleteMonthlyItem(token, req.params.id);
      }
      dataStore.deleteMonthlyItem(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to delete monthly item" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      if (token) {
        const cats = await googleSheetsService.getCategories(token);
        return res.json(cats);
      }
      res.json(dataStore.getCategories());
    } catch (err: any) {
      console.warn("Sheets sync warning (getCategories):", err.message);
      res.json(dataStore.getCategories());
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      let saved;
      if (token) {
        saved = await googleSheetsService.saveCategories(token, req.body);
      } else {
        saved = dataStore.saveCategories(req.body);
      }
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to save categories" });
    }
  });

  // Recurring Expenses CRUD
  app.get("/api/recurring", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      if (token) {
        const list = await googleSheetsService.getRecurringExpenses(token);
        return res.json(list);
      }
      res.json(dataStore.getRecurringExpenses());
    } catch (err: any) {
      console.warn("Sheets sync warning (getRecurring):", err.message);
      res.json(dataStore.getRecurringExpenses());
    }
  });

  app.post("/api/recurring", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      let created;
      if (token) {
        created = await googleSheetsService.createRecurringExpense(token, req.body);
      } else {
        created = dataStore.createRecurringExpense(req.body);
      }
      res.json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create recurring expense" });
    }
  });

  app.put("/api/recurring/:id", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      let updated;
      if (token) {
        updated = await googleSheetsService.updateRecurringExpense(token, req.params.id, req.body);
      } else {
        updated = dataStore.updateRecurringExpense(req.params.id, req.body);
      }
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update recurring expense" });
    }
  });

  app.delete("/api/recurring/:id", async (req, res) => {
    try {
      const token = (req as any).googleToken;
      if (token) {
        await googleSheetsService.deleteRecurringExpense(token, req.params.id);
      }
      dataStore.deleteRecurringExpense(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to delete recurring expense" });
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

  app.post("/api/receipt/scan", async (req, res) => {
    try {
      const { base64Data, type } = req.body || {};
      if (!base64Data) {
        return res.status(400).json({ error: "Missing base64Data" });
      }
      const data = await receiptVisionService.analyzeReceiptImage(base64Data, type);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to scan receipt" });
    }
  });

  // Budget AI
  app.get("/api/budget/summary", (req, res) => {
    res.json({ success: true, summary: "Monthly budget tracking is active." });
  });

  app.post("/api/budget/predict", (req, res) => {
    res.json({ success: true, predictedMonthlySpend: 15000 });
  });

  // SpendTrack AI Chat
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history, dateRange, clientData } = req.body || {};
      const reply = await geminiAssistantService.chat({
        message,
        history,
        dateRange,
        expenses: clientData?.expenses || dataStore.getExpenses(),
        recurringExpenses: clientData?.recurringExpenses || dataStore.getRecurringExpenses(),
        categories: clientData?.categories || dataStore.getCategories(),
      });
      res.json({ reply });
    } catch (err: any) {
      console.error("AI Chat error:", err);
      res.status(500).json({ error: err.message || "SpendTrack AI service error" });
    }
  });

  // Catch-all 404 for ANY /api/* request to prevent falling through to Vite HTML fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
  });

  return app;
}