/**
 * SpendTrack AI Offline Store (IndexedDB OS Database Engine)
 * Manages encrypted local cache for Expenses, Incomes, QR Vault, Notes, and Planner,
 * as well as the atomic write_queue for offline mutation tracking.
 */

import { encryptLocalData, decryptLocalData } from '../utils/localAesCrypto.js';

export interface OfflineMutation {
  id: string;
  entity: 'expenses' | 'incomes' | 'qr_vault' | 'notes' | 'planner';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  targetId: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed' | 'conflict';
  conflictData?: any;
  retryCount?: number;
}

const DB_NAME = 'SpendTrackOfflineOSDB';
const DB_VERSION = 1;

export const DOMAIN_STORES = ['expenses', 'incomes', 'qr_vault', 'notes', 'planner'] as const;
export const QUEUE_STORE = 'write_queue';

let dbInstance: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Domain stores: stores encrypted entity strings with key 'id'
      DOMAIN_STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });

      // Offline write queue store
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Store a domain item encrypted in IndexedDB
export async function saveCachedItem<T extends { id: string }>(
  entity: 'expenses' | 'incomes' | 'qr_vault' | 'notes' | 'planner',
  item: T
): Promise<void> {
  const db = await getDB();
  const encryptedPayload = await encryptLocalData(item);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([entity], 'readwrite');
    const store = transaction.objectStore(entity);
    const req = store.put({ id: item.id, cipherText: encryptedPayload, updatedAt: new Date().toISOString() });

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Bulk store cached items
export async function saveAllCachedItems<T extends { id: string }>(
  entity: 'expenses' | 'incomes' | 'qr_vault' | 'notes' | 'planner',
  items: T[]
): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([entity], 'readwrite');
  const store = transaction.objectStore(entity);

  // Clear existing before setting full collection
  store.clear();

  for (const item of items) {
    const encryptedPayload = await encryptLocalData(item);
    store.put({ id: item.id, cipherText: encryptedPayload, updatedAt: new Date().toISOString() });
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Get all cached items for an entity decrypted
export async function getCachedItems<T>(
  entity: 'expenses' | 'incomes' | 'qr_vault' | 'notes' | 'planner'
): Promise<T[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([entity], 'readonly');
    const store = transaction.objectStore(entity);
    const req = store.getAll();

    req.onsuccess = async () => {
      const records = req.result || [];
      try {
        const decryptedItems = await Promise.all(
          records.map((r: { id: string; cipherText: string }) => decryptLocalData<T>(r.cipherText))
        );
        resolve(decryptedItems);
      } catch (err) {
        console.error(`Failed to decrypt cached items for ${entity}:`, err);
        resolve([]);
      }
    };

    req.onerror = () => reject(req.error);
  });
}

// Remove an item from domain cache
export async function deleteCachedItem(
  entity: 'expenses' | 'incomes' | 'qr_vault' | 'notes' | 'planner',
  id: string
): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([entity], 'readwrite');
    const store = transaction.objectStore(entity);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* -------------------------------------------------------
   Offline Write Queue Operations
-------------------------------------------------------- */

export async function enqueueMutation(mutation: Omit<OfflineMutation, 'id' | 'timestamp' | 'status'>): Promise<OfflineMutation> {
  const db = await getDB();
  const fullMutation: OfflineMutation = {
    ...mutation,
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const req = store.put(fullMutation);

    req.onsuccess = () => resolve(fullMutation);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingMutations(): Promise<OfflineMutation[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      const all: OfflineMutation[] = req.result || [];
      // Sort chronologically by timestamp
      all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      resolve(all);
    };

    req.onerror = () => reject(req.error);
  });
}

export async function removeMutation(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updateMutationStatus(
  id: string,
  status: 'pending' | 'syncing' | 'failed' | 'conflict',
  conflictData?: any
): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item: OfflineMutation | undefined = getReq.result;
      if (!item) return resolve();

      item.status = status;
      if (conflictData) item.conflictData = conflictData;
      if (status === 'failed') item.retryCount = (item.retryCount || 0) + 1;

      const putReq = store.put(item);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function clearAllQueues(): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
