import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { signJWT } from "./jwt.js";
import { ApiErrorCodes, sendApiError } from "../middleware/apiError.js";
import { authGoogleRateLimit } from "../middleware/rateLimit.js";
import { prisma } from "../db/prisma.js";

const router = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const oauthClient = new OAuth2Client(googleClientId);

router.post("/google", authGoogleRateLimit, async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;

    if (!idToken) {
      return sendApiError(res, req, 400, ApiErrorCodes.BAD_REQUEST, "Missing idToken");
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      console.error("Google auth misconfiguration: GOOGLE_CLIENT_ID / VITE_GOOGLE_CLIENT_ID is not set");
      return sendApiError(
        res,
        req,
        500,
        ApiErrorCodes.SERVER_MISCONFIGURED,
        "Server misconfiguration: Google client ID is not set"
      );
    }

    const oauthClient = new OAuth2Client(googleClientId);

    let payload;
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error("Google token verification failed:", err);
      return sendApiError(
        res,
        req,
        401,
        ApiErrorCodes.GOOGLE_ID_TOKEN_INVALID,
        "Invalid Google ID token"
      );
    }

    if (!payload?.sub) {
      return sendApiError(
        res,
        req,
        401,
        ApiErrorCodes.GOOGLE_ID_TOKEN_INVALID,
        "Invalid Google token payload"
      );
    }

    const uid = payload.sub;
    const email = payload.email || "";
    const name = payload.name || "";
    const photoURL = payload.picture || "";

    let dbUser = await prisma.user.findUnique({
      where: { googleId: uid },
    });

    let isNewUser = false;
    if (!dbUser) {
      isNewUser = true;
      dbUser = await prisma.user.create({
        data: {
          googleId: uid,
          email,
          name,
          avatar: photoURL || null,
          categories: {
            create: {
              name: "General",
              color: "#6366F1",
              icon: "wallet",
            },
          },
        },
      });
    }

    const token = signJWT({
      user: {
        uid,
        email,
        name,
        photoURL,
      },
    });

    res.json({
      token,
      user: {
        uid,
        email,
        name,
        photoURL,
      },
      isNewUser,
    });
  } catch (err: unknown) {
    console.error("Google token verification failed:", err);
    return sendApiError(
      res,
      req,
      401,
      ApiErrorCodes.GOOGLE_ID_TOKEN_INVALID,
      "Invalid Google ID token"
    );
  }
});

export default router;
