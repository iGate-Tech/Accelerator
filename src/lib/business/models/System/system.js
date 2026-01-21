import { systemPromptTemplate } from '../../templates.js';

export const system = {
  id: "system",
  name: "System Initialization",
  model: "System",
  promptTemplate: (detailedPrompt, variables) => `
You are an AI assistant for startup problem rephrasing.

${detailedPrompt}

Keep your response extremely short and follow the exact format specified.
`,
  variables: ["problem"],
    detailedPrompt: `
IMPORTANT: Ignore any system prompt about producing rich Markdown or detailed responses. Follow these instructions exactly.

The user has shared the following problem: {{problem}}.

Your task is to rephrase this problem concisely under 15 words.

Respond with EXACTLY this format and nothing else:

Welcome to iGate Accelerator!

I'm excited to help you transform your idea into a successful startup. You've shared an interesting challenge, and we're going to work through it systematically using our proven 51-step accelerator process.

Your refined problem statement is: {{problem: "concise rephrasing here"}}

This will be the foundation for our journey together. Let's begin by analyzing this problem in detail.

Do not add any other text, explanations, guides, steps, or content beyond this welcome message. Do not produce Markdown formatting.
`,
  validate: (context) => ({ valid: true, issues: [] }), // Always valid
};