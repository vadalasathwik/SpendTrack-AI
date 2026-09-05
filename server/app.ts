import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./auth/routes.js";
import { authenticateJWT } from "./auth/jwt.js";
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

  // Helper to extract Google Auth Token
  const getGoogleToken = (req: express.Request): string | null => {
    return (req as any).googleToken || req.headers.authorization?.replace("Bearer ", "") || null;
  };

  // Expenses CRUD
  app.get("/api/expenses", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const expenses = await googleSheetsService.getExpenses(token);
      res.json(expenses);
    } catch (err: any) {
      console.warn("Sheets sync warning (getExpenses):", err.message);
      res.status(500).json({ error: err.message || "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const created = await googleSheetsService.createExpense(token, req.body);
      res.json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const updated = await googleSheetsService.updateExpense(token, req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      await googleSheetsService.deleteExpense(token, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to delete expense" });
    }
  });

  // Monthly Items CRUD
  app.get("/api/monthly-items", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const items = await googleSheetsService.getMonthlyItems(token);
      res.json(items);
    } catch (err: any) {
      console.warn("Sheets sync warning (getMonthlyItems):", err.message);
      res.status(500).json({ error: err.message || "Failed to fetch monthly items" });
    }
  });

  app.post("/api/monthly-items", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const created = await googleSheetsService.createMonthlyItem(token, req.body);
      res.json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create monthly item" });
    }
  });

  app.put("/api/monthly-items/:id", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const updated = await googleSheetsService.updateMonthlyItem(token, req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update monthly item" });
    }
  });

  app.delete("/api/monthly-items/:id", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      await googleSheetsService.deleteMonthlyItem(token, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to delete monthly item" });
    }
  });

  // Consumption Log CRUD
  app.get("/api/consumption-log", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const logs = await googleSheetsService.getConsumptionLogs(token);
      res.json(logs);
    } catch (err: any) {
      console.warn("Sheets sync warning (getConsumptionLogs):", err.message);
      res.status(500).json({ error: err.message || "Failed to fetch consumption logs" });
    }
  });

  app.post("/api/consumption-log", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
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
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to log consumption" });
    }
  });

  app.delete("/api/consumption-log/:id", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      await googleSheetsService.deleteConsumptionLog(token, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to delete consumption log" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const cats = await googleSheetsService.getCategories(token);
      res.json(cats);
    } catch (err: any) {
      console.warn("Sheets sync warning (getCategories):", err.message);
      res.status(500).json({ error: err.message || "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const saved = await googleSheetsService.saveCategories(token, req.body);
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to save categories" });
    }
  });

  // Recurring Expenses CRUD
  app.get("/api/recurring", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const list = await googleSheetsService.getRecurringExpenses(token);
      res.json(list);
    } catch (err: any) {
      console.warn("Sheets sync warning (getRecurring):", err.message);
      res.status(500).json({ error: err.message || "Failed to fetch recurring expenses" });
    }
  });

  app.post("/api/recurring", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const created = await googleSheetsService.createRecurringExpense(token, req.body);
      res.json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create recurring expense" });
    }
  });

  app.post("/api/recurring/generate-due", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
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
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to auto-generate recurring expenses" });
    }
  });

  app.put("/api/recurring/:id", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      const updated = await googleSheetsService.updateRecurringExpense(token, req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update recurring expense" });
    }
  });

  app.delete("/api/recurring/:id", async (req, res) => {
    try {
      const token = getGoogleToken(req);
      if (!token) {
        return res.status(401).json({ error: "Google authentication required" });
      }
      await googleSheetsService.deleteRecurringExpense(token, req.params.id);
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
      const token = getGoogleToken(req);
      const { message, history, dateRange, clientData } = req.body || {};
      const expenses = clientData?.expenses || (token ? await googleSheetsService.getExpenses(token).catch(() => []) : []);
      const recurringExpenses = clientData?.recurringExpenses || (token ? await googleSheetsService.getRecurringExpenses(token).catch(() => []) : []);
      const categories = clientData?.categories || (token ? await googleSheetsService.getCategories(token).catch(() => []) : []);
      const reply = await geminiAssistantService.chat({
        message,
        history,
        dateRange,
        expenses,
        recurringExpenses,
        categories,
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