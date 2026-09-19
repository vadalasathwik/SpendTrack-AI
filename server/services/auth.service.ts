import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../db/prisma.js";

const getJwtSecret = () => {
  const secret = (process.env.JWT_SECRET || "").trim();
  return secret || "trackpay-default-jwt-secret-2026-production";
};

const getGoogleClientId = () => {
  return (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "").trim();
};

const getGoogleClientSecret = () => {
  return (process.env.GOOGLE_CLIENT_SECRET || "").trim();
};

const getAppUrl = () => {
  return (process.env.APP_URL || "http://localhost:5173").trim();
};

const getApiUrl = () => {
  return (process.env.API_URL || "http://localhost:3000").trim();
};

export const generateGoogleAuthUrl = () => {
  const clientId = getGoogleClientId();
  const redirectUri = `${getApiUrl()}/api/auth/google/callback`;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in environment variables");
  }

  const oauth2Client = new OAuth2Client(clientId, getGoogleClientSecret(), redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "select_account",
  });
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const handleGoogleCallback = async (code: string, reqInfo: { userAgent?: string; ip?: string }) => {
  const clientId = getGoogleClientId();
  const redirectUri = `${getApiUrl()}/api/auth/google/callback`;
  const oauth2Client = new OAuth2Client(clientId, getGoogleClientSecret(), redirectUri);

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const userinfoRes = await oauth2Client.request<any>({
    url: "https://www.googleapis.com/oauth2/v2/userinfo",
  });

  const { id: googleId, email, name, picture: pictureUrl } = userinfoRes.data;

  if (!email || !googleId) {
    throw new Error("Failed to retrieve profile from Google OAuth");
  }

  // Find or create User
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        googleId,
        email,
        name: name || email.split("@")[0],
        picture: pictureUrl || null,
        avatar: pictureUrl || null,
        provider: "google",
      },
    });

    // Initialize Default User Profile & Workspace Records
    await initializeNewUserWorkspace(user.id);
  } else {
    // Update profile info
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        picture: pictureUrl || user.picture,
        avatar: pictureUrl || user.avatar,
        googleId,
      },
    });
  }

  // Generate Access Token (15m) & Refresh Token (7d)
  const accessToken = jwt.sign(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture || user.avatar || "",
        googleId: user.googleId,
        provider: user.provider,
      },
    },
    getJwtSecret(),
    { expiresIn: "15m" }
  );

  const rawRefreshToken = crypto.randomBytes(40).toString("hex");
  const refreshTokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create Session in DB
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      device: reqInfo.userAgent || "Unknown Device",
      ipAddress: reqInfo.ip || "127.0.0.1",
      expiresAt,
    },
  });

  return {
    user,
    accessToken,
    refreshToken: rawRefreshToken,
    isNewUser,
  };
};

export const refreshSession = async (rawRefreshToken: string) => {
  if (!rawRefreshToken) {
    throw new Error("Missing refresh token");
  }

  const refreshTokenHash = hashToken(rawRefreshToken);

  const session = await prisma.session.findFirst({
    where: { refreshTokenHash },
    include: { user: true },
  });

  if (!session || !session.user || new Date() > session.expiresAt) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    throw new Error("Session expired or invalid. Please sign in again.");
  }

  // Issue fresh 15-minute access token
  const accessToken = jwt.sign(
    {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        picture: session.user.picture || session.user.avatar || "",
        googleId: session.user.googleId,
        provider: session.user.provider,
      },
    },
    getJwtSecret(),
    { expiresIn: "15m" }
  );

  return {
    accessToken,
    user: session.user,
  };
};

export const revokeSession = async (rawRefreshToken: string) => {
  if (!rawRefreshToken) return;
  const refreshTokenHash = hashToken(rawRefreshToken);
  await prisma.session.deleteMany({
    where: { refreshTokenHash },
  });
};

export const revokeAllUserSessions = async (userId: string) => {
  await prisma.session.deleteMany({
    where: { userId },
  });
};

export const revokeSessionById = async (sessionId: string, userId: string) => {
  await prisma.session.deleteMany({
    where: { id: sessionId, userId },
  });
};

export const getUserActiveSessions = async (userId: string) => {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
};

const initializeNewUserWorkspace = async (userId: string) => {
  try {
    // 1. Default Bank Accounts
    await prisma.bankAccount.createMany({
      data: [
        { userId, name: "HDFC Primary Salary", type: "SAVINGS", bankName: "HDFC Bank", currentBalance: 150000, availableBalance: 150000, isDefault: true, color: "#10B981" },
        { userId, name: "ICICI Emergency Fund", type: "SAVINGS", bankName: "ICICI Bank", currentBalance: 75000, availableBalance: 75000, isDefault: false, color: "#3B82F6" },
        { userId, name: "UPI Cash Wallet", type: "WALLET", bankName: "GPay Wallet", currentBalance: 5000, availableBalance: 5000, isDefault: false, color: "#8B5CF6" },
      ],
    });

    // 2. Default Categories
    await prisma.category.createMany({
      data: [
        { userId, name: "Food & Dining", color: "#10B981", icon: "Utensils" },
        { userId, name: "Shopping", color: "#EC4899", icon: "ShoppingBag" },
        { userId, name: "Bills & Utilities", color: "#F59E0B", icon: "Zap" },
        { userId, name: "Transportation", color: "#3B82F6", icon: "Car" },
        { userId, name: "Investments", color: "#8B5CF6", icon: "TrendingUp" },
      ],
    });

    // 3. Default Monthly Budget
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    await prisma.monthlyBudget.create({
      data: {
        userId,
        month: currentMonth,
        year: currentYear,
        budget: 120000,
      },
    });

    // 4. Welcome Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "UserWorkspace",
        newValue: "Initial TrackPay v5.2.1 AI Finance Workspace initialized via Google OAuth 2.0",
      },
    });
  } catch (err) {
    console.warn("Failed to initialize new user workspace:", err);
  }
};
