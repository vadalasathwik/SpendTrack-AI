import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY || "").trim();
const authDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim();
const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim();
const appId = (import.meta.env.VITE_FIREBASE_APP_ID || "").trim();
const storageBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim();
const messagingSenderId = (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim();

export const isFirebaseConfigured: boolean = Boolean(
  apiKey && authDomain && projectId && appId
);

console.log({
  firebaseConfigured: Boolean(apiKey && authDomain && projectId && appId),
  projectId,
  hasApiKey: Boolean(apiKey),
  hasAuthDomain: Boolean(authDomain),
  hasAppId: Boolean(appId),
});

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