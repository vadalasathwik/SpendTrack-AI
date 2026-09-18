const DB_NAME = 'TrackPayOfflineDB';
const DB_VERSION = 1;
const STORE_CACHE = 'cache_store';
const STORE_QUEUE = 'mutation_queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineStorage = {
  async setCache(key: string, data: any): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_CACHE, 'readwrite');
      tx.objectStore(STORE_CACHE).put({ key, data, updatedAt: Date.now() });
    } catch (e) {
      console.warn('IndexedDB setCache fallback:', e);
      try {
        localStorage.setItem(`trackpay_cache_${key}`, JSON.stringify(data));
      } catch (err) {}
    }
  },

  async getCache<T = any>(key: string): Promise<T | null> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_CACHE, 'readonly');
        const req = tx.objectStore(STORE_CACHE).get(key);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      try {
        const item = localStorage.getItem(`trackpay_cache_${key}`);
        return item ? JSON.parse(item) : null;
      } catch (err) {
        return null;
      }
    }
  },

  async queueMutation(mutation: { endpoint: string; method: string; body: any }): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      tx.objectStore(STORE_QUEUE).add({ ...mutation, timestamp: Date.now() });
    } catch (e) {
      console.warn('Failed to queue mutation:', e);
    }
  },

  async getQueuedMutations(): Promise<any[]> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_QUEUE, 'readonly');
        const req = tx.objectStore(STORE_QUEUE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  },

  async clearQueue(): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      tx.objectStore(STORE_QUEUE).clear();
    } catch (e) {}
  },
};
