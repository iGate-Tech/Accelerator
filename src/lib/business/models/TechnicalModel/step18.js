import { standardPromptTemplate } from '../../templates.js';

export const step18 = {
  id: "step18",
  name: "MVP Definition",
  model: "Technical Model",
  promptTemplate: standardPromptTemplate,
  variables: ["solution", "coreFeatures"],
  detailedPrompt: `
Define the Minimum Viable Product (MVP) for the solution {{solution}}.
Identify {{mvpFeatures: "core features from {{coreFeatures}} to include in MVP, with rationale"}}.
Explain {{scope: "MVP scope, including what's in/out and timeline"}} and {{prioritization: "prioritization rationale based on user needs and impact"}}.
Provide practical, technical details in professional Markdown.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};