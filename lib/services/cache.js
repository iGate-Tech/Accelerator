import { createClient } from "redis";
import config from "../config.js";

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.client && this.isConnected) return;

    try {
      this.client = createClient({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
      });

      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Connected to Redis");
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) await this.connect();
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    // 5 minutes default
    if (!this.isConnected) await this.connect();
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) await this.connect();
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error("Cache del error:", error);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    if (!this.isConnected) await this.connect();
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return keys.length;
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
