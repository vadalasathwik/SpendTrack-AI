import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { signJWT } from "./jwt.js";

const router = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const oauthClient = new OAuth2Client(googleClientId);

router.post("/google", async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    if (!googleClientId) {
      console.error("Google auth misconfiguration: GOOGLE_CLIENT_ID / VITE_GOOGLE_CLIENT_ID is not set");
      return res.status(500).json({ error: "Server misconfiguration: Google client ID is not set" });
    }

    let payload;
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error("Google token verification failed:", err);
      return res.status(401).json({ error: "Invalid Google ID token" });
    }

    if (!payload?.sub) {
      return res.status(401).json({ error: "Invalid Google token payload" });
    }

    const uid = payload.sub;
    const email = payload.email || "";
    const name = payload.name || "";
    const photoURL = payload.picture || "";

    const token = signJWT({
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
      googleToken: accessToken || idToken,
    });

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
  } catch (err: unknown) {
    console.error("Google token verification failed:", err);
    res.status(401).json({ error: "Invalid Google ID token" });
  }
});

export default router;
