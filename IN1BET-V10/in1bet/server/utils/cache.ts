interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt < now) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
}

export const cache = new MemoryCache();

export const CACHE_KEYS = {
  JACKPOT_INFO: "jackpot:info",
  JACKPOT_WINNERS: "jackpot:winners",
  PLATFORM_SETTINGS: "settings:platform",
  USER_WALLET: (userId: string) => `wallet:${userId}`,
  USER_LEVEL: (userId: string) => `level:${userId}`,
  GAMES_LIST: "games:list",
  PROVIDERS_LIST: "providers:list",
  SPORTS_EVENTS: "sports:events",
  LIVE_BETS: "bets:live",
} as const;

export const CACHE_TTL = {
  SHORT: 10 * 1000,
  MEDIUM: 60 * 1000,
  LONG: 5 * 60 * 1000,
  VERY_LONG: 30 * 60 * 1000,
} as const;
