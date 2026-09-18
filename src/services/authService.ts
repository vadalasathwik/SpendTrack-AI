export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  provider?: string;
  createdAt?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  device: string;
  ipAddress: string;
  expiresAt: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface WorkspaceMetadata {
  spreadsheetId?: string;
  driveFolderId?: string;
  calendarId?: string;
}

export interface SignInResult {
  token: string;
  user: UserProfile;
  workspace?: WorkspaceMetadata;
}

const USER_PROFILE_KEY = "trackpay_user_profile";
const WORKSPACE_METADATA_KEY = "trackpay_workspace_metadata";

// In-memory access token storage (short-lived JWT)
let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const getStoredJWT = (): string | null => {
  return inMemoryAccessToken;
};

export const setStoredJWT = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getStoredUserProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUserProfile = (user: UserProfile | null) => {
  if (user) {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_PROFILE_KEY);
  }
};

export const getStoredWorkspace = (): WorkspaceMetadata | null => {
  try {
    const raw = localStorage.getItem(WORKSPACE_METADATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredWorkspace = (ws: WorkspaceMetadata | null) => {
  if (ws) {
    localStorage.setItem(WORKSPACE_METADATA_KEY, JSON.stringify(ws));
  } else {
    localStorage.removeItem(WORKSPACE_METADATA_KEY);
  }
};

export const clearAuthSession = () => {
  inMemoryAccessToken = null;
  localStorage.removeItem(USER_PROFILE_KEY);
  localStorage.removeItem(WORKSPACE_METADATA_KEY);
};

/* ---------------- Auth Listener Subscription ---------------- */

const authListeners = new Set<(user: UserProfile | null) => void>();

export const notifyAuthListeners = (user: UserProfile | null) => {
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (err) {
      console.warn("Auth listener notice:", err);
    }
  });
};

export const onAuthStateChange = (
  callback: (user: UserProfile | null) => void
) => {
  authListeners.add(callback);
  
  // Return cleanup
  return () => {
    authListeners.delete(callback);
  };
};

/* ---------------- Silent Token Refresh ---------------- */

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        clearAuthSession();
        notifyAuthListeners(null);
        return null;
      }

      const data = await res.json();
      if (data.accessToken && data.user) {
        setStoredJWT(data.accessToken);
        setStoredUserProfile(data.user);
        notifyAuthListeners(data.user);
        return data.accessToken;
      }

      clearAuthSession();
      notifyAuthListeners(null);
      return null;
    } catch (err) {
      console.warn("Silent refresh failed:", err);
      clearAuthSession();
      notifyAuthListeners(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/* ---------------- Google OAuth Sign-In Trigger ---------------- */

export const signInWithGoogle = async () => {
  // Redirect to Express Google OAuth Endpoint
  window.location.href = "/api/auth/google";
};

/* ---------------- Handle OAuth Callback Hash ---------------- */

export const handleOAuthHashCallback = async (): Promise<UserProfile | null> => {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const token = params.get("access_token");

  if (token) {
    setStoredJWT(token);
    // Remove hash from URL without reloading page
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    // Fetch user details
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setStoredUserProfile(data.user);
          notifyAuthListeners(data.user);
          return data.user;
        }
      }
    } catch (err) {
      console.error("Error fetching user profile after OAuth redirect:", err);
    }
  }

  return null;
};

/* ---------------- Sign Out (Single Device) ---------------- */

export const signOutApp = async () => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.warn("Sign out request error:", err);
  } finally {
    clearAuthSession();
    notifyAuthListeners(null);
  }
};

/* ---------------- Logout All Devices ---------------- */

export const logoutAllDevices = async () => {
  const token = getStoredJWT();
  try {
    await fetch("/api/auth/logout-all", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    console.warn("Logout all devices error:", err);
  } finally {
    clearAuthSession();
    notifyAuthListeners(null);
  }
};

/* ---------------- Active Sessions Management ---------------- */

export const getActiveSessions = async (): Promise<UserSession[]> => {
  const token = getStoredJWT();
  if (!token) return [];
  try {
    const res = await fetch("/api/auth/sessions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.sessions || [];
  } catch {
    return [];
  }
};

export const revokeSession = async (sessionId: string): Promise<boolean> => {
  const token = getStoredJWT();
  if (!token) return false;
  try {
    const res = await fetch(`/api/auth/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
};