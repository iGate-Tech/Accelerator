require('dotenv').config();
const express = require('express');
const path = require('path');
const OpenAI = require('openai');

const port = 3000;

const app = express();

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// OpenAI client for OpenRouter
let openai = null;
try {
  if (process.env.OPENROUTER_API_KEY) {
    console.log('API key found, length:', process.env.OPENROUTER_API_KEY.length);
    console.log('API key starts with:', process.env.OPENROUTER_API_KEY.substring(0, 10) + '...');
    openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    console.log('OpenAI client initialized successfully');
  } else {
    console.warn('OPENROUTER_API_KEY not found, LLM calls will fail');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

// Model configuration
const AI_MODEL = 'meta-llama/llama-3.2-3b-instruct:free';

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist'))); // For built files

// Service worker
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'public/sw.js'));
});

// LLM API Route
app.post('/api/llm/stream', async (req, res) => {
    const prompt = req.body.prompt || 'Hello';
    const userMessage = prompt;

    console.log('=== STREAMING LLM API CALL RECEIVED ===');
    console.log('Request body:', req.body);

    if (!openai) {
        console.error('OpenAI client not initialized');
        res.status(500).end('OpenAI client not configured');
        return;
    }

    try {
        res.setHeader('Content-Type', 'text/plain');
        const systemPrompt = `You are the iGate Accelerator Agent — an expert startup advisor guiding founders through a 51-step validation and acceleration process.

Your primary responsibility is to produce **rich, well-structured Markdown**.

────────────────────────────────────────────────────────────────
MANDATORY FORMAT

- ALWAYS respond in valid Markdown
- Use headings (## ###), bullet lists, numbered steps, tables, and emphasis
- Prefer clarity, hierarchy, and depth over brevity
- Responses MUST look like a polished startup playbook page

────────────────────────────────────────────────────────────────
EMBEDDED DATA (SECONDARY RULE)

- Embed ONLY important, atomic facts using this format:
  {{key: "value"}}
- Use placeholders for numbers, metrics, roles, markets, tools, or decisions
- NEVER embed placeholders in headings, lists labels, or tables
- Do NOT force placeholders into every paragraph

────────────────────────────────────────────────────────────────
PLACEHOLDER RULES

- JSON only (string, number, array, object)
- No markdown, no sentences inside placeholders
- Max 2 placeholders per paragraph

────────────────────────────────────────────────────────────────
CONTENT RULES

- Fully answer the task with detailed Markdown
- Break ideas into steps and sections
- Use examples and assumptions
- Markdown quality is more important than placeholder coverage

────────────────────────────────────────────────────────────────
STYLE

- Professional
- Practical
- Evidence-based
- No hype

Do NOT repeat the prompt. Treat the user input as a task and deliver a complete Markdown response.
`;

        const stream = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            stream: true,
        });

        let aiResponse = '';
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            aiResponse += content;
            res.write(content);
        }
        res.end();

        console.log('Full LLM Response:', aiResponse);

        // No longer update server-side history
    } catch (error) {
        console.error('Streaming LLM error:', error.message);
        console.error('Full error:', error);
        res.status(500).end('Error: ' + error.message);
    }
});

// Catch-all handler for SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});