import { Router } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "./services/expense.service.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./services/category.service.js";
import {
  getCurrentBudget,
  setBudget,
  getBudgetSummary,
} from "./services/budget.service.js";
import {
  getDashboardStats,
  getMonthlyTrend,
  getCategoryBreakdown,
  getWeeklySpending,
  getTopMerchants,
} from "./services/analytics.service.js";
import {
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  processDueRecurringExpenses,
} from "./services/recurring.service.js";
import { getIncomes, createIncome, deleteIncome } from "./services/income.service.js";
import { getReminders, createReminder, updateReminder, deleteReminder } from "./services/reminder.service.js";
import { getInvestments, createInvestment, updateInvestment, deleteInvestment } from "./services/investment.service.js";
import { getSavings, createSaving, updateSaving, deleteSaving } from "./services/savings.service.js";
import { getEmis, createEmi, updateEmi, deleteEmi } from "./services/emi.service.js";
import { getNotes, saveNote, createNote, updateNote, deleteNote } from "./services/note.service.js";
import { getPlannerSummary } from "./services/planner.service.js";
import { getUpcoming } from "./services/smartReminder.service.js";
import { getCashFlowCurrent } from "./services/cashflow.service.js";
import { getMonthlyFinancialHealth, canIAfford, detectOverspending, recommendSavings } from "./services/aiCfo.service.js";
import { getCfoCashflow } from "./services/cfoCashflow.service.js";
import { getGoals, createGoal, updateGoal, deleteGoal } from "./services/goal.service.js";
import { getNetWorth, createAsset, deleteAsset, createLiability, deleteLiability } from "./services/netWorth.service.js";
import { getMonthlyClosingReport } from "./services/closingReport.service.js";
import { getSmartNotifications } from "./services/notificationIntelligence.service.js";

const router = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const oauthClient = new OAuth2Client(googleClientId);

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const oauthClient = new OAuth2Client(googleClientId);

    const ticket = await oauthClient.verifyIdToken({
      idToken,
      ...(googleClientId ? { audience: googleClientId } : {}),
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: "Invalid Google token payload" });
    }

    const uid = payload.sub;
    const email = payload.email || "";
    const name = payload.name || "";
    const photoURL = payload.picture || "";

    const token = jwt.sign(
      {
        uid,
        email,
      },
      (() => { const s = (process.env.JWT_SECRET || "").trim(); if (!s) { throw new Error("JWT_SECRET environment variable is required"); } return s; })(),
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        uid,
        email,
        name,
        photoURL,
      },
      workspace: {
        spreadsheetId: "",
        driveFolderId: "",
        calendarId: "",
      },
      isNewUser: false,
    });
  } catch (err: any) {
    console.error("Google token verification failed:", err);
    res.status(401).json({ error: "Invalid Google ID token" });
  }
});

router.get("/api/expenses", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const expenses = await getExpenses(userId);
    res.json(expenses);
  } catch (err: any) {
    console.error("GET /api/expenses error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch expenses" });
  }
});

router.post("/api/expenses", async (req: any, res: any) => {
  console.log("POST /api/expenses");
  console.log("User:", req.user);
  console.log("Body:", req.body);
  try {
    const userId = req.user?.userId || req.user?.uid;
    const expense = await createExpense(userId, req.body);
    res.json(expense);
  } catch (err: any) {
    console.error("POST /api/expenses error:", err);
    res.status(400).json({ error: err.message || "Failed to create expense" });
  }
});

router.put("/api/expenses/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const expense = await updateExpense(userId, req.params.id, req.body);
    res.json(expense);
  } catch (err: any) {
    console.error("PUT /api/expenses/:id error:", err);
    res.status(400).json({ error: err.message || "Failed to update expense" });
  }
});

router.delete("/api/expenses/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteExpense(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/expenses/:id error:", err);
    res.status(400).json({ error: err.message || "Failed to delete expense" });
  }
});

router.get("/api/categories", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const categories = await getCategories(userId);
    res.json(categories);
  } catch (err: any) {
    console.error("GET /api/categories error:", err);
    const status = err.message === "Category not found" ? 404 : 500;
    res.status(status).json({ error: err.message || "Failed to fetch categories" });
  }
});

router.post("/api/categories", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const category = await createCategory(userId, req.body);
    res.json(category);
  } catch (err: any) {
    console.error("POST /api/categories error:", err);
    res.status(400).json({ error: err.message || "Failed to create category" });
  }
});

router.put("/api/categories/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const category = await updateCategory(userId, req.params.id, req.body);
    res.json(category);
  } catch (err: any) {
    console.error("PUT /api/categories/:id error:", err);
    const status = err.message === "Category not found" ? 404 : 400;
    res.status(status).json({ error: err.message || "Failed to update category" });
  }
});

router.delete("/api/categories/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteCategory(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/categories/:id error:", err);
    const status = err.message === "Category not found" ? 404 : 400;
    res.status(status).json({ error: err.message || "Failed to delete category" });
  }
});

router.get("/api/budget/current", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const budgetData = await getCurrentBudget(userId, month, year);
    res.json(budgetData);
  } catch (err: any) {
    console.error("GET /api/budget/current error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch current budget" });
  }
});

router.post("/api/budget", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const { month, year, amount, budget } = req.body || {};
    const budgetAmount = amount !== undefined ? amount : budget;

    const now = new Date();
    const targetMonth = month !== undefined ? parseInt(month, 10) : now.getMonth() + 1;
    const targetYear = year !== undefined ? parseInt(year, 10) : now.getFullYear();

    const result = await setBudget(userId, targetMonth, targetYear, budgetAmount);
    res.json(result);
  } catch (err: any) {
    console.error("POST /api/budget error:", err);
    res.status(400).json({ error: err.message || "Failed to save budget" });
  }
});

router.get("/api/budget/summary", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const summary = await getBudgetSummary(userId, month, year);
    res.json(summary);
  } catch (err: any) {
    console.error("GET /api/budget/summary error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch budget summary" });
  }
});

// Analytics Endpoints
router.get("/api/analytics/stats", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const stats = await getDashboardStats(userId);
    res.json(stats);
  } catch (err: any) {
    console.error("GET /api/analytics/stats error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch analytics stats" });
  }
});

router.get("/api/analytics/monthly", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const trend = await getMonthlyTrend(userId);
    res.json(trend);
  } catch (err: any) {
    console.error("GET /api/analytics/monthly error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch monthly trend" });
  }
});

router.get("/api/analytics/categories", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const breakdown = await getCategoryBreakdown(userId, month, year);
    res.json(breakdown);
  } catch (err: any) {
    console.error("GET /api/analytics/categories error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch category breakdown" });
  }
});

router.get("/api/analytics/weekly", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const weekly = await getWeeklySpending(userId);
    res.json(weekly);
  } catch (err: any) {
    console.error("GET /api/analytics/weekly error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch weekly spending" });
  }
});

router.get("/api/analytics/merchants", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const merchants = await getTopMerchants(userId);
    res.json(merchants);
  } catch (err: any) {
    console.error("GET /api/analytics/merchants error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch top merchants" });
  }
});

// Recurring Expense Endpoints
router.get("/api/recurring", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const items = await getRecurringExpenses(userId);
    res.json(items);
  } catch (err: any) {
    console.error("GET /api/recurring error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch recurring expenses" });
  }
});

router.post("/api/recurring", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const item = await createRecurringExpense(userId, req.body);
    res.json(item);
  } catch (err: any) {
    console.error("POST /api/recurring error:", err);
    res.status(400).json({ error: err.message || "Failed to create recurring expense" });
  }
});

router.put("/api/recurring/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const item = await updateRecurringExpense(userId, req.params.id, req.body);
    res.json(item);
  } catch (err: any) {
    console.error("PUT /api/recurring/:id error:", err);
    const status = err.message === "Recurring expense not found" ? 404 : 400;
    res.status(status).json({ error: err.message || "Failed to update recurring expense" });
  }
});

router.delete("/api/recurring/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteRecurringExpense(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/recurring/:id error:", err);
    const status = err.message === "Recurring expense not found" ? 404 : 400;
    res.status(status).json({ error: err.message || "Failed to delete recurring expense" });
  }
});

router.post("/api/recurring/process", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const result = await processDueRecurringExpenses(userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("POST /api/recurring/process error:", err);
    res.status(500).json({ error: err.message || "Failed to process due recurring expenses" });
  }
});

// Income Endpoints
router.get("/api/income", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const items = await getIncomes(userId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch income records" });
  }
});

router.post("/api/income", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const item = await createIncome(userId, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create income record" });
  }
});

router.delete("/api/income/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteIncome(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete income record" });
  }
});

// Reminders Endpoints
router.get("/api/reminders", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const items = await getReminders(userId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch reminders" });
  }
});

router.post("/api/reminders", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const item = await createReminder(userId, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create reminder" });
  }
});

router.put("/api/reminders/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const item = await updateReminder(userId, req.params.id, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update reminder" });
  }
});

router.delete("/api/reminders/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteReminder(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete reminder" });
  }
});

// Investments Endpoints
router.get("/api/investments", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const items = await getInvestments(userId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch investments" });
  }
});

router.post("/api/investments", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const item = await createInvestment(userId, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create investment" });
  }
});

router.put("/api/investments/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const item = await updateInvestment(userId, req.params.id, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update investment" });
  }
});

router.delete("/api/investments/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteInvestment(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete investment" });
  }
});

// Savings Endpoints
router.get("/api/savings", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const items = await getSavings(userId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch savings" });
  }
});

router.post("/api/savings", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const item = await createSaving(userId, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create savings record" });
  }
});

router.put("/api/savings/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const item = await updateSaving(userId, req.params.id, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update savings record" });
  }
});

router.delete("/api/savings/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteSaving(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete savings record" });
  }
});

// EMI Endpoints
router.get("/api/emis", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const items = await getEmis(userId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch EMIs" });
  }
});

router.post("/api/emis", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const item = await createEmi(userId, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create EMI" });
  }
});

router.put("/api/emis/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const item = await updateEmi(userId, req.params.id, req.body);
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update EMI" });
  }
});

router.delete("/api/emis/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteEmi(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete EMI" });
  }
});

// Upcoming Smart Reminders
router.get("/api/reminders/upcoming", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const upcoming = await getUpcoming(userId);
    res.json(upcoming);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch upcoming reminders" });
  }
});

// Cashflow Current Endpoint
router.get("/api/cashflow/current", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const cashflow = await getCashFlowCurrent(userId);
    res.json(cashflow);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch cash flow summary" });
  }
});

// Notes Endpoints (Enhanced)
router.get("/api/notes", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const notes = await getNotes(userId);
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch notes" });
  }
});

router.post("/api/notes", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const { content, title, tags, pinned } = req.body || {};
    const note = await createNote(userId, { content: content || "", title, tags, pinned });
    res.json(note);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to save note" });
  }
});

router.put("/api/notes/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const note = await updateNote(userId, req.params.id, req.body || {});
    res.json(note);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update note" });
  }
});

router.delete("/api/notes/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteNote(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete note" });
  }
});

// Planner Endpoints
router.get("/api/planner", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const summary = await getPlannerSummary(userId);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch planner summary" });
  }
});

// AI CFO Endpoints
router.get("/api/cfo/health", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const health = await getMonthlyFinancialHealth(userId);
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch financial health score" });
  }
});

router.get("/api/cfo/cashflow", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const cashflow = await getCfoCashflow(userId);
    res.json(cashflow);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch CFO cash flow" });
  }
});

router.post("/api/cfo/can-afford", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const { amount, category } = req.body || {};
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: "Amount is required and must be a valid number" });
    }
    const result = await canIAfford(userId, Number(amount), category);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to check affordability" });
  }
});

router.get("/api/cfo/overspending", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const alerts = await detectOverspending(userId);
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to detect overspending" });
  }
});

router.get("/api/cfo/savings-recommendations", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const recs = await recommendSavings(userId);
    res.json(recs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch savings recommendations" });
  }
});

router.get("/api/cfo/monthly-report", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const report = await getMonthlyClosingReport(userId, month, year);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate monthly closing report" });
  }
});

router.get("/api/cfo/smart-notifications", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const notifs = await getSmartNotifications(userId);
    res.json(notifs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch smart CFO notifications" });
  }
});

// Goals Endpoints
router.get("/api/goals", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const goals = await getGoals(userId);
    res.json(goals);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch goals" });
  }
});

router.post("/api/goals", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const goal = await createGoal(userId, req.body);
    res.json(goal);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create goal" });
  }
});

router.put("/api/goals/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const goal = await updateGoal(userId, req.params.id, req.body);
    res.json(goal);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update goal" });
  }
});

router.delete("/api/goals/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteGoal(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete goal" });
  }
});

// Net Worth Endpoints
router.get("/api/networth", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const networth = await getNetWorth(userId);
    res.json(networth);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch Net Worth" });
  }
});

router.post("/api/networth/assets", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const asset = await createAsset(userId, req.body);
    res.json(asset);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create asset" });
  }
});

router.delete("/api/networth/assets/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteAsset(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete asset" });
  }
});

router.post("/api/networth/liabilities", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    const liability = await createLiability(userId, req.body);
    res.json(liability);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create liability" });
  }
});

router.delete("/api/networth/liabilities/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId || req.user?.uid;
    await deleteLiability(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete liability" });
  }
});

export default router;