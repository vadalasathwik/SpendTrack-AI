import dotenv from "dotenv";
import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

dotenv.config();
dotenv.config({ path: ".env.local" });

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

let app: App;

if (getApps().length > 0) {
  app = getApps()[0];
} else if (projectId && clientEmail && privateKey) {
  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
} else {
  console.warn("⚠️ Firebase Admin SDK initialized without complete service account credentials.");
  app = initializeApp({
    projectId: projectId || "spendtrack-8d52c",
  });
}

export const adminAuth: Auth = getAuth(app);

export async function verifyFirebaseIdToken(token: string) {
  return await adminAuth.verifyIdToken(token);
}