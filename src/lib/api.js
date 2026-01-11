// API layer for backend operations
// Easily replaceable with Supabase or other backends

import { toastManager } from './feedback';
import { getCreditBalance, consumeCredits } from './db';
import { activityLogger } from './activity';

const API_BASE_URL = '';

export const apiClient = {
  // LLM API calls
  llm: {
    stream: async (prompt, options = {}) => {
      const { userId, creditsCost = 5, skipCreditCheck = false } = options;

      try {
        // Consume credits if userId provided and not skipping
        if (userId && !skipCreditCheck) {
          const balance = await getCreditBalance(userId);
          if (balance < creditsCost) {
            throw new Error('Insufficient credits. You need at least ' + creditsCost + ' credits to use AI features.');
          }
          await consumeCredits(userId, creditsCost, `AI Processing: ${prompt.substring(0, 50)}...`);

          // Log activity
          if (activityLogger.user) {
            activityLogger.logAI('used', null, 'LLM Stream', { creditsUsed: creditsCost, promptLength: prompt.length });
          }
        }

        const response = await fetch(`${API_BASE_URL}/api/llm/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
          throw new Error(`LLM API error: ${response.status}`);
        }

        return await response.text();
       } catch (error) {
         console.error('LLM API error:', error);
         toastManager.error(`Failed to get LLM response for prompt (${prompt.length} chars) from /api/llm/stream: ${error.message}`);
         throw error;
       }
    }
  },

  // Generic API call wrapper with error handling
  call: async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
     } catch (error) {
       console.error('API call error:', error);
       toastManager.error(`API call failed to ${options.method || 'GET'} ${endpoint}: ${error.message}`);
       throw error;
     }
  },

  // Check server connectivity
  checkConnectivity: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/llm/stream`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Retry utility for failed API calls
export const retryAPI = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// Cache utility for API responses
const apiCache = new Map();

export const cachedAPI = {
  get: (key) => apiCache.get(key),
  set: (key, value, ttl = 5 * 60 * 1000) => { // 5 minutes default TTL
    apiCache.set(key, { value, timestamp: Date.now(), ttl });
  },
  has: (key) => {
    const item = apiCache.get(key);
    if (!item) return false;
    if (Date.now() - item.timestamp > item.ttl) {
      apiCache.delete(key);
      return false;
    }
    return true;
  }
};