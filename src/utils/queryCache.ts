const queryStore = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_STALE_TIME = 60 * 1000; // 1 minute

export const queryCache = {
  get<T = any>(key: string, staleTimeMs: number = DEFAULT_STALE_TIME): T | null {
    const entry = queryStore.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > staleTimeMs) {
      return null; // Stale
    }
    return entry.data as T;
  },

  set(key: string, data: any): void {
    queryStore.set(key, { data, timestamp: Date.now() });
  },

  invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      queryStore.clear();
      return;
    }
    for (const k of queryStore.keys()) {
      if (k.startsWith(keyPrefix)) {
        queryStore.delete(k);
      }
    }
  },
};
