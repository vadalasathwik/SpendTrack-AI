import { Router } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const router = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const oauthClient = new OAuth2Client(googleClientId);

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

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
      process.env.JWT_SECRET || "spendtrack_secret",
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

export default router;