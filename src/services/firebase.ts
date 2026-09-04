import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required Firebase values
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.appId
) {
  throw new Error("Firebase configuration is incomplete. Check .env.local");
}

// Create only one Firebase app
export const app =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Auth
export const auth = getAuth(app);

// Use browser language for Google sign-in
auth.useDeviceLanguage();

// Safe debug (no API key exposed)
console.table({
  origin: window.location.origin,
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  senderId: firebaseConfig.messagingSenderId,
  appIdLoaded: !!firebaseConfig.appId,
});