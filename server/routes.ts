import { Router } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { verifyFirebaseIdToken } from "./auth/firebaseAdmin.js";

const router = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const oauthClient = new OAuth2Client(googleClientId);

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    let uid = "";
    let email = "";
    let name = "";
    let picture = "";

    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken,
        ...(googleClientId ? { audience: googleClientId } : {}),
      });
      const payload = ticket.getPayload();
      if (payload) {
        uid = payload.sub;
        email = payload.email || "";
        name = payload.name || "";
        picture = payload.picture || "";
      }
    } catch (googleErr) {
      try {
        const decoded = await verifyFirebaseIdToken(idToken);
        uid = decoded.uid;
        email = decoded.email || "";
        name = decoded.name || "";
        picture = decoded.picture || "";
      } catch (fbErr) {
        console.error("Token verification error:", googleErr);
        throw googleErr;
      }
    }

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
        photoURL: picture,
      },
      workspace: {
        spreadsheetId: "",
        driveFolderId: "",
        calendarId: "",
      },
      isNewUser: false,
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;