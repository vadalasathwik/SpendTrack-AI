import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";

const JWT_STORAGE_KEY = "spendtrack_jwt";
const USER_PROFILE_KEY = "spendtrack_user_profile";
const WORKSPACE_METADATA_KEY = "spendtrack_workspace_metadata";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
}

export interface WorkspaceMetadata {
  spreadsheetId: string;
  driveFolderId: string;
  calendarId: string;
}

export interface SignInResult {
  token: string;
  user: UserProfile;
  workspace: WorkspaceMetadata;
  isNewUser: boolean;
}

/* ---------------- Storage ---------------- */

export const getStoredJWT = () =>
  localStorage.getItem(JWT_STORAGE_KEY);

export const setStoredJWT = (token: string | null) => {
  if (token) localStorage.setItem(JWT_STORAGE_KEY, token);
  else localStorage.removeItem(JWT_STORAGE_KEY);
};

export const getStoredUserProfile = (): UserProfile | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setStoredUserProfile = (user: UserProfile | null) => {
  if (user)
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_PROFILE_KEY);
};

export const getStoredWorkspace = (): WorkspaceMetadata | null => {
  const raw = localStorage.getItem(WORKSPACE_METADATA_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setStoredWorkspace = (
  ws: WorkspaceMetadata | null
) => {
  if (ws)
    localStorage.setItem(
      WORKSPACE_METADATA_KEY,
      JSON.stringify(ws)
    );
  else localStorage.removeItem(WORKSPACE_METADATA_KEY);
};

export const clearAuthSession = () => {
  localStorage.removeItem(JWT_STORAGE_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
  localStorage.removeItem(WORKSPACE_METADATA_KEY);
};

/* ---------------- Auth Listener ---------------- */

const authListeners = new Set<(user: User | null) => void>();

export const notifyAuthListeners = (user: User | null) => {
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (err) {
      console.warn("Auth listener notification error:", err);
    }
  });
};

export const onAuthStateChange = (
  callback: (user: User | null) => void
) => {
  authListeners.add(callback);

  // If Firebase is NOT configured or auth instance is null, check stored session
  if (!isFirebaseConfigured || !auth) {
    const user = getStoredUserProfile();
    const storedJWT = getStoredJWT();
    if (user && storedJWT) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.name,
        photoURL: user.photoURL,
      } as any);
    } else {
      callback(null);
    }
    return () => {
      authListeners.delete(callback);
    };
  }

  let firebaseUnsubscribe = () => {};

  try {
    firebaseUnsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        const storedJWT = getStoredJWT();
        if (firebaseUser && storedJWT) {
          callback(firebaseUser);
        } else {
          const user = getStoredUserProfile();
          if (user && storedJWT) {
            callback({
              uid: user.uid,
              email: user.email,
              displayName: user.name,
              photoURL: user.photoURL,
            } as any);
          } else {
            callback(null);
          }
        }
      },
      (err) => {
        console.warn("Firebase Auth listener notice:", err);
        const user = getStoredUserProfile();
        const storedJWT = getStoredJWT();
        if (user && storedJWT) {
          callback({
            uid: user.uid,
            email: user.email,
            displayName: user.name,
            photoURL: user.photoURL,
          } as any);
        } else {
          callback(null);
        }
      }
    );
  } catch (err) {
    console.warn("Firebase Auth listener notice:", err);
    callback(null);
  }

  return () => {
    authListeners.delete(callback);
    firebaseUnsubscribe();
  };
};

/* ---------------- Google Sign In ---------------- */

export const signInWithGoogle = async (
  onStepProgress?: (step: number) => void
): Promise<SignInResult | null> => {
  // If Firebase is NOT configured or auth is null, do NOT call Firebase methods.
  if (!isFirebaseConfigured || !auth) {
    return null;
  }

  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  provider.addScope("https://www.googleapis.com/auth/drive.file");
  provider.addScope("https://www.googleapis.com/auth/spreadsheets");
  provider.addScope("https://www.googleapis.com/auth/calendar.events");

  try {
    onStepProgress?.(0);

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const idToken = credential?.idToken;

    if (!idToken) {
      throw new Error("Failed to obtain Google ID token from sign-in.");
    }

    onStepProgress?.(1);

    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Authentication failed");
    }

    const data: SignInResult = await response.json();

    setStoredJWT(data.token);
    setStoredUserProfile(data.user);
    setStoredWorkspace(data.workspace);

    onStepProgress?.(5);

    return data;
  } catch (err: any) {
    clearAuthSession();
    console.error("Google Sign-In error:", err);
    throw err;
  }
};

/* ---------------- Sign Out ---------------- */

export const signOutApp = async () => {
  // 1. Remove stored JWT, user profile, and cached workspace state
  clearAuthSession();

  // 2. Perform Firebase signOut if configured
  if (isFirebaseConfigured && auth) {
    await signOut(auth).catch(() => {});
  }

  // 3. Emit auth change immediately
  notifyAuthListeners(null);
};