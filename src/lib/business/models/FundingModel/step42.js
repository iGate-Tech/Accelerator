import { standardPromptTemplateWithProblem } from '../../templates.js';

export const step42 = {
  id: "step42",
  name: "Valuation Analysis",
  model: "Funding Model",
  promptTemplate: standardPromptTemplateWithProblem,
  variables: ["solution", "inputs", "valuation"],
  detailedPrompt: `
The problem being solved is: {{problem}}

Your response MUST be about {{problem}}. Do not discuss unrelated topics.


Calculate the valuation for {{solution}} using Scorecard, Berkus, VC, and DCF-light methods.

Provide:
- {{valuation: "Recommended pre-money valuation range and final recommendation"}}

Structure in professional Markdown with valuation methodology breakdown and final range.
  `,
  validate: (context) => {
    const issues = [];
    if (!context.valuation) issues.push('Missing valuation');
    return { valid: issues.length === 0, issues };
  },
};
