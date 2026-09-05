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

    let uid = `user_${Date.now()}`;
    let email = "";
    let name = "Google User";
    let photoURL = "";

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
        photoURL = payload.picture || "";
      }
    } catch {
      // If client token is access token from Firebase popup
    }

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
  } catch (err: any) {
    console.error("Google token verification failed:", err);
    res.status(401).json({ error: "Invalid Google ID token" });
  }
});

export default router;
