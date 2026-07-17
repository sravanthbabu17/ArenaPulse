interface CacheEntry<T> {
  value: T;
  expiry: number;
}

/**
 * Standard in-memory cache featuring TTL-based value expiration.
 */
export class TtlCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * @param {number} defaultTtlMs - Default expiry age in milliseconds (defaults to 5 minutes).
   */
  constructor(private defaultTtlMs: number = 300000) {}

  /**
   * Caches a value with a specific key.
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Fetches a cached key, discarding it automatically if expired.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  /**
   * Purges all cache entries.
   */
  clear(): void {
    this.cache.clear();
  }
}

export const queryCache = new TtlCache();
