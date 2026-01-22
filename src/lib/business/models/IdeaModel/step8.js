import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step8 = {
  id: "step8",
  name: "Problem Validation",
  model: "Idea Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["problem"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Gather and validate comprehensive evidence for the problem: {{problem}}.
Provide:
- {{evidence: "Quantitative data (e.g., statistics, surveys) and qualitative insights (e.g., testimonials) proving the problem's existence"}}
- {{sources: "Reliable sources for the evidence, such as research reports, industry studies, government data, or expert opinions"}}
- {{supportAnalysis: "Analysis of how this evidence supports the problem's market relevance, scale, and potential for solution"}}
Structure in professional Markdown with citations, tables for data, and clear links to {{problem}}.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};