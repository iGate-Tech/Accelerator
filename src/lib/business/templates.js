// Template functions
import { extractKeysFromPrompt } from '../ui/llm-template.js';
export const basePromptStructure = (instructions, variables, outputKeys, problemStatement = '', lang = 'en') => {
  // Handle bilingual instructions
  let instructionContent = instructions;
  if (instructions && typeof instructions === 'object') {
    instructionContent = instructions[lang] || instructions['en'] || '';
  }

  return `
${problemStatement ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT: THE STARTUP PROBLEM
${problemStatement}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

` : ''}${instructionContent}

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
};

export const systemPromptTemplate = (variables, detailedPrompt, lang = 'en') => {
  const outputKeys = extractKeysFromPrompt(detailedPrompt);
  return basePromptStructure(detailedPrompt, variables, outputKeys, '', lang);
};

export const standardPromptTemplate = (detailedPrompt, variables, lang = 'en') => {
  const outputKeys = extractKeysFromPrompt(detailedPrompt);
  return basePromptStructure(detailedPrompt, variables, outputKeys, '', lang);
};

export const standardPromptTemplateWithProblem = (detailedPrompt, variables, problemStatement, lang = 'en') => {
  // Handle bilingual prompts
  let promptContent = detailedPrompt;
  if (detailedPrompt && typeof detailedPrompt === 'object') {
    promptContent = detailedPrompt[lang] || detailedPrompt['en'] || '';
  }

  const outputKeys = extractKeysFromPrompt(promptContent);
  return basePromptStructure(promptContent, variables, outputKeys, problemStatement);
};

export const validationPromptTemplate = (
  detailedPrompt,
  variables,
  lang = 'en'
) => {
  // Handle bilingual prompts
  let promptContent = detailedPrompt;
  if (detailedPrompt && typeof detailedPrompt === 'object') {
    promptContent = detailedPrompt[lang] || detailedPrompt['en'] || '';
  }

  const outputKeys = extractKeysFromPrompt(detailedPrompt);
  return `
You are the iGate Accelerator Agent — an expert startup advisor.

${promptContent}

Embed the key facts as ${outputKeys.map((key) => `{{${key}: true/false}, {message: "reason"}}`).join(", ")}.

OUTPUT FORMAT: Provide validation and reasoning in clear Markdown.
`;
};

export const validationPromptTemplateWithProblem = (
  detailedPrompt,
  variables,
  problemStatement = '',
  lang = 'en'
) => {
  // Handle bilingual prompts
  let promptContent = detailedPrompt;
  if (detailedPrompt && typeof detailedPrompt === 'object') {
    promptContent = detailedPrompt[lang] || detailedPrompt['en'] || '';
  }

  const outputKeys = extractKeysFromPrompt(detailedPrompt);
  return `
${problemStatement ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT: THE STARTUP PROBLEM
${problemStatement}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

` : ''}You are the iGate Accelerator Agent — an expert startup advisor.

${promptContent}

Embed the key facts as ${outputKeys.map((key) => `{{${key}: true/false}, {message: "reason"}}`).join(", ")}.

OUTPUT FORMAT: Provide validation and reasoning in clear Markdown.
`;
};

export const generationPromptTemplate = (
  detailedPrompt,
  variables,
  lang = 'en'
) => {
  // Handle bilingual prompts
  let promptContent = detailedPrompt;
  if (detailedPrompt && typeof detailedPrompt === 'object') {
    promptContent = detailedPrompt[lang] || detailedPrompt['en'] || '';
  }

  const outputKeys = extractKeysFromPrompt(detailedPrompt);
  return `
You are the iGate Accelerator Agent — an expert startup advisor.

${promptContent}

Ensure the output is professional, comprehensive, and investor-ready. Embed the full content as {{${outputKeys[0]}: "complete markdown content"}}.

OUTPUT FORMAT: Generate in markdown format with proper sections, tables, and formatting. Do not wrap the entire response in triple backticks or any code fence; return plain markdown content.
`;
};

export const generationPromptTemplateWithProblem = (
  detailedPrompt,
  variables,
  problemStatement = '',
  lang = 'en'
) => {
  // Handle bilingual prompts
  let promptContent = detailedPrompt;
  if (detailedPrompt && typeof detailedPrompt === 'object') {
    promptContent = detailedPrompt[lang] || detailedPrompt['en'] || '';
  }

  const outputKeys = extractKeysFromPrompt(detailedPrompt);
  return `
${problemStatement ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT: THE STARTUP PROBLEM
${problemStatement}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

` : ''}You are the iGate Accelerator Agent — an expert startup advisor.

${promptContent}

Ensure the output is professional, comprehensive, and investor-ready. Embed the full content as {{${outputKeys[0]}: "complete markdown content"}}.

OUTPUT FORMAT: Generate in markdown format with proper sections, tables, and formatting. Do not wrap the entire response in triple backticks or any code fence; return plain markdown content.
`;
};
