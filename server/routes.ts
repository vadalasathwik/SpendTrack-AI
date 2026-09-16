import { Router } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "./services/expense.service.js";

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

export default router;