import NodeCache from "node-cache";

class CacheService {
  constructor() {
    // Use in-memory cache instead of Redis (5 minute std TTL, check every 60 seconds)
    this.client = new NodeCache({ stdTTL: 300, checkperiod: 60 });
    this.isConnected = true; // Always connected for in-memory cache
  }

  connect() {
    // No-op for in-memory cache - always connected
    return;
  }

  disconnect() {
    // No-op for in-memory cache - no persistent connection to close
    return;
  }

  get(key) {
    try {
      const value = this.client.get(key);
      return value || null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  set(key, value, ttl = 300) {
    // 5 minutes default
    try {
      this.client.set(key, value, ttl);
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  del(key) {
    try {
      return this.client.del(key) > 0;
    } catch (error) {
      console.error("Cache del error:", error);
      return false;
    }
  }

  invalidatePattern(pattern) {
    try {
      const keys = this.client.keys();
      const matchingKeys = keys.filter((key) => {
        // Simple pattern matching - convert Redis-style wildcards to regex
        const regexPattern = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");
        return new RegExp(regexPattern).test(key);
      });

      if (matchingKeys.length > 0) {
        this.client.del(matchingKeys);
      }
      return matchingKeys.length;
    } catch (error) {
      console.error("Cache invalidate pattern error:", error);
      return 0;
    }
  }

  // Cache wrapper for functions
  async cached(key, fn, ttl = 300) {
    let data = await this.get(key);
    if (data !== null) {
      return data;
    }

    data = await fn();
    if (data !== null && data !== undefined) {
      await this.set(key, data, ttl);
    }

    return data;
  }
}

const cacheService = new CacheService();

export default cacheService;
