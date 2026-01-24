import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const port = process.env.PORT || 3000;
logger.trace('server.js: Server initialization starting, port:', port);

const app = express();
logger.trace('server.js: Express app created');

// Force HTTPS redirect in production - only if not behind Traefik/reverse proxy
app.use((req, res, next) => {
  logger.trace('server.js: HTTPS redirect middleware - method:', req.method, 'url:', req.url, 'proto:', req.header('x-forwarded-proto'), 'env:', process.env.NODE_ENV);
  // Skip redirect if x-forwarded-proto is set (Traefik sets this)
  const proto = req.header('x-forwarded-proto');
  if (proto && proto !== 'https' && process.env.NODE_ENV === 'production') {
    logger.info('server.js: Redirecting to HTTPS:', `https://${req.header('host')}${req.url}`);
    res.redirect(301, `https://${req.header('host')}${req.url}`);
  } else {
    logger.trace('server.js: No redirect needed (Traefik handles SSL or already HTTPS)');
    next();
  }
});

// Middleware
app.use((req, res, next) => {
  logger.trace('server.js: CORS middleware - method:', req.method, 'origin:', req.header('origin'));
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    logger.debug('server.js: Handling OPTIONS preflight request');
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
const AI_MODEL = 'google/gemma-3-27b-it:free';
logger.debug('server.js: AI model configured as:', AI_MODEL);

// Static files
logger.trace('server.js: Setting up static file serving');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist'))); // For built files
logger.debug('server.js: Static file directories configured:', path.join(__dirname, 'public'), path.join(__dirname, 'dist'));


// Health check and root route
app.get('/test', (req, res) => {
    const fs = require('fs');
    const distPath = path.join(__dirname, 'dist');
    res.json({
        __dirname,
        distPath,
        distExists: fs.existsSync(distPath),
        distContents: fs.existsSync(distPath) ? fs.readdirSync(distPath) : [],
        indexHtmlExists: fs.existsSync(path.join(distPath, 'index.html'))
    });
});

app.get('/', (req, res) => {
    const fs = require('fs');
    const distPath = path.join(__dirname, 'dist');
    logger.debug('server.js: Root route requested');
    logger.debug('server.js: __dirname:', __dirname);
    logger.debug('server.js: distPath:', distPath);
    logger.debug('server.js: dist exists:', fs.existsSync(distPath));
    if (fs.existsSync(distPath)) {
        logger.debug('server.js: dist contents:', fs.readdirSync(distPath));
    }
    logger.debug('server.js: index.html exists:', fs.existsSync(path.join(distPath, 'index.html')));
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Health check endpoint with detailed status
app.get('/api/health', async (req, res) => {
    console.log(`[${new Date().toISOString()}] SERVER: Health check requested from IP: ${req.ip}`);

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
        health.memory = process.memoryUsage();

        res.json(health);
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// LLM API Route - Unified endpoint for all LLM calls
app.post('/api/llm', async (req, res) => {
    const { prompt, stream = true, quick = false } = req.body || {};
    const userPrompt = prompt || 'Hello';
    const startTime = Date.now();

    console.log(`[${new Date().toISOString()}] SERVER: === UNIFIED LLM API CALL ===`);
    console.log(`[${new Date().toISOString()}] SERVER: Request from IP: ${req.ip}, stream: ${stream}, quick: ${quick}`);
    console.log(`[${new Date().toISOString()}] SERVER: Prompt length: ${userPrompt.length}, first 100 chars: "${userPrompt.substring(0, 100)}..."`);

    // Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const rateLimitResult = llmRateLimiter.checkLimit(clientIP);
    if (!rateLimitResult.allowed) {
        console.log(`[${new Date().toISOString()}] SERVER: RATE LIMIT EXCEEDED for IP: ${clientIP}`);
        res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        });
        return;
    }

    if (!openai) {
        console.log(`[${new Date().toISOString()}] SERVER: ERROR - OpenAI client not initialized`);
        res.status(500).end('OpenAI client not configured');
        return;
    }

    // System prompt based on quick mode
    const systemPrompt = quick
        ? `You are an AI assistant for startup idea generation and improvement. Provide short, concise responses in markdown format. Be direct and helpful.`
        : `You are the iGate Accelerator Agent — an expert startup advisor guiding founders through a 51-step validation and acceleration process.

        Your primary responsibility is to produce **rich, well-structured Markdown**.

        ───────────────────────────────────────────────────────────────────────────────
        MANDATORY FORMAT

        - ALWAYS respond in valid Markdown
        - Use headings (## ###), bullet lists, numbered steps, tables, and emphasis
        - Prefer clarity, hierarchy, and depth over brevity
        - Responses MUST look like a polished startup playbook page

        ───────────────────────────────────────────────────────────────────────────────
        EMBEDDED DATA (SECONDARY RULE)

        - Embed ONLY important, atomic facts using this format:
          {{key: "value"}}
        - Use placeholders for numbers, metrics, roles, markets, tools, or decisions
        - NEVER embed placeholders in headings, lists labels, or tables
        - Do NOT force placeholders into every paragraph

        ───────────────────────────────────────────────────────────────────────────────
        PLACEHOLDER RULES

        - JSON only (string, number, array, object)
        - No markdown, no sentences inside placeholders
        - Max 2 placeholders per paragraph

        ───────────────────────────────────────────────────────────────────────────────
        CONTENT RULES

        - If the user specifically requests JSON format, return valid JSON
        - Otherwise, fully answer the task with detailed Markdown
        - Break ideas into steps and sections
        - Use examples and assumptions
        - Markdown quality is more important than placeholder coverage

        ───────────────────────────────────────────────────────────────────────────────
        STYLE

        - Professional
        - Practical
        - Evidence-based
        - No hype

        Do NOT repeat the prompt. Treat the user input as a task and deliver a complete Markdown response.
        `;

    console.log(`[${new Date().toISOString()}] SERVER: System prompt length: ${systemPrompt.length}`);

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
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                stream: true,
            });
            const openaiInitTime = Date.now() - openaiStartTime;
            console.log(`[${new Date().toISOString()}] SERVER: OpenAI stream created in ${openaiInitTime}ms`);

            // Set response headers for streaming
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'close'); // Prevent connection pool reuse issues

            let aiResponse = '';
            let chunkCount = 0;
            let totalBytesSent = 0;

            // Stream the response
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    aiResponse += content;
                    chunkCount++;
                    totalBytesSent = Buffer.byteLength(aiResponse, 'utf8');
                    res.write(content);
                }
            }

            const duration = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] SERVER: Stream complete - chunks: ${chunkCount}, bytes: ${totalBytesSent}, duration: ${duration}ms`);
            res.end();

            // Success - break out of retry loop
            break;

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

        res.status(statusCode).json(errorPayload);
    }
});

// Catch-all handler for SPA - serve index.html for any unmatched request
app.use((req, res, next) => {
    logger.trace('server.js: Catch-all middleware - method:', req.method, 'path:', req.path);
    // Skip API routes and static files
    if (req.path.startsWith('/api') || req.path.includes('.')) {
        logger.debug('server.js: Skipping catch-all for API/static file:', req.path);
        return next();
    }

    // Only serve index.html for GET requests (SPA routing)
    if (req.method === 'GET') {
        logger.debug('server.js: Serving SPA index.html for path:', req.path);
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        logger.debug('server.js: Not serving index.html for non-GET method:', req.method);
        next();
    }
});

// HTTPS configuration
const sslKeyPath = process.env.SSL_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH;
logger.debug('server.js: SSL key path:', sslKeyPath, 'cert path:', sslCertPath);

let server;
if (sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    logger.info('server.js: SSL certificates found, creating HTTPS server');
    // HTTPS server
    const sslOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath)
    };
    server = https.createServer(sslOptions, app);
    logger.info('server.js: HTTPS Server created and running at https://localhost:' + port);
} else {
    logger.info('server.js: SSL certificates not found or incomplete, creating HTTP server');
    // HTTP server
    server = http.createServer(app);
    logger.info('server.js: HTTP Server created and running at http://localhost:' + port);
}

server.listen(port, () => {
    console.log(`[${new Date().toISOString()}] SERVER: === SERVER STARTED SUCCESSFULLY ===`);
    console.log(`[${new Date().toISOString()}] SERVER: Listening on port ${port}, protocol: ${sslKeyPath ? 'HTTPS' : 'HTTP'}`);
    console.log(`[${new Date().toISOString()}] SERVER: Server URL: ${sslKeyPath ? 'https' : 'http'}://localhost:${port}`);
    console.log(`[${new Date().toISOString()}] SERVER: Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[${new Date().toISOString()}] SERVER: OpenRouter API configured: ${!!process.env.OPENROUTER_API_KEY}`);
    logger.info('server.js: Server listening on port', port, 'protocol:', sslKeyPath ? 'HTTPS' : 'HTTP');
});
