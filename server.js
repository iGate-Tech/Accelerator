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

// Force HTTPS redirect in production
app.use((req, res, next) => {
  logger.trace('server.js: HTTPS redirect middleware - method:', req.method, 'url:', req.url, 'proto:', req.header('x-forwarded-proto'), 'env:', process.env.NODE_ENV);
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    logger.info('server.js: Redirecting to HTTPS:', `https://${req.header('host')}${req.url}`);
    res.redirect(301, `https://${req.header('host')}${req.url}`);
  } else {
    logger.trace('server.js: No redirect needed');
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
app.get('/', (req, res) => {
    logger.debug('server.js: Root route requested, serving SPA index.html');
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

// LLM API Route
app.post('/api/llm', async (req, res) => {
    const prompt = req.body.prompt || 'Hello';
    const startTime = Date.now();

    console.log(`[${new Date().toISOString()}] SERVER: === STREAMING LLM API CALL RECEIVED ===`);
    console.log(`[${new Date().toISOString()}] SERVER: Request from IP: ${req.ip}, user-agent: ${req.get('User-Agent')?.substring(0, 50) || 'unknown'}`);
    console.log(`[${new Date().toISOString()}] SERVER: Prompt length: ${prompt.length}, first 100 chars: "${prompt.substring(0, 100)}..."`);

    // Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const rateLimitResult = llmRateLimiter.checkLimit(clientIP);
    if (!rateLimitResult.allowed) {
        console.log(`[${new Date().toISOString()}] SERVER: RATE LIMIT EXCEEDED for IP: ${clientIP}, reset in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)}s`);
        logger.warn('server.js: Rate limit exceeded for IP:', clientIP);
        res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        });
        return;
    }
    console.log(`[${new Date().toISOString()}] SERVER: Rate limit check passed for IP: ${clientIP}`);

    console.log(`[${new Date().toISOString()}] SERVER: Request body keys: ${Object.keys(req.body || {}).join(', ')}`);
    console.log(`[${new Date().toISOString()}] SERVER: Full request headers:`, JSON.stringify(req.headers, null, 2));

    if (!openai) {
        console.log(`[${new Date().toISOString()}] SERVER: ERROR - OpenAI client not initialized`);
        logger.error('server.js: OpenAI client not initialized');
        res.status(500).end('OpenAI client not configured');
        return;
    }
    console.log(`[${new Date().toISOString()}] SERVER: OpenAI client available, proceeding with request`);
    console.log(`[${new Date().toISOString()}] SERVER: Using model: ${AI_MODEL}`);

    try {
        console.log(`[${new Date().toISOString()}] SERVER: Setting response headers for streaming`);
        res.setHeader('Content-Type', 'text/plain');

        const systemPrompt = `You are the iGate Accelerator Agent — an expert startup advisor guiding founders through a 51-step validation and acceleration process.

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

        console.log(`[${new Date().toISOString()}] SERVER: System prompt length: ${systemPrompt.length}, user prompt length: ${prompt.length}`);
        console.log(`[${new Date().toISOString()}] SERVER: Creating OpenAI stream with model: ${AI_MODEL}`);

        // Retry logic with exponential backoff
        const maxRetries = 3;
        let retries = 0;
        let lastError = null;

        while (retries <= maxRetries) {
            try {
                const openaiStartTime = Date.now();
                const stream = await openai.chat.completions.create({
                    model: AI_MODEL,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    stream: true,
                });
                const openaiInitTime = Date.now() - openaiStartTime;
                console.log(`[${new Date().toISOString()}] SERVER: OpenAI stream created successfully in ${openaiInitTime}ms (attempt ${retries + 1}/${maxRetries + 1})`);

                console.log(`[${new Date().toISOString()}] SERVER: Starting to stream response chunks to client`);
                let aiResponse = '';
                let chunkCount = 0;
                let totalBytesSent = 0;

                // Stream the response
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        aiResponse += content;
                        chunkCount = aiResponse.split(' ').length;
                        totalBytesSent = Buffer.byteLength(aiResponse, 'utf8');
                        console.log(`[${new Date().toISOString()}] SERVER: Streaming chunk: "${content}" (response so far: ${aiResponse.length} chars, ${chunkCount} words, ${totalBytesSent} bytes)`);
                        res.write(content);
                    }
                }

                const duration = Date.now() - startTime;
                console.log(`[${new Date().toISOString()}] SERVER: Total chunks: ${chunkCount}, response length: ${aiResponse.length}, bytes sent: ${totalBytesSent}, total duration: ${duration}ms`);
                console.log(`[${new Date().toISOString()}] SERVER: Response preview: "${aiResponse.substring(0, 200)}..."`);
                console.log(`[${new Date().toISOString()}] SERVER: Ending response stream`);
                res.end();

                // Success - break out of retry loop
                break;

            } catch (error) {
                lastError = error;
                const duration = Date.now() - startTime;
                console.log(`[${new Date().toISOString()}] SERVER: Attempt ${retries + 1}/${maxRetries + 1} failed after ${duration}ms: ${error.message}`);

                // Check if this is a retryable error
                const isRetryable = error.message.includes('429') || // Rate limit
                                   error.message.includes('500') || // Server error
                                   error.message.includes('502') || // Bad gateway
                                   error.message.includes('503') || // Service unavailable
                                   error.message.includes('504') || // Gateway timeout
                                   error.code === 'ECONNRESET' ||
                                   error.code === 'ETIMEDOUT';

                if (!isRetryable || retries >= maxRetries) {
                    // Not retryable or max retries reached
                    console.log(`[${new Date().toISOString()}] SERVER: Not retryable or max retries reached, failing request`);
                    break;
                }

                // Calculate exponential backoff delay (1s, 2s, 4s)
                const waitTime = Math.pow(2, retries) * 1000;
                console.log(`[${new Date().toISOString()}] SERVER: Retrying in ${waitTime}ms (attempt ${retries + 1}/${maxRetries + 1})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retries++;
            }
        }

        if (retries > maxRetries && lastError) {
            // All retries failed, throw the last error
            throw lastError;
        }

        // No longer update server-side history
    } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] SERVER: CRITICAL ERROR after ${duration}ms: ${error.message}`);
        console.log(`[${new Date().toISOString()}] SERVER: Error stack:`, error.stack);
        console.log(`[${new Date().toISOString()}] SERVER: Full error object:`, error);

        // Provide user-friendly error messages with recovery suggestions
        let userMessage = 'An error occurred while processing your request. ';
        let statusCode = 500;

        if (error.message.includes('429') || error.message.includes('rate limit')) {
            userMessage += 'The AI service is currently busy. Please try again in a few moments.';
            statusCode = 429;
        } else if (error.message.includes('400') || error.message.includes('invalid')) {
            userMessage += 'There was an issue with your request. Please check your input and try again.';
            statusCode = 400;
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503') || error.message.includes('504')) {
            userMessage += 'The AI service is temporarily unavailable. Please try again later.';
            statusCode = 503;
        } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            userMessage += 'Connection to the AI service was interrupted. Please check your internet connection and try again.';
            statusCode = 503;
        } else {
            userMessage += 'If this problem persists, please contact support.';
        }

        console.log(`[${new Date().toISOString()}] SERVER: Sending ${statusCode} error response to client: ${userMessage}`);
        res.status(statusCode).end(userMessage);
    }
});

// Quick LLM API Route for short responses
app.post('/api/llm/quick', async (req, res) => {
    const prompt = req.body.prompt || 'Hello';
    const startTime = Date.now();

    console.log(`[${new Date().toISOString()}] SERVER: === QUICK LLM API CALL RECEIVED ===`);
    console.log(`[${new Date().toISOString()}] SERVER: Quick request from IP: ${req.ip}, prompt length: ${prompt.length}`);

    // Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const rateLimitResult = llmRateLimiter.checkLimit(clientIP);
    if (!rateLimitResult.allowed) {
        console.log(`[${new Date().toISOString()}] SERVER: QUICK - RATE LIMIT EXCEEDED for IP: ${clientIP}`);
        logger.warn('server.js: Rate limit exceeded for IP:', clientIP);
        res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        });
        return;
    }
    console.log(`[${new Date().toISOString()}] SERVER: Quick - Rate limit check passed`);

    if (!openai) {
        logger.error('server.js: OpenAI client not initialized');
        res.status(500).end('OpenAI client not configured');
        return;
    }
    logger.debug('server.js: OpenAI client available, proceeding with quick request');

    let retries = 0;
    const maxRetries = 3;
    while (retries <= maxRetries) {
        try {
            const systemPrompt = `You are an AI assistant for startup idea generation and improvement. Provide short, concise responses in markdown format. Be direct and helpful.`;

            logger.debug('server.js: Creating quick OpenAI stream with model:', AI_MODEL, 'systemPrompt length:', systemPrompt.length, 'prompt length:', prompt.length);
            const stream = await openai.chat.completions.create({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                stream: true,
            });
            logger.debug('server.js: Quick OpenAI stream created successfully');

            console.log(`[${new Date().toISOString()}] SERVER: Quick - Setting response headers for streaming`);
            res.setHeader('Content-Type', 'text/plain');
            let aiResponse = '';
            let chunkCount = 0;
            console.log(`[${new Date().toISOString()}] SERVER: Quick - Starting to stream response chunks`);
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            aiResponse += content;
            res.write(content);
            chunkCount++;
        }
            console.log(`[${new Date().toISOString()}] SERVER: Quick - Ending response stream`);
            res.end();
            const duration = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] SERVER: === QUICK STREAM COMPLETED ===`);
            console.log(`[${new Date().toISOString()}] SERVER: Quick - Total chunks: ${chunkCount}, response length: ${aiResponse.length}, duration: ${duration}ms`);
            console.log(`[${new Date().toISOString()}] SERVER: Quick - Response length: ${aiResponse.length}`);
            break; // success, exit loop
        } catch (error) {
            const duration = Date.now() - startTime;
            if (error.message.includes('429') && retries < maxRetries) {
                retries++;
                const waitTime = 5000 * retries; // 5s, 10s, 15s
                console.log(`[${new Date().toISOString()}] SERVER: Quick - 429 rate limit error, retrying in ${waitTime}ms (attempt ${retries}/${maxRetries})`);
                logger.warn(`server.js: 429 error, retrying in ${waitTime}ms (attempt ${retries}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                console.log(`[${new Date().toISOString()}] SERVER: Quick - CRITICAL ERROR after ${duration}ms: ${error.message}`);
                console.log(`[${new Date().toISOString()}] SERVER: Quick - Error stack:`, error.stack);
                logger.error('server.js: Quick LLM error after', duration + 'ms:', error.message, error.stack);
                logger.trace('server.js: Full quick error object:', error);
                res.status(500).end('Error: ' + error.message);
                break;
            }
        }
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