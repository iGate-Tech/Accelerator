import { logger } from '@lib/core';

// Consent management for GDPR compliance
class ConsentManager {
  constructor() {
    this.consents = null;
  }

  // Get stored consents
  async getConsents() {
    if (this.consents) return this.consents;

    try {
      const stored = localStorage.getItem('user-consents');
      if (stored) {
        this.consents = JSON.parse(stored);
        return this.consents;
      }
    } catch (error) {
      logger.error('Failed to load consents:', error);
    }

    return this.getDefaultConsents();
  }

  getDefaultConsents() {
    return {
      necessary: true, // Always true, cannot be disabled
      analytics: false,
      marketing: false,
      preferences: false,
      version: '1.0',
      givenAt: null,
      updatedAt: new Date().toISOString(),
      gdprVersion: '1.0',
    };
  }

  // Update user consents
  async updateConsents(newConsents) {
    try {
      const current = await this.getConsents();
      const updated = {
        ...current,
        ...newConsents,
        updatedAt: new Date().toISOString(),
        givenAt: current.givenAt || new Date().toISOString(),
      };

      localStorage.setItem('user-consents', JSON.stringify(updated));
      this.consents = updated;

      // Log consent change for audit
      logger.info('User consent updated:', updated);

      return updated;
    } catch (error) {
      logger.error('Failed to update consents:', error);
      throw error;
    }
  }

  // Check if consent is given for a specific category
  async hasConsent(category) {
    const consents = await this.getConsents();
    return consents[category] === true;
  }

  // Check if user has given any consents (for banner display)
  async hasGivenConsents() {
    const consents = await this.getConsents();
    return consents.givenAt !== null;
  }

  // Withdraw all consents (except necessary)
  async withdrawConsents() {
    const withdrawn = {
      ...this.getDefaultConsents(),
      withdrawnAt: new Date().toISOString(),
      gdprArticle7: 'Right to Withdraw Consent',
    };

    await this.updateConsents(withdrawn);
    return withdrawn;
  }
}

export const consentManager = new ConsentManager();

// Rate limiting for authentication attempts
class AuthRateLimiter {
  constructor() {
    this.attempts = new Map();
    this.maxAttempts = 5; // Max attempts per window
    this.windowMs = 15 * 60 * 1000; // 15 minutes
    this.blockMs = 30 * 60 * 1000; // 30 minutes block
  }

  isBlocked(identifier) {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    const now = Date.now();
    if (record.blockedUntil && now < record.blockedUntil) {
      return true; // Still blocked
    }

    // Clean up expired records
    if (now > record.windowEnd) {
      this.attempts.delete(identifier);
      return false;
    }

    return false;
  }

  recordAttempt(identifier, success = false) {
    const now = Date.now();
    let record = this.attempts.get(identifier);

    if (!record) {
      record = {
        attempts: [],
        windowEnd: now + this.windowMs,
        blockedUntil: null,
      };
      this.attempts.set(identifier, record);
    }

    // Clean old attempts
    record.attempts = record.attempts.filter(
      time => now - time < this.windowMs
    );

    if (!success) {
      record.attempts.push(now);

      // Check if exceeded max attempts
      if (record.attempts.length >= this.maxAttempts) {
        record.blockedUntil = now + this.blockMs;
        logger.warn(
          `Rate limit exceeded for ${identifier}, blocking until ${new Date(record.blockedUntil)}`
        );
      }
    } else {
      // Successful login, reset attempts
      this.attempts.delete(identifier);
    }
  }

  getRemainingTime(identifier) {
    const record = this.attempts.get(identifier);
    if (!record || !record.blockedUntil) return 0;

    const remaining = record.blockedUntil - Date.now();
    return Math.max(0, remaining);
  }
}

export const authRateLimiter = new AuthRateLimiter();

// Encryption utilities for sensitive data storage
class DataEncryption {
  constructor() {
    this.key = null;
    this.keyPromise = null;
  }

  // Generate or retrieve encryption key from IndexedDB
  async getEncryptionKey() {
    if (this.key) return this.key;
    if (this.keyPromise) return this.keyPromise;

    this.keyPromise = this._loadOrGenerateKey();
    this.key = await this.keyPromise;
    return this.key;
  }

  async _loadOrGenerateKey() {
    try {
      // Try to load existing key from IndexedDB
      const db = await this._openKeyDB();
      const transaction = db.transaction(['keys'], 'readonly');
      const store = transaction.objectStore('keys');
      const request = store.get('encryption-key');

      return new Promise((resolve, reject) => {
        request.onsuccess = async () => {
          if (request.result) {
            // Load existing key
            this.key = await crypto.subtle.importKey(
              'raw',
              request.result.keyData,
              'AES-GCM',
              true,
              ['encrypt', 'decrypt']
            );
            resolve(this.key);
          } else {
            // Generate new key
            const newKey = await crypto.subtle.generateKey(
              {
                name: 'AES-GCM',
                length: 256,
              },
              true,
              ['encrypt', 'decrypt']
            );

            // Store the key
            const exportedKey = await crypto.subtle.exportKey('raw', newKey);
            const keyTransaction = db.transaction(['keys'], 'readwrite');
            const keyStore = keyTransaction.objectStore('keys');
            keyStore.put({ id: 'encryption-key', keyData: exportedKey });

            this.key = newKey;
            resolve(newKey);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('Failed to get encryption key:', error);
      throw error;
    }
  }

  async _openKeyDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('accelerator-security', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'id' });
        }
      };
    });
  }

  // Encrypt data
  async encrypt(data) {
    try {
      const key = await this.getEncryptionKey();
      const iv = crypto.getRandomValues(new Uint8Array(12)); // GCM recommended IV length
      const encodedData = new TextEncoder().encode(JSON.stringify(data));

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 for storage
      let binary = '';
      for (let i = 0; i < combined.length; i++) {
        binary += String.fromCharCode(combined[i]);
      }
      return btoa(binary);
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw error;
    }
  }

  // Decrypt data
  async decrypt(encryptedData) {
    try {
      // Validate that the input is a string and looks like Base64
      if (typeof encryptedData !== 'string' || !this._isValidBase64(encryptedData)) {
        throw new Error('Invalid input: not a valid Base64 string');
      }

      const key = await this.getEncryptionKey();

      // Decode the Base64 string to bytes
      let binaryString;
      try {
        binaryString = atob(encryptedData);
      } catch (decodeError) {
        logger.error('Base64 decoding failed:', decodeError);
        throw new Error(`Invalid Base64 string: ${decodeError.message}`);
      }

      // Convert binary string to Uint8Array
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        combined[i] = binaryString.charCodeAt(i);
      }

      // Ensure we have enough data for the IV (12 bytes) + encrypted content
      if (combined.length < 12) {
        throw new Error('Encrypted data is too short to contain IV');
      }

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encrypted
      );

      const decoded = new TextDecoder().decode(decrypted);
      return JSON.parse(decoded);
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw error;
    }
  }

  // Helper function to validate Base64 string format
  _isValidBase64(str) {
    if (typeof str !== 'string') {
      return false;
    }

    // Check if string length is a multiple of 4
    if (str.length % 4 !== 0) {
      return false;
    }

    // Check if it contains only valid Base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) {
      return false;
    }

    // Try to decode and re-encode to verify integrity
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  }

  _isDataCorrupted(data) {
    return (
      data === 'undefined' ||
      data === 'null' ||
      data === 'NaN' ||
      data === '[object Object]' ||
      data === '{}' ||
      data === '[]' ||
      data.startsWith('undefined') ||
      data.startsWith('null') ||
      (data.includes('[object ') && data.includes(']')) ||
      (data.includes('{') && !data.includes(':') && !data.includes('}')) ||
      // Only flag as corrupted if it's clearly malformed JSON or corrupted
      (data.startsWith('{') && !data.endsWith('}') && !data.includes(':')) ||
      (data.startsWith('[') && !data.endsWith(']'))
    );
  }

  // Clean up all corrupted data in localStorage
  cleanupCorruptedData() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value && this._isDataCorrupted(value)) {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        logger.warn('Cleaning up corrupted data:', key);
        localStorage.removeItem(key);
      });

      if (keysToRemove.length > 0) {
        logger.info(
          'Cleaned up',
          keysToRemove.length,
          'corrupted localStorage entries'
        );
      }
    } catch (error) {
      logger.warn('Error during localStorage cleanup:', error.message);
    }
  }
}

// Singleton instance
export const dataEncryption = new DataEncryption();

// Encrypted localStorage wrapper
export const secureLocalStorage = {
  // Maximum size allowed for localStorage (browser typically has ~5MB limit)
  MAX_SIZE: 4 * 1024 * 1024, // 4MB to stay under browser limits

  async setItem(key, value) {
    try {
      let dataToStore;

      if (this._isSensitiveKey(key)) {
        // For sensitive data, encrypt it
        dataToStore = await dataEncryption.encrypt(value);
      } else {
        // For non-sensitive data, just stringify it
        dataToStore = JSON.stringify(value);
      }

      // Check if the data is too large before storing
      const dataSize = new Blob([dataToStore]).size;
      if (dataSize > this.MAX_SIZE) {
        logger.warn(`Data for key '${key}' is too large (${dataSize} bytes), attempting compression...`);

        // Try to compress the data if it's too large
        try {
          dataToStore = await this._compressData(dataToStore);
        } catch (compressionError) {
          logger.error('Compression failed, falling back to partial storage:', compressionError);
          // If compression fails, try to store a simplified version
          if (typeof value === 'object') {
            // For user data, store only essential fields
            if (key.includes('userData')) {
              const essentialData = this._getEssentialUserData(value);
              dataToStore = JSON.stringify(essentialData);
            }
          }
        }
      }

      // Check available space before storing
      const availableSpace = this._getAvailableSpace();
      if (dataSize > availableSpace) {
        logger.warn(`Insufficient space for key '${key}'. Attempting cleanup...`);
        this._cleanupOldEntries();
      }

      localStorage.setItem(key, dataToStore);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        logger.error('Storage quota exceeded for key:', key);

        // Try to free up space and retry
        this._cleanupOldEntries();

        try {
          // Retry with compressed/simplified data
          let retryData;
          if (typeof value === 'object' && key.includes('userData')) {
            const essentialData = this._getEssentialUserData(value);
            if (this._isSensitiveKey(key)) {
              retryData = await dataEncryption.encrypt(essentialData);
            } else {
              retryData = JSON.stringify(essentialData);
            }
          } else {
            retryData = JSON.stringify(value);
          }

          localStorage.setItem(key, retryData);
        } catch (retryError) {
          logger.error('Retry failed, storing in sessionStorage as fallback:', retryError);
          // As a last resort, try sessionStorage which typically has higher limits
          try {
            sessionStorage.setItem(key, JSON.stringify(value));
          } catch (sessionError) {
            logger.error('Even sessionStorage failed, data loss may occur:', sessionError);
            throw new Error(`Failed to store data after all fallbacks: ${sessionError.message}`);
          }
        }
      } else {
        logger.error('Failed to securely store item:', error);
        // Fallback to regular storage
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (fallbackError) {
          logger.error('Fallback storage also failed:', fallbackError);
          throw fallbackError;
        }
      }
    }
  },

  async getItem(key) {
    try {
      let stored = localStorage.getItem(key);

      // If not in localStorage, try sessionStorage as fallback
      if (stored === null) {
        stored = sessionStorage.getItem(key);
        if (stored !== null) {
          logger.debug(`Retrieved key '${key}' from sessionStorage fallback`);
        }
      }

      if (!stored) return null;

      // Clean up any corrupted data we might have missed
      if (stored && stored.length > 0 && this._isDataCorrupted(stored)) {
        logger.warn('Found corrupted data, clearing:', key);
        localStorage.removeItem(key);
        sessionStorage.removeItem(key); // Also check sessionStorage
        return null;
      }

      // For sensitive data that should be encrypted
      if (this._isSensitiveKey(key)) {
        try {
          // First, try to decompress if needed
          let decompressedStored = stored;
          try {
            decompressedStored = await this._decompressData(stored);
          } catch (decompError) {
            // If decompression fails, the data might not be compressed
            logger.debug('Data not compressed or decompression failed:', decompError.message);
          }

          return await dataEncryption.decrypt(decompressedStored);
        } catch (decryptError) {
          logger.error('Decryption failed for', key, decryptError.message);

          // For userData, try recovery as plain JSON
          if (key.includes('userData')) {
            try {
              let parsed = JSON.parse(stored);

              // If it's a stringified object, parse it
              if (typeof parsed === 'string') {
                try {
                  parsed = JSON.parse(parsed);
                } catch {
                  // If double parsing fails, return as is
                }
              }

              if (parsed && typeof parsed === 'object') {
                logger.warn('Recovered userData as plain JSON');
                return parsed;
              }
            } catch (jsonError) {
              logger.debug('JSON recovery failed:', jsonError.message);
            }
          }

          // Clear corrupted encrypted data from both storages
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
          return null;
        }
      } else {
        // For non-sensitive data, return as-is
        let parsedValue;
        try {
          // Try to decompress if needed
          let decompressedStored = stored;
          try {
            decompressedStored = await this._decompressData(stored);
          } catch (decompError) {
            // If decompression fails, the data might not be compressed
            logger.debug('Data not compressed or decompression failed:', decompError.message);
          }

          parsedValue = JSON.parse(decompressedStored);
        } catch (parseError) {
          logger.error('Failed to parse stored data for key:', key, parseError);
          // Clear corrupted data from both storages
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
          return null;
        }

        return parsedValue;
      }
    } catch (error) {
      logger.error('Failed to retrieve item:', key, error.message);
      // Clear corrupted data from both storages
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      return null;
    }
  },

  removeItem(key) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key); // Also remove from sessionStorage fallback
  },

  _isSensitiveKey(key) {
    const sensitiveKeys = ['userToken', 'userData', 'accelerator_backup_'];
    return sensitiveKeys.some(sensitive => key.includes(sensitive));
  },

  _isDataCorrupted(data) {
    return (
      data === 'undefined' ||
      data === 'null' ||
      data === 'NaN' ||
      data === '[object Object]' ||
      data === '{}' ||
      data === '[]' ||
      data.startsWith('undefined') ||
      data.startsWith('null') ||
      (data.includes('[object ') && data.includes(']')) ||
      (data.includes('{') && !data.includes(':') && !data.includes('}')) ||
      // Only flag as corrupted if it's clearly malformed JSON or corrupted
      (data.startsWith('{') && !data.endsWith('}') && !data.includes(':')) ||
      (data.startsWith('[') && !data.endsWith(']'))
    );
  },

  // Helper to estimate available space in localStorage
  _getAvailableSpace() {
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    return this.MAX_SIZE - used;
  },

  // Helper to clean up old entries to free space
  _cleanupOldEntries() {
    try {
      // Sort entries by modification time if available (using a custom tracking mechanism)
      // For now, just remove oldest entries based on key naming patterns
      const keys = Object.keys(localStorage);

      // Remove temporary or old cache entries first
      const tempKeys = keys.filter(key =>
        key.startsWith('temp_') ||
        key.startsWith('cache_') ||
        key.includes('_tmp') ||
        key.includes('backup')
      );

      for (const key of tempKeys) {
        localStorage.removeItem(key);
        logger.debug(`Removed temporary key: ${key}`);
      }

      // If still low on space, remove non-critical entries
      if (this._getAvailableSpace() < 100 * 1024) { // Less than 100KB available
        const removableKeys = keys.filter(key =>
          !this._isSensitiveKey(key) &&
          !key.includes('user') &&
          !key.includes('auth')
        );

        for (const key of removableKeys) {
          localStorage.removeItem(key);
          logger.debug(`Removed non-critical key: ${key}`);
        }
      }
    } catch (error) {
      logger.warn('Cleanup failed:', error.message);
    }
  },

  // Helper to extract essential user data for storage when space is limited
  _getEssentialUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      return userData;
    }

    // Return only essential fields to minimize storage size
    return {
      id: userData.id,
      email: userData.email,
      avatar: userData.avatar,
      profile: {
        name: userData.profile?.name,
        email: userData.profile?.email,
      },
      subscription: {
        plan: userData.subscription?.plan,
        status: userData.subscription?.status,
      },
      credits: {
        balance: userData.credits?.balance,
      },
      // Include only essential properties to keep the object small
    };
  },

  // Compression helper using a simple approach with LZ-string library
  // First, we'll implement a basic compression using a fallback approach
  async _compressData(data) {
    // Check if CompressionStream API is available (modern browsers)
    if ('CompressionStream' in window) {
      try {
        // Convert string to ArrayBuffer
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(data));
            controller.close();
          }
        });

        const compressedStream = stream.pipeThrough(
          new CompressionStream('gzip')
        );

        const reader = compressedStream.getReader();
        const chunks = [];
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            chunks.push(value);
          }
        }

        // Combine all chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let position = 0;
        for (const chunk of chunks) {
          combined.set(chunk, position);
          position += chunk.length;
        }

        // Convert to base64 for storage
        let binary = '';
        for (let i = 0; i < combined.length; i++) {
          binary += String.fromCharCode(combined[i]);
        }
        return '__COMPRESSED_GZIP__' + btoa(binary);
      } catch (compressionError) {
        logger.warn('Gzip compression failed, using fallback:', compressionError);
      }
    }

    // Fallback: Use a simple run-length encoding for repetitive data
    try {
      // For JSON data with repetitive structures, we can try a simple approach
      // by identifying and replacing repeated substrings
      const compressed = this._simpleCompress(data);
      if (compressed.length < data.length) {
        return '__COMPRESSED_SIMPLE__' + btoa(JSON.stringify({
          originalLength: data.length,
          compressed: compressed
        }));
      }
    } catch (simpleCompressionError) {
      logger.warn('Simple compression failed:', simpleCompressionError);
    }

    // If all compression methods fail, return original data
    return data;
  },

  // Decompression helper
  async _decompressData(data) {
    if (typeof data !== 'string') {
      return data;
    }

    // Check if data is gzip compressed
    if (data.startsWith('__COMPRESSED_GZIP__')) {
      const base64Data = data.substring('__COMPRESSED_GZIP__'.length);

      // Check if DecompressionStream API is available
      if ('DecompressionStream' in window) {
        try {
          const binaryData = atob(base64Data);
          const bytes = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
          }

          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(bytes);
              controller.close();
            }
          });

          const decompressedStream = stream.pipeThrough(
            new DecompressionStream('gzip')
          );

          const reader = decompressedStream.getReader();
          const chunks = [];
          let done = false;

          while (!done) {
            const { value, done: streamDone } = await reader.read();
            done = streamDone;
            if (value) {
              chunks.push(value);
            }
          }

          // Combine all chunks
          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const combined = new Uint8Array(totalLength);
          let position = 0;
          for (const chunk of chunks) {
            combined.set(chunk, position);
            position += chunk.length;
          }

          return new TextDecoder().decode(combined);
        } catch (decompressionError) {
          logger.warn('Gzip decompression failed:', decompressionError);
        }
      }
    }

    // Check if data is simply compressed
    if (data.startsWith('__COMPRESSED_SIMPLE__')) {
      try {
        const base64Data = data.substring('__COMPRESSED_SIMPLE__'.length);
        const compressedObj = JSON.parse(atob(base64Data));
        return this._simpleDecompress(compressedObj.compressed);
      } catch (simpleDecompressionError) {
        logger.warn('Simple decompression failed:', simpleDecompressionError);
      }
    }

    // If no compression markers, return original data
    return data;
  },

  // Simple compression algorithm for reducing repetitive data
  _simpleCompress(str) {
    // This is a basic implementation that identifies and abbreviates repeated patterns
    // For JSON objects with repeated property names, this can provide some compression

    // Find common substrings (property names, common values)
    const tokens = {};
    let tokenId = 0;
    let compressed = str;

    // Look for common JSON property patterns
    const propPattern = /"([^"]+)":/g;
    let match;
    const matches = [];

    while ((match = propPattern.exec(compressed)) !== null) {
      matches.push({ prop: match[1], index: match.index });
    }

    // Create a mapping of common properties to shorter tokens
    const propCounts = {};
    for (const m of matches) {
      propCounts[m.prop] = (propCounts[m.prop] || 0) + 1;
    }

    // Only compress properties that appear multiple times
    const toCompress = Object.entries(propCounts)
      .filter(([prop, count]) => count > 1 && prop.length > 3)
      .sort((a, b) => b[1] * b[0].length - a[1] * a[0].length); // Sort by frequency * length

    // Replace common properties with shorter tokens
    for (const [prop, count] of toCompress) {
      if (tokenId > 99) break; // Limit number of tokens to avoid overhead

      const token = `~${tokenId}~`;
      tokens[token] = prop;
      compressed = compressed.split(`"${prop}":`).join(`"${token}":`);
      tokenId++;
    }

    // Store the token mapping in the compressed string
    if (Object.keys(tokens).length > 0) {
      return JSON.stringify({
        tokens: tokens,
        data: compressed
      });
    }

    return compressed;
  },

  // Simple decompression algorithm
  _simpleDecompress(compressedStr) {
    try {
      // Check if it's a compressed object with tokens
      const parsed = JSON.parse(compressedStr);
      if (parsed.tokens && parsed.data) {
        let result = parsed.data;
        // Replace tokens with original values
        for (const [token, original] of Object.entries(parsed.tokens)) {
          result = result.split(`"${token}":`).join(`"${original}":`);
        }
        return result;
      }
      return compressedStr;
    } catch (e) {
      // If parsing fails, it wasn't compressed with our simple method
      return compressedStr;
    }
  }
};

// Comprehensive input sanitization utility
export const sanitizeInput = input => {
  logger.trace('sanitizeInput: Starting');
  if (typeof input !== 'string') return input;

  // Remove potentially dangerous HTML characters
  let sanitized = input.replace(/[<>'"&]/g, match => {
    switch (match) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#x27;';
      case '&':
        return '&amp;';
      default:
        return match;
    }
  });

  // Remove script tags and other dangerous patterns
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  return sanitized;
};

// Sanitize HTML content for safe rendering
export const sanitizeHtml = html => {
  logger.trace('sanitizeHtml: Starting');
  if (typeof html !== 'string') return html;

  // For HTML content that will be rendered, use more restrictive sanitization
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
};

// Validate email with international domain support
export const isValidEmail = email => {
  logger.trace('isValidEmail: Starting');
  if (!email || typeof email !== 'string') return false;

  // More comprehensive email regex that handles international domains
  // Prevents ReDoS by limiting quantifiers and avoiding nested quantifiers
  // Requires at least one dot in domain and proper TLD structure
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  // Additional length check to prevent extremely long emails
  if (email.length > 254) return false;

  return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = password => {
  logger.trace('isValidPassword: Starting');

  if (!password || password.length < 8) {
    // Note: We don't log individual validation failures for privacy
    return {
      valid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one number',
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-={}";\\|,.<>?/]/.test(password)) {
    return {
      valid: false,
      message: 'Password must contain at least one special character',
    };
  }

  return { valid: true, message: 'Password is strong' };
};

// Secure password hashing using PBKDF2
export const hashPassword = async password => {
  logger.trace('hashPassword: Starting');
  try {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const salt = crypto.getRandomValues(new Uint8Array(16)); // 16-byte salt

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // High iteration count for security
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const hashBuffer = await crypto.subtle.exportKey('raw', key);
    const hashArray = new Uint8Array(hashBuffer);

    // Combine salt and hash
    const combined = new Uint8Array(salt.length + hashArray.length);
    combined.set(salt);
    combined.set(hashArray, salt.length);

    // Convert to base64 for storage
    let hashBinary = '';
    for (let i = 0; i < combined.length; i++) {
      hashBinary += String.fromCharCode(combined[i]);
    }
    const hashString = btoa(hashBinary);

    logger.debug('Password hashed successfully');
    return hashString;
  } catch (error) {
    logger.error('Password hashing failed:', error);
    throw new Error('Failed to hash password');
  }
};

// Verify password against hash
export const verifyPassword = async (password, storedHash) => {
  logger.trace('verifyPassword: Starting');
  try {
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedHashBytes = combined.slice(16);

    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const hashBuffer = await crypto.subtle.exportKey('raw', key);
    const hashArray = new Uint8Array(hashBuffer);

    // Compare hashes in constant time to prevent timing attacks
    let match = true;
    for (let i = 0; i < hashArray.length; i++) {
      if (hashArray[i] !== storedHashBytes[i]) {
        match = false;
      }
    }

    logger.debug('Password verification completed');
    return match;
  } catch (error) {
    logger.error('Password verification failed:', error);
    return false;
  }
};

// Create cryptographically secure session token
export const createSecureToken = async (userId, rememberMe = false) => {
  logger.trace('createSecureToken: Starting');
  try {
    const payload = {
      userId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000, // 30 days or 1 day
      random: crypto.getRandomValues(new Uint8Array(16)), // 128-bit random
    };

    // Convert payload to string
    const payloadStr = JSON.stringify(payload);

    // Create HMAC signature
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode('accelerator-session-secret-key'), // In production, use environment variable
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      keyMaterial,
      encoder.encode(payloadStr)
    );
    const signatureArray = new Uint8Array(signature);

    // Combine payload and signature
    const combined = new Uint8Array(
      encoder.encode(payloadStr).length + signatureArray.length
    );
    combined.set(encoder.encode(payloadStr));
    combined.set(signatureArray, encoder.encode(payloadStr).length);

    // Base64 encode
    let tokenBinary = '';
    for (let i = 0; i < combined.length; i++) {
      tokenBinary += String.fromCharCode(combined[i]);
    }
    const token = btoa(tokenBinary);

    logger.debug('Secure token created');
    return token;
  } catch (error) {
    logger.error('Token creation failed:', error);
    throw new Error('Failed to create session token');
  }
};

// Verify secure session token
export const verifySecureToken = async token => {
  logger.trace('verifySecureToken: Starting');
  try {
    const combined = Uint8Array.from(atob(token), c => c.charCodeAt(0));
    const decoder = new TextDecoder();

    // Find the JSON payload (assume signature is 32 bytes for SHA-256)
    const signatureLength = 32;
    const payloadBytes = combined.slice(0, combined.length - signatureLength);
    const signatureBytes = combined.slice(combined.length - signatureLength);

    const payloadStr = decoder.decode(payloadBytes);
    const payload = JSON.parse(payloadStr);

    // Check expiry
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    // Verify signature
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode('accelerator-session-secret-key'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      keyMaterial,
      signatureBytes,
      encoder.encode(payloadStr)
    );

    if (!isValid) {
      return null;
    }

    logger.debug('Token verified successfully');
    return payload;
  } catch (error) {
    logger.error('Token verification failed:', error);
    return null;
  }
};

// Database input validation and sanitization
export const validateAndSanitizeDbInput = (input, fieldName = 'input') => {
  logger.trace('validateAndSanitizeDbInput: Starting for field:', fieldName);

  if (input === null || input === undefined) {
    return { valid: true, sanitized: input };
  }

  if (
    typeof input !== 'string' &&
    typeof input !== 'number' &&
    typeof input !== 'boolean'
  ) {
    return {
      valid: false,
      reason: `${fieldName} must be a string, number, or boolean`,
    };
  }

  // Convert to string for validation
  const stringInput = String(input);

  // Check length limits (reasonable limits for database fields)
  if (stringInput.length > 100000) {
    return {
      valid: false,
      reason: `${fieldName} too long (max 100000 characters)`,
    };
  }

  // For database inputs, use basic sanitization to prevent SQL injection patterns
  // Note: We rely on parameterized queries, but this provides additional defense
  const sanitized = stringInput.replace(/['";\\]/g, '').replace(/\0/g, '');

  return { valid: true, sanitized };
};

// Enhanced LLM prompt security validation
export const validateLLMPrompt = prompt => {
  logger.trace('validateLLMPrompt: Starting validation');

  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, reason: 'Prompt must be a non-empty string' };
  }

  // Check length limits
  if (prompt.length > 10000) {
    return { valid: false, reason: 'Prompt too long (max 10000 characters)' };
  }

  // Check for common jailbreak attempts
  const jailbreakPatterns = [
    /ignore.*previous.*instructions/i,
    /override.*safety/i,
    /bypass.*restrictions/i,
    /act as.*uncensored/i,
    /developer.*mode/i,
    /system.*prompt/i,
    /pretend.*to.*be/i,
    /role.*play.*as/i,
    /forget.*your.*training/i,
    /you.*are.*now.*in.*mode/i,
    /disregard.*rules/i,
    /break.*character/i,
  ];

  for (const pattern of jailbreakPatterns) {
    if (pattern.test(prompt)) {
      logger.warn('validateLLMPrompt: Potential jailbreak attempt detected');
      return {
        valid: false,
        reason: 'Prompt contains potentially unsafe content',
      };
    }
  }

  // Check for harmful content keywords
  const harmfulKeywords = [
    'bomb',
    'explosive',
    'weapon',
    'kill',
    'murder',
    'harm',
    'suicide',
    'hack',
    'exploit',
    'virus',
    'malware',
    'ransomware',
    'illegal',
    'drugs',
    'narcotics',
    'fraud',
    'scam',
    'terrorism',
    'extremism',
    'hate',
    'discrimination',
  ];

  const lowerPrompt = prompt.toLowerCase();
  for (const keyword of harmfulKeywords) {
    if (lowerPrompt.includes(keyword)) {
      logger.warn(
        'validateLLMPrompt: Harmful content keyword detected:',
        keyword
      );
      return {
        valid: false,
        reason: 'Prompt contains potentially harmful content',
      };
    }
  }

  // Check for injection patterns
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(prompt)) {
      logger.warn('validateLLMPrompt: Potential injection pattern detected');
      return {
        valid: false,
        reason: 'Prompt contains potentially dangerous patterns',
      };
    }
  }

  // Sanitize the prompt
  const sanitized = sanitizeInput(prompt);

  logger.trace('validateLLMPrompt: Prompt validated successfully');
  return { valid: true, sanitized };
};

// General input validation for forms
export const validateFormInput = (input, rules = {}) => {
  const {
    required = false,
    minLength = 0,
    maxLength = 1000,
    pattern,
    fieldName = 'field',
  } = rules;

  if (required && (!input || input.toString().trim() === '')) {
    return { valid: false, reason: `${fieldName} is required` };
  }

  if (input && input.toString().length < minLength) {
    return {
      valid: false,
      reason: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (input && input.toString().length > maxLength) {
    return {
      valid: false,
      reason: `${fieldName} must be no more than ${maxLength} characters`,
    };
  }

  if (pattern && input && !pattern.test(input.toString())) {
    return { valid: false, reason: `${fieldName} format is invalid` };
  }

  return { valid: true, sanitized: sanitizeInput(input) };
};
