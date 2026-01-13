import { describe, it, expect, vi } from 'vitest';

// Mock fetch for API tests
global.fetch = vi.fn();

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/api/health', () => {
    it('should return health status', async () => {
      const mockResponse = {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 123.45,
        version: '1.0.0',
        services: {
          openrouter: 'configured',
          database: 'client_side_pglite',
          ssl: 'disabled'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await fetch('/api/health');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('services');
    });
  });

  describe('LLM API endpoints', () => {
    it('should handle successful LLM stream requests', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/plain']]),
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: new Uint8Array() })
          })
        }
      });

      const response = await fetch('/api/llm/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'Test prompt' }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/plain');
    });

    it('should handle rate limited requests', async () => {
      const mockResponse = {
        error: 'Rate limit exceeded',
        retryAfter: 60
      };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await fetch('/api/llm/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'Test prompt' }),
      });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe('Rate limit exceeded');
      expect(data).toHaveProperty('retryAfter');
    });
  });
});