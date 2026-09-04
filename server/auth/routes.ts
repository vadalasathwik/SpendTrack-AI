import { Router } from "express";
import jwt from "jsonwebtoken";
import { verifyFirebaseIdToken } from "./firebaseAdmin.js";

const router = Router();

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    const decoded = await verifyFirebaseIdToken(idToken);

    const token = jwt.sign(
      {
        uid: decoded.uid,
        email: decoded.email,
      },
      process.env.JWT_SECRET || "spendtrack_secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        uid: decoded.uid,
        email: decoded.email || "",
        name: decoded.name || "",
        photoURL: decoded.picture || "",
      },
      workspace: {
        spreadsheetId: "",
        driveFolderId: "",
        calendarId: "",
      },
      isNewUser: false,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid Firebase token" });
  }
});

export default router;
