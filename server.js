import 'dotenv/config';

// Simple console wrapper to replace logger
const logger = {
  trace: console.log,
  debug: console.log,
  info: console.log,
  warn: console.warn,
  error: console.error,
};

// Simple in-memory rate limiter
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }

  checkLimit(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const userRequests = this.requests.get(key);
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);

    if (validRequests.length >= this.maxRequests) {
      return { allowed: false, resetTime: validRequests[0] + this.windowMs };
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return { allowed: true };
  }
}

const llmRateLimiter = new RateLimiter(60000, 5); // 5 requests per minute for LLM endpoints

// Environment variable validation
function validateEnvironment() {
  const required = ['OPENROUTER_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables:', missing);
    process.exit(1);
  }

  // Warn about optional vars
  const optional = ['SENTRY_DSN', 'GA_TRACKING_ID'];
  optional.forEach(key => {
    if (!process.env[key]) {
      logger.warn(`Optional environment variable ${key} not set`);
    }
  });
}

validateEnvironment();

// Import OpenAI dynamically to avoid issues during build
const { default: OpenAI } = await import('openai');

// OpenAI client for OpenRouter
let openai = null;
logger.trace('server.js: Initializing OpenAI client');
try {
  if (process.env.OPENROUTER_API_KEY) {
    logger.info('server.js: OPENROUTER_API_KEY found, length:', process.env.OPENROUTER_API_KEY.length);
    logger.debug('server.js: API key starts with:', process.env.OPENROUTER_API_KEY.substring(0, 10) + '...');
    openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    logger.info('server.js: OpenAI client initialized successfully');
  } else {
    logger.warn('server.js: OPENROUTER_API_KEY not found, LLM calls will fail');
  }
} catch (error) {
  logger.error('server.js: Failed to initialize OpenAI client:', error.message, error.stack);
}

// Model configuration
const AI_MODEL = 'google/gemma-3n-e2b-it:free';
logger.debug('server.js: AI model configured as:', AI_MODEL);

// Determine port
const port = process.env.PORT || 3000;

// Define routes
const routes = {
  '/api/health': async (request) => {
    console.log(`[${new Date().toISOString()}] SERVER: Health check requested from IP: ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}`);

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      services: {}
    };

    try {
      // Check OpenRouter API key
      if (process.env.OPENROUTER_API_KEY) {
        health.services.openrouter = 'configured';
      } else {
        health.services.openrouter = 'missing_api_key';
        health.status = 'degraded';
      }

      // Check PGLite database (basic connectivity)
      // Since PGLite is client-side, we can't check it from server
      health.services.database = 'client_side_pglite';

      // Check SSL status
      const hasSSL = !!(process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH);
      health.services.ssl = hasSSL ? 'enabled' : 'disabled';

      // Memory usage
      health.memory = process.memoryUsage ? process.memoryUsage() : {};

      return new Response(JSON.stringify(health), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      logger.error('Health check error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  '/api/llm': async (request) => {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { prompt, stream = true, quick = false, language = 'en' } = await request.json() || {};
    const userPrompt = prompt || 'Hello';
    const startTime = Date.now();

    console.log(`[${new Date().toISOString()}] SERVER: === UNIFIED LLM API CALL ===`);
    console.log(`[${new Date().toISOString()}] SERVER: Request from IP: ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}, stream: ${stream}, quick: ${quick}`);
    console.log(`[${new Date().toISOString()}] SERVER: Prompt length: ${userPrompt.length}, first 100 chars: "${userPrompt.substring(0, 1000)}..."`);

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = llmRateLimiter.checkLimit(clientIP);
    if (!rateLimitResult.allowed) {
      console.log(`[${new Date().toISOString()}] SERVER: RATE LIMIT EXCEEDED for IP: ${clientIP}`);
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!openai) {
      console.log(`[${new Date().toISOString()}] SERVER: ERROR - OpenAI client not initialized`);
      return new Response('OpenAI client not configured', { status: 500 });
    }

    // Use the user's prompt directly without system prompt
    console.log(`[${new Date().toISOString()}] SERVER: Processing user prompt, length: ${userPrompt.length}`);

    // Retry logic with exponential backoff
    const maxRetries = 3;
    let retries = 0;
    let lastError = null;

    while (retries <= maxRetries) {
      try {
        console.log(`[${new Date().toISOString()}] SERVER: Creating OpenAI stream (attempt ${retries + 1}/${maxRetries + 1})`);

        const openaiStartTime = Date.now();
        const stream = await openai.chat.completions.create({
          model: AI_MODEL,
          messages: [
            { role: 'user', content: userPrompt }
          ],
          stream: true,
        });
        const openaiInitTime = Date.now() - openaiStartTime;
        console.log(`[${new Date().toISOString()}] SERVER: OpenAI stream created in ${openaiInitTime}ms`);

        // Create a readable stream for the response
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
          async start(controller) {
            let aiResponse = '';
            let chunkCount = 0;
            let totalBytesSent = 0;

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                aiResponse += content;
                chunkCount++;
                totalBytesSent = new Blob([aiResponse]).size;
                controller.enqueue(encoder.encode(content));
              }
            }

            const duration = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] SERVER: Stream complete - chunks: ${chunkCount}, bytes: ${totalBytesSent}, duration: ${duration}ms`);
            
            controller.close();
          }
        });

        return new Response(readableStream, {
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache',
            'Connection': 'close'
          }
        });

      } catch (error) {
        lastError = error;
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] SERVER: Attempt ${retries + 1}/${maxRetries + 1} failed: ${error.message}`);
        console.error(`[${new Date().toISOString()}] SERVER: Error detail`, {
          name: error?.name,
          code: error?.code,
          status: error?.status || error?.response?.status,
          data: error?.response?.data || error?.data || null,
          stack: error?.stack
        });

        const isRetryable = error.message.includes('429') ||
                            error.message.includes('500') ||
                            error.message.includes('502') ||
                            error.message.includes('503') ||
                            error.message.includes('504') ||
                            error.code === 'ECONNRESET' ||
                            error.code === 'ETIMEDOUT';

        if (!isRetryable || retries >= maxRetries) {
          break;
        }

        const waitTime = Math.pow(2, retries) * 1000;
        console.log(`[${new Date().toISOString()}] SERVER: Retrying in ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
      }
    }

    if (retries > maxRetries && lastError) {
      console.log(`[${new Date().toISOString()}] SERVER: All retries failed: ${lastError.message}`);

      let userMessage = 'An error occurred while processing your request. ';
      let statusCode = 500;

      if (lastError.message.includes('429') || lastError.message.includes('rate limit')) {
        userMessage += 'The AI service is currently busy. Please try again in a few moments.';
        statusCode = 429;
      } else if (lastError.message.includes('500') || lastError.message.includes('502') || lastError.message.includes('503') || lastError.message.includes('504')) {
        userMessage += 'The AI service is temporarily unavailable. Please try again later.';
        statusCode = 503;
      } else if (lastError.code === 'ECONNRESET' || lastError.code === 'ETIMEDOUT') {
        userMessage += 'Connection to the AI service was interrupted.';
        statusCode = 503;
      }

      const errorPayload = {
        error: userMessage.trim(),
        details: {
          name: lastError?.name,
          code: lastError?.code,
          status: lastError?.status || lastError?.response?.status,
          message: lastError?.message,
          data: lastError?.response?.data || lastError?.data || null
        }
      };

      return new Response(JSON.stringify(errorPayload), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// Bun.serve options
const serveOptions = {
  port,
  async fetch(request) {
    const url = new URL(request.url);

    // Handle API routes
    if (routes[url.pathname]) {
      return routes[url.pathname](request);
    }

    // Development mode: redirect static assets to Vite dev server
    if (process.env.NODE_ENV !== 'production') {
      if (url.pathname.startsWith('/assets/') ||
          url.pathname.endsWith('.js') ||
          url.pathname.endsWith('.css') ||
          url.pathname.startsWith('/@') ||  // Vite virtual modules
          url.pathname.includes('/node_modules/')) {

        // Redirect to Vite dev server (assuming it runs on port 5173)
        const viteUrl = `http://localhost:5173${url.pathname}`;
        return Response.redirect(viteUrl, 302);
      }

      // Serve static files from public directory in development
      if (url.pathname.startsWith('/public/')) {
        const filePath = `.${url.pathname}`;
        try {
          const file = Bun.file(filePath);
          const fileExists = await file.exists();
          if (fileExists) {
            const ext = filePath.split('.').pop();
            const contentType = {
              'html': 'text/html',
              'js': 'text/javascript',
              'css': 'text/css',
              'json': 'application/json',
              'png': 'image/png',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'gif': 'image/gif',
              'svg': 'image/svg+xml',
              'txt': 'text/plain'
            }[ext] || 'application/octet-stream';

            return new Response(file, {
              headers: { 'Content-Type': contentType }
            });
          }
        } catch (error) {
          console.log(`Static file error: ${error.message}`);
        }
      }

      // Serve the settings modal from Vite dev server in development
      if (url.pathname === '/settings-modal.html') {
        try {
          // Redirect to Vite dev server (assuming it runs on port 5173)
          const viteUrl = `http://localhost:5173${url.pathname}`;
          return Response.redirect(viteUrl, 302);
        } catch (error) {
          console.log(`Settings modal redirect error: ${error.message}`);
        }
      }

      // For root route in development, fetch from Vite dev server
      if (url.pathname === '/' || url.pathname === '/index.html') {
        try {
          // Try to fetch from Vite dev server first
          const viteResponse = await fetch(`http://localhost:5173${url.pathname}`);
          if (viteResponse.ok) {
            return viteResponse;
          }
        } catch (error) {
          console.log(`Failed to fetch from Vite dev server: ${error.message}`);
        }
      }
    }

    // Production mode: serve from dist directory
    if (url.pathname === '/' || url.pathname === '/index.html') {
      // Return the main HTML file
      return new Response(Bun.file('./dist/index.html'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Handle other static files in production
    if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
      const filePath = `./dist${url.pathname}`;
      try {
        const file = Bun.file(filePath);
        const fileExists = await file.exists();
        if (fileExists) {
          return new Response(file);
        }
      } catch (error) {
        console.log(`Static file error: ${error.message}`);
      }
    }

    // Catch-all handler for SPA - serve index.html for any unmatched request
    if (!url.pathname.startsWith('/api')) {
      return new Response(Bun.file('./dist/index.html'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // 404 for unknown routes
    return new Response('Not Found', { status: 404 });
  }
};

console.log(`[${new Date().toISOString()}] SERVER: === BUN SERVER STARTING ===`);
console.log(`[${new Date().toISOString()}] SERVER: Listening on port ${port}`);
console.log(`[${new Date().toISOString()}] SERVER: Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[${new Date().toISOString()}] SERVER: OpenRouter API configured: ${!!process.env.OPENROUTER_API_KEY}`);

// Start the server
const server = Bun.serve(serveOptions);

console.log(`[${new Date().toISOString()}] SERVER: === BUN SERVER STARTED SUCCESSFULLY ===`);
console.log(`[${new Date().toISOString()}] SERVER: Server URL: http://localhost:${port}`);