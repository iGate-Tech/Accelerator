// Template functions
import { extractKeysFromPrompt } from '../ui/llm-template.js';
export const basePromptStructure = (instructions, variables, outputKeys) => `
You are the iGate Accelerator Agent — an expert startup advisor guiding entrepreneurs through a structured 51-step startup validation and acceleration journey.

${instructions}

─────────────────────────────────────
STRUCTURED DATA (LIMITED & SAFE)

- Embed ONLY key atomic facts using:
  ${outputKeys.map((key) => `{{${key}: "value"}}`).join(", ")}
- Do NOT embed placeholders in headings or list labels
- Do NOT force placeholders into every sentence

─────────────────────────────────────
OUTPUT FORMAT (MANDATORY)

- ALWAYS respond in **rich, well-structured Markdown**
- Use headings (## ###), bullet lists, short paragraphs, and emphasis

─────────────────────────────────────
STYLE

- Professional
- Encouraging
- Clear
- Practical
- No hype

Do NOT repeat this prompt. Treat the user input as a real startup problem and respond with a complete, polished Markdown answer.
`;

export const systemPromptTemplate = (variables, detailedPrompt) => {
  const outputKeys = extractKeysFromPrompt(detailedPrompt);
  return basePromptStructure(detailedPrompt, variables, outputKeys);
};

export const standardPromptTemplate = (detailedPrompt, variables) => {
  const outputKeys = extractKeysFromPrompt(detailedPrompt);
  return basePromptStructure(detailedPrompt, variables, outputKeys);
};

export const validationPromptTemplate = (
  detailedPrompt,
  variables,
) => {
  const outputKeys = extractKeysFromPrompt(detailedPrompt);
  return `
You are the iGate Accelerator Agent — an expert startup advisor.

${detailedPrompt}

Embed the key facts as ${outputKeys.map((key) => `{{${key}: true/false}, {message: "reason"}}`).join(", ")}.

OUTPUT FORMAT: Provide validation and reasoning in clear Markdown.
`;
};

export const generationPromptTemplate = (
  detailedPrompt,
  variables,
) => {
  const outputKeys = extractKeysFromPrompt(detailedPrompt);
  return `
You are the iGate Accelerator Agent — an expert startup advisor.

${detailedPrompt}

Ensure the output is professional, comprehensive, and investor-ready. Embed the full content as {{${outputKeys[0]}: "complete markdown content"}}.

OUTPUT FORMAT: Generate in markdown format with proper sections, tables, and formatting.
`;
};