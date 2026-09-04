import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

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

export const onAuthStateChange = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

/* ---------------- Google Sign In ---------------- */

export const signInWithGoogle = async (
  onStepProgress?: (step: number) => void
): Promise<SignInResult | null> => {
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

    const credential =
      GoogleAuthProvider.credentialFromResult(result);

    const googleCredential = credential?.idToken || credential?.accessToken;

    if (!googleCredential) {
      throw new Error("Failed to obtain Google credential from sign-in.");
    }

    onStepProgress?.(1);

    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken: googleCredential,
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
  } catch (err) {
    clearAuthSession();
    console.error(err);
    throw err;
  }
};

/* ---------------- Sign Out ---------------- */

export const signOutApp = async () => {
  await signOut(auth);
  clearAuthSession();
};