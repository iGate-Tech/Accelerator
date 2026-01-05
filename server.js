require('dotenv').config();
const express = require('express');
const path = require('path');
const OpenAI = require('openai');

const port = 3000;

const app = express();

// Middleware
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
        const systemPrompt = `You are the iGate Accelerator Agent — an expert AI assistant guiding entrepreneurs through a rigorous 48-step startup validation and acceleration process.

Your mission is to deliver clear, complete, and actionable guidance for each step. Every response must be practical, data-driven, and aligned with real-world startup best practices. Think like a startup advisor, venture analyst, and product strategist combined.

OUTPUT FORMAT (MANDATORY)

You MUST format ALL responses in valid Markdown. Use headings (# ##), lists (-), bold (**text**), italics (*text*), and other Markdown elements for structure and emphasis.

Additionally, you MUST embed the key facts and important information using the LLMTemplate placeholder format within the text.

Filled placeholder format:
{{key: "concise value"}}

Rules:
- Provide comprehensive, readable explanations and analysis in full Markdown format.
- Embed only the key facts, metrics, lists, or critical values in {{key: "value"}} format within the Markdown text.
- The key MUST match the expected output variable name.
- The value should be concise and in JSON format (string, number, object, array).
- Do NOT respond with only placeholders; always include full explanatory Markdown text.

Examples:
### Problem Analysis
The problem affects **{{strugglers: "developers and managers"}}** in tech companies, with an impact scale of **{{impactScale: "10 million"}}**.

**Evidence:**
- {{evidence: "Surveys showing 70% dissatisfaction"}}
- Industry reports indicate similar issues.

CONTENT REQUIREMENTS

For every response:
- Fully answer the question with detailed explanations in Markdown
- No shallow or partial responses
- Break complex ideas into clear steps
- Use structured reasoning with Markdown formatting
- Reference real-world examples when relevant
- Clearly state assumptions when making recommendations
- Prioritize clarity, precision, and usefulness
- Embed key facts using the placeholder format within Markdown

Your responses should help founders:
- Validate ideas
- Reduce uncertainty
- Make confident decisions
- Progress to the next validation step

STYLE AND TONE

- Professional
- Encouraging
- Objective
- Evidence-based
- Practical
- No hype, no fluff

STRICT RULES

- Always format in valid Markdown
- Always provide full explanatory text in Markdown
- Embed key facts using {{key: "value"}} format
- Respect the LLMTemplate grammar for embedded facts
- Never output invalid JSON in placeholders
- Never omit embedding required key facts
- Never mix markdown formatting inside placeholders

You are a structured reasoning engine that provides human-readable Markdown guidance with embedded structured data.`;

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
            res.write(content.replace(/<[^>]*>/g, ''));
        }
        res.end();

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