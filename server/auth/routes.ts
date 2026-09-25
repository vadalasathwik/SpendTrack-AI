import { Router } from "express";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { signJWT } from "./jwt.js";
import { ApiErrorCodes, sendApiError } from "../middleware/apiError.js";
import { authGoogleRateLimit } from "../middleware/rateLimit.js";
import { prisma } from "../db/prisma.js";
import {
  generateGoogleAuthUrl,
  handleGoogleCallback,
  refreshSession,
  revokeSession,
  revokeAllUserSessions,
  revokeSessionById,
  getUserActiveSessions,
  hashToken,
} from "../services/auth.service.js";

const router = Router();

// Helper to extract refresh token from cookies or authorization header/body
const parseRefreshToken = (req: any): string | null => {
  if (req.cookies && req.cookies.trackpay_refresh_token) {
    return req.cookies.trackpay_refresh_token;
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/trackpay_refresh_token=([^;]+)/);
    if (match) return match[1];
  }
  return req.body?.refreshToken || null;
};

// 1. GET /api/auth/google - OAuth Redirect
router.get("/google", (req, res) => {
  try {
    const appUrl = (process.env.APP_URL || "http://localhost:5173").trim();
    const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "").trim();
    const redirectUri = new URL("/api/auth/google/callback", appUrl).toString();

    console.log("OAuth Redirect Debug:", {
      APP_URL: appUrl,
      GOOGLE_CLIENT_ID: clientId,
      redirectUri,
    });

    const authUrl = generateGoogleAuthUrl();
    res.redirect(authUrl);
  } catch (err: any) {
    sendApiError(res, req, 500, ApiErrorCodes.SERVER_MISCONFIGURED, err.message || "Failed to generate Google Auth URL");
  }
});

// GET /api/auth/debug - Debug endpoint for OAuth config
router.get("/debug", (req, res) => {
  const appUrl = (process.env.APP_URL || "http://localhost:5173").trim();
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  const redirectUri = new URL("/api/auth/google/callback", appUrl).toString();

  res.json({
    appUrl,
    redirectUri,
    clientId,
    callbackPath: "/api/auth/google/callback",
  });
});

// 2. GET /api/auth/google/callback - OAuth Callback
router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return sendApiError(res, req, 400, ApiErrorCodes.BAD_REQUEST, "Missing authorization code from Google OAuth");
    }

    const reqInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.socket?.remoteAddress,
    };

    const { user, accessToken, refreshToken } = await handleGoogleCallback(code, reqInfo);
    const appUrl = (process.env.APP_URL || "http://localhost:5173").trim();

    // Set 7-day HTTP-Only Refresh Cookie
    res.cookie("trackpay_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    res.redirect(`${appUrl}/#access_token=${accessToken}`);
  } catch (err: any) {
    console.error("Google OAuth Callback Error:", err);
    const appUrl = (process.env.APP_URL || "http://localhost:5173").trim();
    res.redirect(`${appUrl}/#oauth_error=${encodeURIComponent(err.message || "OAuth Authentication Failed")}`);
  }
});

// 3. POST /api/auth/google - Directly process idToken or code
router.post("/google", authGoogleRateLimit, async (req, res) => {
  try {
    const { idToken, code } = req.body;

    if (code) {
      const reqInfo = {
        userAgent: req.headers["user-agent"],
        ip: req.ip || req.socket?.remoteAddress,
      };
      const result = await handleGoogleCallback(code, reqInfo);

      res.cookie("trackpay_refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return res.json({
        token: result.accessToken,
        accessToken: result.accessToken,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          picture: result.user.picture || result.user.avatar || "",
          googleId: result.user.googleId,
          provider: result.user.provider,
        },
        isNewUser: result.isNewUser,
      });
    }

    if (!idToken) {
      return sendApiError(res, req, 400, ApiErrorCodes.BAD_REQUEST, "Missing idToken or code");
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
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

    const googleId = payload.sub;
    const email = payload.email || "";
    const name = payload.name || email.split("@")[0];
    const pictureUrl = payload.picture || "";

    let dbUser = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    let isNewUser = false;
    if (!dbUser) {
      isNewUser = true;
      dbUser = await prisma.user.create({
        data: {
          googleId,
          email,
          name,
          picture: pictureUrl || null,
          avatar: pictureUrl || null,
          provider: "google",
          categories: {
            create: {
              name: "General",
              color: "#6366F1",
              icon: "wallet",
            },
          },
        },
      });
    } else {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          name: name || dbUser.name,
          picture: pictureUrl || dbUser.picture,
          avatar: pictureUrl || dbUser.avatar,
          googleId,
        },
      });
    }

    const userPayload = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      picture: dbUser.picture || dbUser.avatar || "",
      googleId: dbUser.googleId,
      provider: dbUser.provider,
    };

    const accessToken = signJWT({ user: userPayload }, 15 * 60);

    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: dbUser.id,
        refreshTokenHash,
        device: req.headers["user-agent"] || "Unknown Device",
        ipAddress: req.ip || req.socket?.remoteAddress || "127.0.0.1",
        expiresAt,
      },
    });

    res.cookie("trackpay_refresh_token", rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      token: accessToken,
      accessToken,
      user: userPayload,
      isNewUser,
    });
  } catch (err: unknown) {
    console.error("Google token verification failed:", err);
    return sendApiError(
      res,
      req,
      401,
      ApiErrorCodes.GOOGLE_ID_TOKEN_INVALID,
      "Invalid Google token"
    );
  }
});

// 4. POST /api/auth/refresh - Silent Access Token Refresh via HTTP-Only Cookie
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = parseRefreshToken(req);
    if (!refreshToken) {
      return sendApiError(res, req, 401, ApiErrorCodes.UNAUTHORIZED, "Missing refresh token cookie");
    }

    const { accessToken, user } = await refreshSession(refreshToken);
    res.json({
      accessToken,
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture || user.avatar || "",
        googleId: user.googleId,
        provider: user.provider,
      },
    });
  } catch (err: any) {
    res.clearCookie("trackpay_refresh_token", { path: "/" });
    sendApiError(res, req, 401, ApiErrorCodes.UNAUTHORIZED, err.message || "Failed to refresh session");
  }
});

// 5. POST /api/auth/logout - Single Device Logout
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = parseRefreshToken(req);
    if (refreshToken) {
      await revokeSession(refreshToken);
    }
    res.clearCookie("trackpay_refresh_token", { path: "/" });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    res.clearCookie("trackpay_refresh_token", { path: "/" });
    res.json({ success: true });
  }
});

// 6. POST /api/auth/logout-all - Logout All Devices
router.post("/logout-all", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendApiError(res, req, 401, ApiErrorCodes.UNAUTHORIZED, "Unauthorized");
    }
    await revokeAllUserSessions(userId);
    res.clearCookie("trackpay_refresh_token", { path: "/" });
    res.json({ success: true, message: "Logged out from all devices" });
  } catch (err: any) {
    sendApiError(res, req, 500, ApiErrorCodes.INTERNAL_ERROR, err.message);
  }
});

// 7. GET /api/auth/me - Current User Profile
router.get("/me", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendApiError(res, req, 401, ApiErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      return sendApiError(res, req, 401, ApiErrorCodes.UNAUTHORIZED, "User not found");
    }

    res.json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.picture || dbUser.avatar || "",
        googleId: dbUser.googleId,
        provider: dbUser.provider,
        avatar: dbUser.avatar,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      },
    });
  } catch (err: any) {
    sendApiError(res, req, 500, ApiErrorCodes.INTERNAL_ERROR, err.message);
  }
});

// 8. GET /api/auth/sessions - Active User Sessions
router.get("/sessions", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendApiError(res, req, 401, ApiErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    const sessions = await getUserActiveSessions(userId);
    res.json({ sessions });
  } catch (err: any) {
    sendApiError(res, req, 500, ApiErrorCodes.INTERNAL_ERROR, err.message);
  }
});

// 9. DELETE /api/auth/sessions/:sessionId - Revoke Specific Session
router.delete("/sessions/:sessionId", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendApiError(res, req, 401, ApiErrorCodes.UNAUTHORIZED, "Unauthorized");
    }

    await revokeSessionById(req.params.sessionId, userId);
    res.json({ success: true, message: "Session revoked" });
  } catch (err: any) {
    sendApiError(res, req, 500, ApiErrorCodes.INTERNAL_ERROR, err.message);
  }
});

export default router;
