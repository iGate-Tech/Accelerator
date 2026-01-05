require('dotenv').config();
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const marked = require('marked');
const OpenAI = require('openai');

const port = 3000;

const app = express();

// Set up Handlebars
app.engine('handlebars', exphbs.engine({
    helpers: {
        gt: (a, b) => a > b,
        eq: (a, b) => a === b,
        markdown: (text) => text ? marked.parse(text) : '',
        countQuestions: (arr) => arr ? arr.length : 0,
        sumLengths: (content) => content ? content.reduce((sum, group) => sum + (group ? group.length : 0), 0) : 0,
        totalModelQuestions: (sections) => sections ? sections.reduce((sum, section) => sum + (section.content ? section.content.reduce((s, g) => s + (g ? g.length : 0), 0) : 0), 0) : 0
    },
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// OpenAI client for OpenRouter
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Model configuration
const AI_MODEL = 'google/gemma-3-27b-it:free';
const AI_MODEL_DISPLAY = 'Gemma-3-27B-IT-Free';

// Message history
let messageHistory = [];

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Routes
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

app.get('/explore', (req, res) => {
    res.render('explore');
});

app.get('/portfolio', (req, res) => {
    res.render('portfolio');
});

app.get('/help', (req, res) => {
    res.render('help');
});

app.get('/tasks', (req, res) => {
const taskContent = "";

    res.render('tasks', {
        taskContent,
        taskTimestamp: '2024-01-01 10:30 AM - 10:40 AM',
        taskModel: AI_MODEL_DISPLAY,
        currentPrompt: '',
        messageHistory
    });
});

app.post('/tasks', async (req, res) => {
    const prompt = req.body.prompt || '';
    const action = req.body.action || 'send';

let taskContent = req.body.taskContent || "";
    let taskTimestamp = req.body.taskTimestamp || '2024-01-01 10:30 AM - 10:40 AM';
        let taskModel = req.body.taskModel || AI_MODEL_DISPLAY;
    let currentPrompt = prompt;

    let userMessage = prompt || 'Hello';



    if (action === 'send') {
        res.setHeader('Content-Type', 'text/plain');
        const stream = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [
                { role: 'system', content: 'You are an AI Startup Advisor for the iGate Platform, guiding users through a sequential 7-model startup development process: Idea (48 steps), Business (48 steps), Financial (48 steps), Funding (48 steps), Marketing (48 steps), Team (48 steps), and Legal (48 steps). Each model builds on the previous.\n\nAgent Personas\n- Planner: Strategic mentor for defining problems and suggesting solutions.\n- Validator: Analytical checker for contradictions and validation.\n- Financial: Expert for valuations and financial reviews.\n- Legal: Advisor for compliance and legal checks.\n\nProcess Flow\nStart with Idea Model and progress sequentially. Use LLM prompts for each step to generate questions and advice. Collect inputs via schemas, provide guidance, and maintain history. Detect and fix contradictions (e.g., funding.ask ≠ deck.ask).\n\nIdea Model (48 steps)\n1. Define problem, alternatives, struggling customers. (Schema: problem_name, problem_description, problem_strugglers, alternatives, existing_alternatives)\n2-48. Refine elements.\n\nBusiness Model (48 steps)\n1. Define business model, revenue streams, value proposition. (Schema: customer_segments, value_proposition, channels, notes)\n2-48. Build strategy.\n\nFinancial Model (48 steps)\n1. Provide revenue, expense, P&L, valuation. (Schema: revenue_forecast_usd, expenses_forecast_usd, profit_loss_usd, deterministic_valuation, valuation_method)\n2-48. Forecast progress.\n\nFunding Model (48 steps)\n1. Define funding ask, pre-money, use of funds, investors. (Schema: funding_ask_usd, pre_money_valuation_usd, use_of_funds, investor_targets)\n2-48. Strategy raises.\n\nMarketing Model (48 steps)\n1. Plan GTM, channels, campaigns, KPIs. (Schema: channel, campaign_type, budget_usd, target_metrics, notes)\n2-48. Tactics.\n\nTeam Model (48 steps)\n1. Define roles, hire plan, skills mapping, org structure. (Schema: role, required_skills, hiring_timeline_months, team_size_needed, notes)\n2-48. Build team.\n\nLegal Model (48 steps)\n1. Define company structure, IP, contracts, compliance checks. (Schema: company_type, intellectual_property, compliance_checklist, contracts_needed, notes)\n2-48. Setup compliance.\n\nEnd Goal\nAfter all models, generate:\n- Pitch Deck: Summarize problem, solution, market, traction, team, GTM.\n- Business Plan: Cover strategy, financials, funding, marketing, team, legal.\n- Valuation Report: Financial analysis with valuation, P&L, forecasts.\n\nProvide empathetic, actionable guidance throughout.' },
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
        // Add to history
        messageHistory.push({ type: 'user', content: userMessage });
        messageHistory.push({ type: 'ai', content: aiResponse.replace(/<[^>]*>/g, ''), timestamp: new Date().toLocaleString(), model: AI_MODEL_DISPLAY });
        return;
    } else if (action === 'improve') {
        if (!prompt) {
            return res.render('tasks', { error: 'No prompt to improve', taskContent, taskTimestamp, taskModel, currentPrompt });
        }
        try {
            const improvePromptText = "Improve this prompt for better AI results: \"" + prompt + "\"";

            const suggestPromptText = "Suggest a good prompt for an AI coding assistant to help with software development tasks.";
        const completion = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [
                { role: 'system', content: 'You are an AI Startup Advisor for the iGate Platform, guiding users through a sequential 7-model startup development process: Idea (48 steps), Business (48 steps), Financial (48 steps), Funding (48 steps), Marketing (48 steps), Team (48 steps), and Legal (48 steps). Each model builds on the previous.\n\nAgent Personas\n- Planner: Strategic mentor for defining problems and suggesting solutions.\n- Validator: Analytical checker for contradictions and validation.\n- Financial: Expert for valuations and financial reviews.\n- Legal: Advisor for compliance and legal checks.\n\nProcess Flow\nStart with Idea Model and progress sequentially. Use LLM prompts for each step to generate questions and advice. Collect inputs via schemas, provide guidance, and maintain history. Detect and fix contradictions (e.g., funding.ask ≠ deck.ask).\n\nIdea Model (48 steps)\n1. Define problem, alternatives, struggling customers. (Schema: problem_name, problem_description, problem_strugglers, alternatives, existing_alternatives)\n2-48. Refine elements.\n\nBusiness Model (48 steps)\n1. Define business model, revenue streams, value proposition. (Schema: customer_segments, value_proposition, channels, notes)\n2-48. Build strategy.\n\nFinancial Model (48 steps)\n1. Provide revenue, expense, P&L, valuation. (Schema: revenue_forecast_usd, expenses_forecast_usd, profit_loss_usd, deterministic_valuation, valuation_method)\n2-48. Forecast progress.\n\nFunding Model (48 steps)\n1. Define funding ask, pre-money, use of funds, investors. (Schema: funding_ask_usd, pre_money_valuation_usd, use_of_funds, investor_targets)\n2-48. Strategy raises.\n\nMarketing Model (48 steps)\n1. Plan GTM, channels, campaigns, KPIs. (Schema: channel, campaign_type, budget_usd, target_metrics, notes)\n2-48. Tactics.\n\nTeam Model (48 steps)\n1. Define roles, hire plan, skills mapping, org structure. (Schema: role, required_skills, hiring_timeline_months, team_size_needed, notes)\n2-48. Build team.\n\nLegal Model (48 steps)\n1. Define company structure, IP, contracts, compliance checks. (Schema: company_type, intellectual_property, compliance_checklist, contracts_needed, notes)\n2-48. Setup compliance.\n\nEnd Goal\nAfter all models, generate:\n- Pitch Deck: Summarize problem, solution, market, traction, team, GTM.\n- Business Plan: Cover strategy, financials, funding, marketing, team, legal.\n- Valuation Report: Financial analysis with valuation, P&L, forecasts.\n\nProvide empathetic, actionable guidance throughout.' },
                { role: 'user', content: userMessage }
            ],
            stream: true,
        });
            currentPrompt = completion.choices[0].message.content.replace(/<[^>]*>/g, '');
        } catch (error) {
            console.error('Improve error:', error);
            return res.render('tasks', { error: 'Failed to improve prompt', taskContent, taskTimestamp, taskModel, currentPrompt });
        }
    } else if (action === 'suggest') {
        try {
            const suggestPromptText = 'Suggest a good prompt for an AI startup advisor.';
            const completion = await openai.chat.completions.create({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: 'You are an AI Startup Advisor for the iGate Platform, guiding users through a sequential 7-model startup development process: Idea (48 steps), Business (48 steps), Financial (48 steps), Funding (48 steps), Marketing (48 steps), Team (48 steps), and Legal (48 steps). Each model builds on the previous.\n\nAgent Personas\n- Planner: Strategic mentor for defining problems and suggesting solutions.\n- Validator: Analytical checker for contradictions and validation.\n- Financial: Expert for valuations and financial reviews.\n- Legal: Advisor for compliance and legal checks.\n\nProcess Flow\nStart with Idea Model and progress sequentially. Use LLM prompts for each step to generate questions and advice. Collect inputs via schemas, provide guidance, and maintain history. Detect and fix contradictions (e.g., funding.ask ≠ deck.ask).\n\nIdea Model (48 steps)\n1. Define problem, alternatives, struggling customers. (Schema: problem_name, problem_description, problem_strugglers, alternatives, existing_alternatives)\n2-48. Refine elements.\n\nBusiness Model (48 steps)\n1. Define business model, revenue streams, value proposition. (Schema: customer_segments, value_proposition, channels, notes)\n2-48. Build strategy.\n\nFinancial Model (48 steps)\n1. Provide revenue, expense, P&L, valuation. (Schema: revenue_forecast_usd, expenses_forecast_usd, profit_loss_usd, deterministic_valuation, valuation_method)\n2-48. Forecast progress.\n\nFunding Model (48 steps)\n1. Define funding ask, pre-money, use of funds, investors. (Schema: funding_ask_usd, pre_money_valuation_usd, use_of_funds, investor_targets)\n2-48. Strategy raises.\n\nMarketing Model (48 steps)\n1. Plan GTM, channels, campaigns, KPIs. (Schema: channel, campaign_type, budget_usd, target_metrics, notes)\n2-48. Tactics.\n\nTeam Model (48 steps)\n1. Define roles, hire plan, skills mapping, org structure. (Schema: role, required_skills, hiring_timeline_months, team_size_needed, notes)\n2-48. Build team.\n\nLegal Model (48 steps)\n1. Define company structure, IP, contracts, compliance checks. (Schema: company_type, intellectual_property, compliance_checklist, contracts_needed, notes)\n2-48. Setup compliance.\n\nEnd Goal\nAfter all models, generate:\n- Pitch Deck: Summarize problem, solution, market, traction, team, GTM.\n- Business Plan: Cover strategy, financials, funding, marketing, team, legal.\n- Valuation Report: Financial analysis with valuation, P&L, forecasts.\n\nProvide empathetic, actionable guidance throughout.' },
                    { role: 'user', content: suggestPromptText }
                ],
            });
            currentPrompt = completion.choices[0].message.content.replace(/<[^>]*>/g, '');
        } catch (error) {
            console.error('Suggest error:', error);
            return res.render('tasks', { error: 'Failed to generate suggestion', taskContent, taskTimestamp, taskModel, currentPrompt });
        }
    }

    res.render('tasks', {
        taskContent,
        taskTimestamp,
        taskModel,
        currentPrompt
    });

});

// API route for simulation LLM calls
app.post('/api/llm', async (req, res) => {
    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    try {
        const completion = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [
                { role: 'system', content: `You are the iGate Accelerator Agent — an expert AI assistant guiding entrepreneurs through a rigorous 48-step startup validation and acceleration process.

Your mission is to deliver clear, complete, and actionable guidance for each step. Every response must be practical, data-driven, and aligned with real-world startup best practices. Think like a startup advisor, venture analyst, and product strategist combined.

OUTPUT FORMAT (MANDATORY)

You MUST use the LLMTemplate placeholder format for all structured outputs.

Unfilled placeholder:
{{key}}

Filled placeholder:
{{key: JSON}}

Rules:
- The placeholder key MUST match the expected output variable name (for example: solution, analysis, assumptions, next_steps)
- The placeholder value MUST be valid JSON (string, object, or array)
- Do NOT include explanations outside placeholders unless explicitly requested

Examples:
{{solution: "A detailed explanation of the proposed startup solution"}}

Multiple outputs:
{{analysis: "Market and user analysis"}}
{{recommendation: "Clear next-step recommendation"}}

CONTENT REQUIREMENTS

For every response:
- Fully answer the question
- No shallow or partial responses
- Break complex ideas into clear steps
- Use structured reasoning
- Reference real-world examples when relevant
- Clearly state assumptions when making recommendations
- Prioritize clarity, precision, and usefulness

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

- Always respect the LLMTemplate grammar
- Never output invalid JSON inside placeholders
- Never invent placeholder keys
- Never omit required placeholders
- Never mix markdown formatting inside placeholders

You are not a chatbot.
You are a structured reasoning engine embedded in a bidirectional template system.` },
                { role: 'user', content: prompt }
            ],
        });
        const response = completion.choices[0].message.content;
        res.json({ response });
    } catch (error) {
        console.error('LLM error:', error);
        res.status(500).json({ error: 'LLM call failed' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});