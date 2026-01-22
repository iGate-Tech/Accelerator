import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step10 = {
  id: "step10",
  name: "Value Proposition",
  model: "Business Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "alternatives", "evidence"],
  detailedPrompt: `
The original problem is: {{problem}}

Based on the solution {{solution}} designed to solve this problem:

Craft a compelling value proposition that directly addresses {{problem}}.
Compare against alternatives {{alternatives}} and use evidence {{evidence}}.

Your response MUST be about {{problem}}. Do not generate content for unrelated topics.

Highlight:
- {{valueProp: "Clear, concise value proposition statement directly related to {{problem}}"}}
- {{uniqueBenefits: "Specific benefits that solve {{problem}}, tied to {{evidence}}"}}
- {{quantifiedValue: "Quantified value for solving {{problem}}, such as cost savings, time reductions, or ROI"}}
- {{targetCustomers: "Target customers who have {{problem}}"}}
Use professional Markdown with persuasive language tied to {{problem}}.
`,
  validate: (context) => ({ valid: true, issues: [] }),
};