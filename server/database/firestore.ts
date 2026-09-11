import dotenv from 'dotenv';
import { workspaceStore } from '../services/workspaceStore.js';
dotenv.config();

export interface UserDocument {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;

  spreadsheetId: string;
  driveFolderId: string;
  calendarId: string;

  createdAt: string;
  lastLoginAt: string;

  onboardingCompleted: boolean;
  appVersion: string;
}

let firestoreInstance: any = null;

/**
 * Retrieves a user document from Firestore collection 'users' by uid.
 */
export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  if (!uid) return null;

  // 1. Try Firebase Admin Firestore instance if available
  if (firestoreInstance) {
    try {
      const doc = await firestoreInstance.collection('users').doc(uid).get();
      if (doc.exists) {
        return doc.data() as UserDocument;
      }
    } catch (err: any) {
      console.warn('Firestore Admin read notice:', err.message);
    }
  }

  // 2. Try Firestore REST API if project ID is available
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'spendtrack';
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    const res = await fetch(firestoreUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.fields) {
        return {
          uid: data.fields.uid?.stringValue || uid,
          email: data.fields.email?.stringValue || '',
          name: data.fields.name?.stringValue || '',
          photoURL: data.fields.photoURL?.stringValue || '',
          spreadsheetId: data.fields.spreadsheetId?.stringValue || '',
          driveFolderId: data.fields.driveFolderId?.stringValue || '',
          calendarId: data.fields.calendarId?.stringValue || 'primary',
          createdAt: data.fields.createdAt?.stringValue || new Date().toISOString(),
          lastLoginAt: data.fields.lastLoginAt?.stringValue || new Date().toISOString(),
          onboardingCompleted: data.fields.onboardingCompleted?.booleanValue ?? true,
          appVersion: data.fields.appVersion?.stringValue || '1.0.0',
        };
      }
    }
  } catch (err) {
    // REST API notice
  }

  // 3. Retrieve from workspace store
  const local = workspaceStore.getWorkspace(uid);
  if (local) {
    return {
      uid: local.uid,
      email: local.email,
      name: local.email.split('@')[0],
      photoURL: '',
      spreadsheetId: local.spreadsheetId,
      driveFolderId: local.driveFolderId,
      calendarId: local.calendarId || 'primary',
      createdAt: local.createdAt,
      lastLoginAt: local.updatedAt,
      onboardingCompleted: true,
      appVersion: '1.0.0',
    };
  }

  return null;
}

/**
 * Creates or updates a user document in Firestore collection 'users'.
 */
export async function saveUserDocument(userDoc: UserDocument): Promise<UserDocument> {
  const now = new Date().toISOString();
  const updatedDoc: UserDocument = {
    ...userDoc,
    lastLoginAt: now,
    onboardingCompleted: true,
    appVersion: userDoc.appVersion || '1.0.0',
  };

  // 1. Try Firebase Admin Firestore
  if (firestoreInstance) {
    try {
      await firestoreInstance.collection('users').doc(userDoc.uid).set(updatedDoc, { merge: true });
    } catch (err: any) {
      console.warn('Firestore Admin save error:', err.message);
    }
  }

  // 2. Save to workspaceStore backup
  workspaceStore.saveWorkspace({
    uid: updatedDoc.uid,
    email: updatedDoc.email,
    spreadsheetId: updatedDoc.spreadsheetId,
    driveFolderId: updatedDoc.driveFolderId,
    calendarId: updatedDoc.calendarId,
  });

  return updatedDoc;
}

/**
 * Updates the lastLoginAt timestamp for a user document.
 */
export async function updateLastLogin(uid: string): Promise<void> {
  const now = new Date().toISOString();
  if (firestoreInstance) {
    try {
      await firestoreInstance.collection('users').doc(uid).update({ lastLoginAt: now });
    } catch (err) {
      // Ignore if doc doesn't exist
    }
  }
}
