import { encryptQRPayload, decryptQRPayload } from '../utils/qrCrypto.js';

export type QRCategory = 'Personal' | 'Business' | 'Family' | 'Merchant';

export interface QRVaultItem {
  id: string;
  name: string;
  category: QRCategory;
  upiId?: string;
  qrDataUrl: string; // Encrypted in DB, decrypted in memory
  isFavorite: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EncryptedDBItem {
  id: string;
  name: string;
  category: QRCategory;
  upiId?: string;
  encryptedQrDataUrl: string;
  isFavorite: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const DB_NAME = 'SpendTrackQRVault';
const DB_VERSION = 1;
const STORE_NAME = 'qr_items';

let dbInstance: IDBDatabase | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export const QRVaultStore = {
  /**
   * Fetch all QR items, decrypting payloads on-the-fly
   */
  async getAllQRCodes(): Promise<QRVaultItem[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = async () => {
        const encryptedList: EncryptedDBItem[] = request.result || [];
        try {
          const decryptedList: QRVaultItem[] = await Promise.all(
            encryptedList.map(async (item) => ({
              id: item.id,
              name: item.name,
              category: item.category,
              upiId: item.upiId,
              qrDataUrl: await decryptQRPayload(item.encryptedQrDataUrl),
              isFavorite: Boolean(item.isFavorite),
              notes: item.notes,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            }))
          );
          // Sort favorites first, then newest
          decryptedList.sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          resolve(decryptedList);
        } catch (err) {
          reject(err);
        }
      };

      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Save new QR item with AES-GCM local encryption
   */
  async saveQRCode(item: Omit<QRVaultItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<QRVaultItem> {
    const db = await openDatabase();
    const id = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const encryptedDataUrl = await encryptQRPayload(item.qrDataUrl);

    const dbRecord: EncryptedDBItem = {
      id,
      name: item.name.trim(),
      category: item.category,
      upiId: item.upiId?.trim() || undefined,
      encryptedQrDataUrl: encryptedDataUrl,
      isFavorite: Boolean(item.isFavorite),
      notes: item.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(dbRecord);

      request.onsuccess = () => {
        resolve({
          id,
          name: item.name.trim(),
          category: item.category,
          upiId: item.upiId?.trim(),
          qrDataUrl: item.qrDataUrl,
          isFavorite: Boolean(item.isFavorite),
          notes: item.notes?.trim(),
          createdAt: now,
          updatedAt: now,
        });
      };

      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<boolean> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing: EncryptedDBItem = getReq.result;
        if (!existing) {
          reject(new Error('QR Item not found'));
          return;
        }

        existing.isFavorite = !existing.isFavorite;
        existing.updatedAt = new Date().toISOString();

        const putReq = store.put(existing);
        putReq.onsuccess = () => resolve(existing.isFavorite);
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  },

  /**
   * Delete QR Item
   */
  async deleteQRCode(id: string): Promise<boolean> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Export encrypted Vault payload as JSON string
   */
  async exportVaultData(): Promise<string> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const exportObj = {
          version: 'SPENDTRACK_QR_VAULT_V1',
          exportedAt: new Date().toISOString(),
          items: request.result || [],
        };
        resolve(JSON.stringify(exportObj, null, 2));
      };

      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Import Vault items from JSON backup string
   */
  async importVaultData(jsonStr: string): Promise<number> {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.items)) {
      throw new Error('Invalid QR Vault backup file format.');
    }

    const db = await openDatabase();
    let importedCount = 0;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      tx.oncomplete = () => resolve(importedCount);
      tx.onerror = () => reject(tx.error);

      for (const item of parsed.items) {
        if (item.id && item.name && item.encryptedQrDataUrl) {
          store.put(item);
          importedCount++;
        }
      }
    });
  },
};
