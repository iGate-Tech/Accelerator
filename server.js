import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import logger from './src/lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const AI_MODEL = 'meta-llama/llama-3.2-3b-instruct:free';
logger.debug('server.js: AI model configured as:', AI_MODEL);

// Static files
logger.trace('server.js: Setting up static file serving');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist'))); // For built files
logger.debug('server.js: Static file directories configured:', path.join(__dirname, 'public'), path.join(__dirname, 'dist'));

// Service worker
app.get('/sw.js', (req, res) => {
    logger.debug('server.js: Service worker requested, serving:', path.join(__dirname, 'public/sw.js'));
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public/sw.js'));
});

// Health check and root route
app.get('/', (req, res) => {
    logger.debug('server.js: Root route requested, serving SPA index.html');
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Test route to verify server is working
app.get('/api/health', (req, res) => {
    logger.info('server.js: Health check requested');
    res.json({ status: 'ok', message: 'Server is running' });
});

// LLM API Route
app.post('/api/llm/stream', async (req, res) => {
    const prompt = req.body.prompt || 'Hello';
    const startTime = Date.now();

    logger.info('server.js: === STREAMING LLM API CALL RECEIVED ===');
    logger.debug('server.js: Request body keys:', Object.keys(req.body || {}), 'prompt length:', prompt.length);
    logger.trace('server.js: Full request body:', req.body);

    if (!openai) {
        logger.error('server.js: OpenAI client not initialized');
        res.status(500).end('OpenAI client not configured');
        return;
    }
    logger.debug('server.js: OpenAI client available, proceeding with request');

    try {
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

- Fully answer the task with detailed Markdown
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

        logger.debug('server.js: Creating OpenAI stream with model:', AI_MODEL, 'systemPrompt length:', systemPrompt.length, 'userMessage length:', userMessage.length);
        const stream = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            stream: true,
        });
        logger.debug('server.js: OpenAI stream created successfully');

        let aiResponse = '';
        let chunkCount = 0;
        logger.debug('server.js: Starting to stream response chunks');
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            aiResponse += content;
            res.write(content);
            chunkCount++;
            if (chunkCount % 10 === 0) {
                logger.trace('server.js: Streamed', chunkCount, 'chunks, current response length:', aiResponse.length);
            }
        }
        res.end();
        const duration = Date.now() - startTime;
        logger.info('server.js: Stream completed - total chunks:', chunkCount, 'response length:', aiResponse.length, 'duration:', duration + 'ms');
        logger.debug('server.js: Full LLM Response preview:', aiResponse.substring(0, 200) + '...');

        // No longer update server-side history
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('server.js: Streaming LLM error after', duration + 'ms:', error.message, error.stack);
        logger.trace('server.js: Full error object:', error);
        res.status(500).end('Error: ' + error.message);
    }
});

// Quick LLM API Route for short responses
app.post('/api/llm/quick', async (req, res) => {
    const prompt = req.body.prompt || 'Hello';
    const startTime = Date.now();

    logger.info('server.js: === QUICK LLM API CALL RECEIVED ===');
    logger.debug('server.js: Request body keys:', Object.keys(req.body || {}), 'prompt length:', prompt.length);
    logger.trace('server.js: Full request body:', req.body);

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

            res.setHeader('Content-Type', 'text/plain');
            let aiResponse = '';
            let chunkCount = 0;
            logger.debug('server.js: Starting to stream quick response chunks');
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                aiResponse += content;
                res.write(content);
                chunkCount++;
            }
            res.end();
            const duration = Date.now() - startTime;
            logger.info('server.js: Quick stream completed - chunks:', chunkCount, 'response length:', aiResponse.length, 'duration:', duration + 'ms');
            logger.debug('server.js: Quick LLM Response:', aiResponse);
            break; // success, exit loop
        } catch (error) {
            const duration = Date.now() - startTime;
            if (error.message.includes('429') && retries < maxRetries) {
                retries++;
                const waitTime = 5000 * retries; // 5s, 10s, 15s
                logger.warn(`server.js: 429 error, retrying in ${waitTime}ms (attempt ${retries}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
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
    logger.info('server.js: Server listening on port', port, 'protocol:', sslKeyPath ? 'HTTPS' : 'HTTP');
});