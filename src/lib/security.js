import logger from './logger.js';

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
      gdprVersion: '1.0'
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
        givenAt: current.givenAt || new Date().toISOString()
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
      gdprArticle7: 'Right to Withdraw Consent'
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
        blockedUntil: null
      };
      this.attempts.set(identifier, record);
    }

    // Clean old attempts
    record.attempts = record.attempts.filter(time => now - time < this.windowMs);

    if (!success) {
      record.attempts.push(now);

      // Check if exceeded max attempts
      if (record.attempts.length >= this.maxAttempts) {
        record.blockedUntil = now + this.blockMs;
        logger.warn(`Rate limit exceeded for ${identifier}, blocking until ${new Date(record.blockedUntil)}`);
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
                length: 256
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

      request.onupgradeneeded = (event) => {
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
          iv: iv
        },
        key,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw error;
    }
  }

  // Decrypt data
  async decrypt(encryptedData) {
    try {
      const key = await this.getEncryptionKey();
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
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
}

// Singleton instance
const dataEncryption = new DataEncryption();

// Encrypted localStorage wrapper
export const secureLocalStorage = {
  async setItem(key, value) {
    try {
      if (this._isSensitiveKey(key)) {
        const encrypted = await dataEncryption.encrypt(value);
        localStorage.setItem(key, encrypted);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      logger.error('Failed to securely store item:', error);
      // Fallback to regular storage
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  async getItem(key) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      if (this._isSensitiveKey(key)) {
        // Check for common corruption patterns
        if (stored === '[object Object]' ||
            stored === 'undefined' ||
            stored === 'null' ||
            (!stored.startsWith('') && (stored.includes('{') || stored.includes('}')))) {
          logger.warn('Detected corrupted data pattern, clearing:', key, stored.substring(0, 50));
          // For user data, don't immediately clear - try to recover
          if (key.includes('userData')) {
            logger.warn('User data corrupted, attempting recovery...');
            // Try to parse as regular JSON as fallback
            try {
              return JSON.parse(stored);
            } catch (e) {
              logger.warn('User data recovery failed, clearing...');
              localStorage.removeItem(key);
              return null;
            }
          } else {
            localStorage.removeItem(key);
            return null;
          }
        }

        // Check if it's valid base64 before attempting decryption
        let base64Valid = false;
        let decodedData = null;
        
        try {
          // Quick base64 validation
          if (stored.length % 4 !== 0 && !stored.endsWith('=')) {
            throw new Error('Invalid base64 length');
          }
          const testDecode = atob(stored);
          // Additional validation: check if decoded string is valid UTF-8 and parseable
          if (testDecode && testDecode.length > 0) {
            base64Valid = true;
          }
        } catch (e) {
          logger.warn('Data is not valid base64, attempting recovery:', key, e.message);
        }

        if (base64Valid) {
          try {
            decodedData = atob(stored);
          } catch (decodeError) {
            logger.warn('Base64 decode failed, attempting recovery:', key, decodeError.message);
          }
        }

        // If initial validation failed or decode failed, try recovery strategies
        if (!base64Valid || !decodedData) {
          if (key.includes('userData')) {
            logger.warn('User base64 data corrupted, attempting comprehensive recovery...');
            
            // Strategy 1: Try to fix padding issues
            try {
              let fixedData = stored;
              while (fixedData.length % 4 !== 0) {
                fixedData += '=';
              }
              const decoded = atob(fixedData);
              if (decoded && decoded.length > 0) {
                decodedData = decoded;
                logger.info('User data recovered with padding fix');
              }
            } catch (paddingError) {
              logger.debug('Padding fix failed:', paddingError.message);
            }

            // Strategy 2: Try URL-safe base64 decoding
            if (!decodedData) {
              try {
                const urlSafeData = stored.replace(/-/g, '+').replace(/_/g, '/');
                let fixedData = urlSafeData;
                while (fixedData.length % 4 !== 0) {
                  fixedData += '=';
                }
                const decoded = atob(fixedData);
                if (decoded && decoded.length > 0) {
                  decodedData = decoded;
                  logger.info('User data recovered with URL-safe base64');
                }
              } catch (urlSafeError) {
                logger.debug('URL-safe decode failed:', urlSafeError.message);
              }
            }

            // Strategy 3: Try raw JSON parse (data might not be base64 encoded)
            if (!decodedData) {
              try {
                // Check if it's already valid JSON
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') {
                  // Create a minimal user object to prevent complete logout
                  const minimalUser = {
                    id: parsed.id || parsed.userId,
                    email: parsed.email,
                    name: parsed.name,
                    _recovered: true,
                    _recoveryTimestamp: Date.now()
                  };
                  logger.warn('User data was not base64 encoded, using partial recovery');
                  return minimalUser;
                }
              } catch (jsonError) {
                logger.debug('JSON parse as-is failed:', jsonError.message);
              }
            }

            // Strategy 4: Try to extract user info from partial base64
            if (!decodedData) {
              try {
                // Try decoding with error suppression
                const safeAtob = (str) => {
                  try {
                    return atob(str);
                  } catch (e) {
                    return null;
                  }
                };
                const decoded = safeAtob(stored);
                if (decoded) {
                  // Try to find user data in the decoded string
                  const userIdMatch = decoded.match(/"userId"\s*:\s*"?(\d+)"?/);
                  const emailMatch = decoded.match(/"email"\s*:\s*"([^"]+)"/);
                  const nameMatch = decoded.match(/"name"\s*:\s*"([^"]+)"/);
                  
                  if (userIdMatch || emailMatch || nameMatch) {
                    const minimalUser = {
                      id: userIdMatch ? userIdMatch[1] : null,
                      email: emailMatch ? emailMatch[1] : null,
                      name: nameMatch ? nameMatch[1] : null,
                      _partialRecovery: true,
                      _recoveryTimestamp: Date.now()
                    };
                    logger.warn('User data partially recovered from base64');
                    return minimalUser;
                  }
                }
              } catch (partialError) {
                logger.debug('Partial recovery failed:', partialError.message);
              }
            }

            // If all recovery strategies failed, check for sessionStorage backup
            if (!decodedData) {
              try {
                const backup = sessionStorage.getItem(`${key}_backup`);
                if (backup) {
                  const backupData = JSON.parse(backup);
                  if (backupData && backupData.data && Date.now() - backupData.timestamp < 86400000) {
                    logger.info('Recovered user data from sessionStorage backup');
                    return backupData.data;
                  }
                }
              } catch (backupError) {
                logger.debug('Backup recovery failed:', backupError.message);
              }
            }

            // Final fallback: create minimal guest user to prevent app crash
            if (!decodedData) {
              logger.warn('All recovery strategies failed, creating fallback user');
              return {
                id: 'fallback_' + Date.now(),
                email: 'fallback@example.com',
                name: 'Fallback User',
                _isFallback: true,
                _fallbackReason: 'data_corruption',
                _recoveryTimestamp: Date.now()
              };
            }
          } else {
            localStorage.removeItem(key);
            return null;
          }
        }

        try {
          return await dataEncryption.decrypt(decodedData || stored);
        } catch (decryptError) {
          logger.error('Decryption failed, attempting recovery:', key, decryptError.message);
          // For user data, don't immediately clear - try recovery
          if (key.includes('userData')) {
            logger.warn('User data decryption failed, attempting JSON fallback...');
            // Try to parse as regular JSON as fallback
            try {
              const parsed = JSON.parse(decodedData || stored);
              // Create backup in sessionStorage
              try {
                sessionStorage.setItem(`${key}_backup`, JSON.stringify({
                  data: parsed,
                  timestamp: Date.now()
                }));
              } catch (backupError) {
                logger.debug('Could not create backup:', backupError.message);
              }
              return parsed;
            } catch (e) {
              logger.warn('User data recovery failed, using fallback user');
              return {
                id: 'fallback_' + Date.now(),
                email: 'fallback@example.com',
                name: 'Fallback User',
                _isFallback: true,
                _fallbackReason: 'decryption_failure',
                _recoveryTimestamp: Date.now()
              };
            }
          } else {
            localStorage.removeItem(key);
            return null;
          }
        }
      } else {
        return JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to securely retrieve item:', error);
      // For user data, be more careful about clearing
      if (key.includes('userData')) {
        logger.warn('Error retrieving user data, attempting recovery...');
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            return JSON.parse(stored);
          }
        } catch (e) {
          logger.warn('User data recovery failed:', e.message);
        }
      }
      // Clear corrupted data
      localStorage.removeItem(key);
      return null;
    }
  },

  removeItem(key) {
    localStorage.removeItem(key);
  },

  _isSensitiveKey(key) {
    const sensitiveKeys = [
      'userToken',
      'userData',
      'accelerator_backup_'
    ];
    return sensitiveKeys.some(sensitive => key.includes(sensitive));
  }
};

// Comprehensive input sanitization utility
export const sanitizeInput = (input) => {
  logger.trace('sanitizeInput: Starting');
  if (typeof input !== 'string') return input;

  // Remove potentially dangerous HTML characters
  let sanitized = input.replace(/[<>'"&]/g, (match) => {
    switch (match) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#x27;';
      case '&': return '&amp;';
      default: return match;
    }
  });

  // Remove script tags and other dangerous patterns
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  return sanitized;
};

// Sanitize HTML content for safe rendering
export const sanitizeHtml = (html) => {
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
export const isValidEmail = (email) => {
  logger.trace('isValidEmail: Starting');
  if (!email || typeof email !== 'string') return false;

  // More comprehensive email regex that handles international domains
  // Prevents ReDoS by limiting quantifiers and avoiding nested quantifiers
  // Requires at least one dot in domain and proper TLD structure
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  // Additional length check to prevent extremely long emails
  if (email.length > 254) return false;

  return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password) => {
  logger.trace('isValidPassword: Starting');

  if (!password || password.length < 8) {
    // Note: We don't log individual validation failures for privacy
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  return { valid: true, message: 'Password is strong' };
};

// Secure password hashing using PBKDF2
export const hashPassword = async (password) => {
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
        hash: 'SHA-256'
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
    const hashString = btoa(String.fromCharCode(...combined));

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
        hash: 'SHA-256'
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
      random: crypto.getRandomValues(new Uint8Array(16)) // 128-bit random
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

    const signature = await crypto.subtle.sign('HMAC', keyMaterial, encoder.encode(payloadStr));
    const signatureArray = new Uint8Array(signature);

    // Combine payload and signature
    const combined = new Uint8Array(encoder.encode(payloadStr).length + signatureArray.length);
    combined.set(encoder.encode(payloadStr));
    combined.set(signatureArray, encoder.encode(payloadStr).length);

    // Base64 encode
    const token = btoa(String.fromCharCode(...combined));

    logger.debug('Secure token created');
    return token;
  } catch (error) {
    logger.error('Token creation failed:', error);
    throw new Error('Failed to create session token');
  }
};

// Verify secure session token
export const verifySecureToken = async (token) => {
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

  if (typeof input !== 'string' && typeof input !== 'number' && typeof input !== 'boolean') {
    return { valid: false, reason: `${fieldName} must be a string, number, or boolean` };
  }

  // Convert to string for validation
  const stringInput = String(input);

  // Check length limits (reasonable limits for database fields)
  if (stringInput.length > 100000) {
    return { valid: false, reason: `${fieldName} too long (max 100000 characters)` };
  }

  // For database inputs, use basic sanitization to prevent SQL injection patterns
  // Note: We rely on parameterized queries, but this provides additional defense
  const sanitized = stringInput.replace(/['";\\]/g, '');

  return { valid: true, sanitized };
};

// Enhanced LLM prompt security validation
export const validateLLMPrompt = (prompt) => {
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
    /break.*character/i
  ];

  for (const pattern of jailbreakPatterns) {
    if (pattern.test(prompt)) {
      logger.warn('validateLLMPrompt: Potential jailbreak attempt detected');
      return { valid: false, reason: 'Prompt contains potentially unsafe content' };
    }
  }

  // Check for harmful content keywords
  const harmfulKeywords = [
    'bomb', 'explosive', 'weapon', 'kill', 'murder', 'harm', 'suicide',
    'hack', 'exploit', 'virus', 'malware', 'ransomware',
    'illegal', 'drugs', 'narcotics', 'fraud', 'scam',
    'terrorism', 'extremism', 'hate', 'discrimination'
  ];

  const lowerPrompt = prompt.toLowerCase();
  for (const keyword of harmfulKeywords) {
    if (lowerPrompt.includes(keyword)) {
      logger.warn('validateLLMPrompt: Harmful content keyword detected:', keyword);
      return { valid: false, reason: 'Prompt contains potentially harmful content' };
    }
  }

  // Check for injection patterns
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(prompt)) {
      logger.warn('validateLLMPrompt: Potential injection pattern detected');
      return { valid: false, reason: 'Prompt contains potentially dangerous patterns' };
    }
  }

  // Sanitize the prompt
  const sanitized = sanitizeInput(prompt);

  logger.trace('validateLLMPrompt: Prompt validated successfully');
  return { valid: true, sanitized };
};

// General input validation for forms
export const validateFormInput = (input, rules = {}) => {
  const { required = false, minLength = 0, maxLength = 1000, pattern, fieldName = 'field' } = rules;

  if (required && (!input || input.toString().trim() === '')) {
    return { valid: false, reason: `${fieldName} is required` };
  }

  if (input && input.toString().length < minLength) {
    return { valid: false, reason: `${fieldName} must be at least ${minLength} characters` };
  }

  if (input && input.toString().length > maxLength) {
    return { valid: false, reason: `${fieldName} must be no more than ${maxLength} characters` };
  }

  if (pattern && input && !pattern.test(input.toString())) {
    return { valid: false, reason: `${fieldName} format is invalid` };
  }

  return { valid: true, sanitized: sanitizeInput(input) };
};