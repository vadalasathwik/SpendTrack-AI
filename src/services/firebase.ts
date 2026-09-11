import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const env = (import.meta as any)?.env || {};

const apiKey = typeof env.VITE_FIREBASE_API_KEY === "string" ? env.VITE_FIREBASE_API_KEY.trim() : "";
const authDomain = typeof env.VITE_FIREBASE_AUTH_DOMAIN === "string" ? env.VITE_FIREBASE_AUTH_DOMAIN.trim() : "";
const projectId = typeof env.VITE_FIREBASE_PROJECT_ID === "string" ? env.VITE_FIREBASE_PROJECT_ID.trim() : "";
const appId = typeof env.VITE_FIREBASE_APP_ID === "string" ? env.VITE_FIREBASE_APP_ID.trim() : "";
const storageBucket = typeof env.VITE_FIREBASE_STORAGE_BUCKET === "string" ? env.VITE_FIREBASE_STORAGE_BUCKET.trim() : "";
const messagingSenderId = typeof env.VITE_FIREBASE_MESSAGING_SENDER_ID === "string" ? env.VITE_FIREBASE_MESSAGING_SENDER_ID.trim() : "";

const DUMMY_API_KEYS = [
  "demo-api-key",
  "AIzaSyDr17nY9DmohbDtB32KxXbieqmSRdAZPQQ",
];

const isValidApiKey = Boolean(
  apiKey &&
    !DUMMY_API_KEYS.includes(apiKey) &&
    !apiKey.toLowerCase().includes("demo") &&
    apiKey.length > 10
);

export const isFirebaseConfigured: boolean = Boolean(
  isValidApiKey &&
    authDomain &&
    projectId &&
    appId
);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    authInstance.useDeviceLanguage();
  } catch (err) {
    console.warn("Firebase initialization warning:", err);
    authInstance = null;
  }
}

export const app = appInstance;
export const auth = authInstance;